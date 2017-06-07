'use strict';

const _ = require('lodash');
const db = require('../db/db');
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GMAPS_SERVER_KEY,
  Promise,
});


const distancesRequest = (origins, destinations) => {
  if (origins.length === 0 || destinations.length === 0) {
    return Promise.resolve(null);
  }
  return googleMapsClient.distanceMatrix({ origins, destinations }).asPromise().then(r => r.json);
};

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
    const destination = places[destinationEdge].location;

    const pairs = [
      ...edgeChoices.map(toedgeid => ([originEdge, toedgeid])),
      ...edgeChoices.map(fromedgeid => ([fromedgeid, destinationEdge])),
    ];
    return db.getGmapsDistances(pairs)
    .then((cachedDistances) => {
      const unknownPairs = _.differenceWith(pairs, cachedDistances,
        (pair, cached) => pair[0] === cached.fromedgeid && pair[1] === cached.toedgeid);
      const unknownA = unknownPairs.filter(pair => pair[0] === originEdge)
      .map(pair => places[pair[1]].location);
      const unknownB = unknownPairs.filter(pair => pair[1] === destinationEdge)
      .map(pair => places[pair[0]].location);

      return Promise.all([
        distancesRequest([origin], unknownA), // returns 1 row with N elements
        distancesRequest(unknownB, [destination]), // returns N rows with 1 element
        Promise.resolve(cachedDistances),
      ]);
    });
  })
  .then(([resultsOrigin, resultsDest, cachedDistances]) => {
    const arr1 = resultsOrigin === null
      ? []
      : _.zipWith(resultsOrigin.rows[0].elements, edgeChoices,
        (elem, toedgeid) => Object.assign({ fromedgeid: originEdge, toedgeid }, elem));
    const arr2 = resultsDest === null
      ? []
      : _.zipWith(resultsDest.rows.map(r => r.elements[0]), edgeChoices,
        (elem, fromedgeid) => Object.assign({ fromedgeid, toedgeid: destinationEdge }, elem));

    const results = [...arr1, ...arr2].map(r => ({
      fromedgeid: r.fromedgeid,
      toedgeid: r.toedgeid,
      distance: r.distance.value,
      duration: r.duration.value,
    }));
    db.storeGmapsDistances(results);

    const all = results.concat(cachedDistances);

    console.log(JSON.stringify(all, null, 4));
  });

  return info;
};
