'use strict';

require('dotenv').config();

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
        const { edge, polyline } = row;
        return { id: edge, polyline };
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

module.exports.storeData = function storeData(data) {
  return Promise.resolve(data);
};
