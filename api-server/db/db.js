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

function auxGetChoices(edgepointQuery) {
  return knex
  .select(knex.raw('toedgeid AS id, ST_AsEncodedPolyline(geometry) AS polyline, ' +
    'edgepoint, latitude AS lat, longitude AS lng'))
  .from(edgepointQuery)
  .join('edgepoints', 'edgepoints.id', 'edgepoint')
  .join('points', 'pointid', 'points.id')
  .leftJoin('connections', function leftJoin() {
    this.on('fromedgeid', '=', 'edgepoints.edgeid').andOn(knex.raw('allow = 1'));
  })
  .leftJoin('edges', 'edges.id', 'toedgeid')
  .groupBy('toedgeid', 'edgepoint', 'latitude', 'longitude', 'geometry')
  .then((rows) => {
    if (rows.length === 0) {
      throw new Error('Point not found');
    }
    const { edgepoint, lat, lng } = rows[0];
    const location = { edgepoint, lat, lng };
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
  return auxGetChoices(knex.raw('getNextEdgePoint(?) AS edgepoint', edgeId));
};

module.exports.getEdgePoint = function goForward(edgepoint) {
  return auxGetChoices(knex.raw('(SELECT ?::integer AS edgepoint) aux', edgepoint));
};
