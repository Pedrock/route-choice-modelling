'use strict';

const _ = require('lodash');
const knex = require('knex')(require('../../knexfile'));

knex.selectRaw = function selectRaw(...args) {
  return this.select(this.raw(...args));
};

function auxGetChoices(pathQuery) {
  return knex.selectRaw(`*,
  ST_Y(ST_LineInterpolatePoint(curr_geom, fraction)) AS lat,
  ST_X(ST_LineInterpolatePoint(curr_geom, fraction)) AS lng
FROM (
       SELECT
         toedgeid AS edge,
         path,
         ST_AsEncodedPolyline(edges.geometry) AS polyline,
         curr_edge.id AS curr_edge_id,
         getEdgeFinalHeading(curr_edge.id) AS heading,
         ST_AsEncodedPolyline(curr_edge.geometry) AS curr_polyline,
         CASE WHEN ST_Length(curr_edge.geometry, true) <= 8 THEN 0
         ELSE (ST_Length(curr_edge.geometry, TRUE) - 8) / ST_Length(curr_edge.geometry, TRUE) END
           AS fraction,
         curr_edge.geometry as curr_geom
       FROM (
              SELECT path[array_upper(path, 1)] AS curr_edge_id, path
              FROM (
                     SELECT ? AS path
                   ) aux3
            ) aux2
         INNER JOIN edges AS curr_edge ON curr_edge.id = curr_edge_id
         LEFT JOIN connections ON fromedgeid = curr_edge.id AND allow = 1
         LEFT JOIN edges ON edges.id = toedgeid
       GROUP BY toedgeid,
         edges.geometry,
         curr_edge.geometry,
         curr_edge.id,
         path
     ) AS aux;`, pathQuery)
  .then((rows) => {
    if (rows.length === 0) {
      throw new Error('Point not found');
    }
    const { curr_edge_id, lat, lng, heading, curr_polyline, path } = rows[0];
    const location = { edge: curr_edge_id, lat, lng, heading, polyline: curr_polyline, path };
    const edges = rows[0].edge === null
      ? []
      : rows.map((row) => {
        const { edge, polyline, endpoint_lat, endpoint_lng } = row;
        return { id: edge, polyline, lat: endpoint_lat, lng: endpoint_lng };
      });
    return { location, edges };
  });
}

module.exports.goForward = function goForward(edgeId) {
  return auxGetChoices(knex.raw('getPathToIntersectionFromEdge(?)', edgeId));
};

module.exports.getEdgePoint = function goForward(edge) {
  return auxGetChoices(knex.raw('ARRAY[?]::integer[]', edge));
};

module.exports.edgeArrayToEdgepoints = function edgeArrayToEdgepoints(edgeArray) {
  return knex
  .selectRaw(`edgeid, path, latitude, longitude, placeid
    FROM (
      SELECT edgeid, array_agg(latitude || ',' || longitude ORDER BY index) AS path
      FROM edgepoints
      JOIN points ON (pointid = points.id)
      WHERE edgeid = ANY(?)
      GROUP BY edgeid
    ) aux
    LEFT JOIN gmaps_edges USING (edgeid)`, [edgeArray]);
};

module.exports.storeData = function storeData(obj) {
  return knex.selectRaw('insertCompletedSurvey(?)', JSON.stringify(obj));
};

module.exports.storeGmapsEdges = function storeGmapsEdges(edges) {
  if (!edges.length) {
    return Promise.resolve();
  }
  const rows = edges.map((edge) => {
    const lastPoint = _.last(edge.snappedPoints);
    return {
      edgeid: edge.edgeid,
      placeid: lastPoint.placeId,
      latitude: lastPoint.location.latitude,
      longitude: lastPoint.location.longitude,
      snappedpoints: JSON.stringify(edge.snappedPoints),
    };
  });
  return knex.raw(`${knex('gmaps_edges').insert(rows)} ON CONFLICT DO NOTHING`)
  .catch(console.error);
};

module.exports.getGmapsDistances = function getGmapsDistances(pairs) {
  return knex.selectRaw(`*
    FROM gmaps_distances
    WHERE ARRAY[ARRAY[fromedgeid, toedgeid]] <@ ?;
  `, [pairs]);
};

module.exports.storeGmapsDistances = function storeGmapsDistances(rows) {
  if (!rows.length) {
    return Promise.resolve();
  }
  return knex.raw(`${knex('gmaps_distances').insert(rows)} ON CONFLICT DO NOTHING`)
  .catch(console.error);
};
