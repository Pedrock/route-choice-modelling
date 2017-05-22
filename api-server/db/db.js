'use strict';

require('dotenv').config();

const knex = require('knex')({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

function auxGetChoices(edgeQuery) {
  function subQuery() {
    this.select('toedgeid AS id',
      knex.raw('ST_AsEncodedPolyline(edges.geometry) AS polyline'),
      'curr_edge.id AS curr_edge_id',
      knex.raw('getEdgeFinalHeading(curr_edge.id) AS heading'),
      knex.raw('ST_AsEncodedPolyline(curr_edge.geometry) AS curr_polyline'),
      knex.raw('CASE WHEN ST_Length(curr_edge.geometry, true) <= 8' +
        ' THEN 0' +
        ' ELSE (ST_Length(curr_edge.geometry, true) - 8) / ST_Length(curr_edge.geometry, true) END' +
        ' AS fraction'),
      'curr_edge.geometry AS curr_geom')
    .from(edgeQuery)
    .join('edgepoints', knex.raw('edgepoints.edgeid = edge AND index = (SELECT MAX(index) FROM edgepoints WHERE edgepoints.edgeid = edge)'))
    .join('points', 'pointid', 'points.id')
    .join('edges AS curr_edge', 'curr_edge.id', 'edgeid')
    .leftJoin('connections', function leftJoin() {
      this.on('fromedgeid', '=', 'edgepoints.edgeid').andOn(knex.raw('allow = 1'));
    })
    .leftJoin('edges', 'edges.id', 'toedgeid')
    .groupBy('toedgeid', 'edgepoints.id', 'latitude', 'longitude', 'edges.geometry', 'curr_edge.geometry', 'curr_edge.id')
    .as('aux');
  }

  return knex
  .select('*',
    knex.raw('ST_Y(ST_LineInterpolatePoint(curr_geom, fraction)) AS lat'),
    knex.raw('ST_X(ST_LineInterpolatePoint(curr_geom, fraction)) AS lng'))
  .from(subQuery)
  .then((rows) => {
    if (rows.length === 0) {
      throw new Error('Point not found');
    }
    const { curr_edge_id, lat, lng, heading, curr_polyline } = rows[0];
    const location = { edge: curr_edge_id, lat, lng, heading, polyline: curr_polyline };
    const edges = rows[0].edge === null
      ? []
      : rows.map((row) => {
        const { id, polyline } = row;
        return { id, polyline };
      });
    return { location, edges };
  });
}

module.exports.goForward = function goForward(edgeId) {
  return auxGetChoices(knex.raw('getNextEdge(?) AS edge', edgeId));
};

module.exports.getEdgePoint = function goForward(edge) {
  return auxGetChoices(knex.raw('(SELECT ?::integer AS edge) aux', edge));
};
