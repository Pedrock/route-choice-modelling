'use strict';

const _ = require('lodash');
const db = require('../db/db');
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GMAPS_SERVER_KEY,
  Promise,
});


const distancesRequest = (origins, destinations) =>
  googleMapsClient.distanceMatrix({ origins, destinations }).asPromise().then(r => r.json);

const roadsRequest = path => googleMapsClient.snapToRoads({ path }).asPromise().then(r => r.json);

function getEdgesCoords(inputEdges) {
  return db.edgeArrayToEdgepoints(inputEdges)
  .then((edges) => {
    const cachedResults = _(edges)
    .filter(edge => edge.placeid !== null)
    .map(({ edgeid, latitude, longitude, placeid }) => ({
      edgeid,
      location: { latitude, longitude },
      placeId: placeid,
    }))
    .keyBy('edgeid')
    .value();

    const newEdges = edges.filter(({ edgeid }) => cachedResults[edgeid] === undefined);

    return Promise.all(newEdges.map(edge => roadsRequest(edge.path)))
    .then((results) => {
      db.storeGmapsEdges(_.zipWith(results, newEdges,
        (r, { edgeid }) => Object.assign(r, { edgeid })));
      return results;
    })
    .then(results => results.map(({ snappedPoints }) => _.pick(_.last(snappedPoints), ['location', 'placeId'])))
    .then(results => _.zipObject(newEdges.map(e => e.edgeid), results))
    .then(results => Object.assign({}, cachedResults, results));
  });
}

module.exports.addTimeToEdgesInfo = function addTimeToEdgesInfo(info, destinationEdge) {
  if (!info.edges.length) return info;

  const originEdge = info.location.edge;
  const edgeChoices = info.edges.map(edge => edge.id);

  const neededEdges = [originEdge, ...edgeChoices, destinationEdge];

  getEdgesCoords(neededEdges)
  .then((places) => {
    const origin = places[originEdge].location;
    const intermediatePoints = edgeChoices.map(edge => places[edge].location);
    const destination = places[destinationEdge].location;

    return Promise.all([
      distancesRequest([origin], intermediatePoints), // returns 1 row with N elements
      distancesRequest(intermediatePoints, [destination]), // returns N rows with 1 element
    ]);
  })
  .then(([response1, response2]) => {
    console.log(JSON.stringify(response1, null, 4));
    console.log(JSON.stringify(response2, null, 4));
  });

  return info;
};
