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

module.exports.goForward = function goForward(edgeId) {
  return knex
  .select(knex.raw('toedgeid AS edge, ST_AsEncodedPolyline(geometry) AS polyline, ' +
    'edgepoint, points.latitude, points.longitude'))
  .from(knex.raw('getNextEdgePoint(?) AS edgepoint', edgeId))
  .leftJoin('edgepoints', 'edgepoints.id', 'edgepoint')
  .leftJoin('points', 'pointid', 'points.id')
  .leftJoin('connections', function leftJoin() {
    this.on('fromedgeid', '=', 'edgepoints.edgeid').andOn(knex.raw('allow = 1'));
  })
  .leftJoin('edges', 'edges.id', 'toedgeid')
  .groupBy('toedgeid', 'edgepoint', 'latitude', 'longitude', 'geometry')
  .then((rows) => {
    const { edgepoint, latitude, longitude } = rows[0];
    const point = { edgepoint, latitude, longitude };
    const edges = rows[0].edge === null
      ? []
      : rows.map((row) => {
        const { edge, polyline } = row;
        return { edge, polyline };
      });
    return Object.assign(point, { edges });
  });
};
