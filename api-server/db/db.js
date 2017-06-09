'use strict';

const _ = require('lodash');
const knex = require('knex')(require('../../knexfile'));

knex.selectRaw = function selectRaw(...args) {
  return this.select(this.raw(...args));
};

function auxGetChoices(pathQuery) {
  return knex.selectRaw(`
     toedgeid AS edge,
     path,
     ST_AsEncodedPolyline(edges.geometry) AS polyline,
     curr_edge.id AS curr_edge_id,
     getEdgeFinalHeading(curr_edge.id) AS heading,
     ST_AsEncodedPolyline(curr_edge.geometry) AS curr_polyline,
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
     path`, pathQuery)
  .then((rows) => {
    if (rows.length === 0) {
      throw new Error('Point not found');
    }
    const { curr_edge_id, heading, curr_polyline, path } = rows[0];
    const location = { edge: curr_edge_id, heading, polyline: curr_polyline, path };
    const edges = rows[0].edge === null
      ? []
      : rows.map((row) => {
        const { edge, polyline } = row;
        return { id: edge, polyline };
      });
    return { location, edges };
  });
}

module.exports.goForward = function goForward(edgeId) {
  return auxGetChoices(knex.raw('getPathToIntersectionFromEdge(?)', edgeId));
};

module.exports.getEdgeInfo = function getEdgeInfo(edge) {
  return auxGetChoices(knex.raw('ARRAY[?]::integer[]', edge));
};

module.exports.getUnknownEdges = function edgeArrayToEdgepoints(edgeArray) {
  return knex
  .selectRaw(`edgeid, path
    FROM (
      SELECT edgeid, array_agg(latitude || ',' || longitude ORDER BY index) AS path
      FROM edgepoints
      JOIN points ON (pointid = points.id)
      WHERE edgeid = ANY(?)
      GROUP BY edgeid
    ) aux
    LEFT JOIN gmaps_edges USING (edgeid)
    WHERE gmaps_edges.edgeid IS NULL`, [edgeArray]);
};

module.exports.storeData = function storeData(obj) {
  return knex.selectRaw('insertCompletedSurvey(?)', JSON.stringify(obj));
};

module.exports.getGmapsEdges = function getGmapsEdges(edges) {
  return knex.selectRaw(`
    edgeid, ST_Y(point) AS lat, ST_X(point) AS lng
    FROM (
      SELECT edgeid,
        ST_LineInterpolatePoint(geometry, CASE WHEN ST_Length(geometry, TRUE) <= 8 THEN 0
                                          ELSE (ST_Length(geometry, TRUE) - 8) / ST_Length(geometry, TRUE) END) AS point
      FROM gmaps_edges
      WHERE edgeid = ANY(?)
    ) aux;
  `, [edges]);
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
  return knex.raw(`${knex('gmaps_edges').insert(rows)} ON CONFLICT DO NOTHING`);
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
  return knex.raw(`${knex('gmaps_distances').insert(rows)} ON CONFLICT DO NOTHING`);
};
