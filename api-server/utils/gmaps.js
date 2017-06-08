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

const roadsRequest = path =>
  googleMapsClient.snapToRoads({ path, interpolate: true })
  .asPromise().then(r => r.json);

function getGoogleEdgesCoords(inputEdges) {
  return db.getUnknownEdges(inputEdges)
  .then(unknownEdges =>
    Promise.all(unknownEdges.map(edge => roadsRequest(edge.path)))
    .then(results => db.storeGmapsEdges(_.zipWith(results, unknownEdges,
      (r, { edgeid }) => Object.assign(r, { edgeid })))))
  .then(() => db.getGmapsEdges(inputEdges))
  .then(results => _.keyBy(results, 'edgeid'));
}

function getGoogleLocation(edge) {
  return getGoogleEdgesCoords([edge]).then(places => _.pick(places[edge], ['lat', 'lng']));
}

function getEdgesWithTimeInfo(info, destinationEdge) {
  if (!info.edges.length) return info.edges;

  const originEdge = info.location.edge;
  const edgeChoices = info.edges.map(edge => edge.id);

  const neededEdges = [originEdge, ...edgeChoices, destinationEdge];

  return getGoogleEdgesCoords(neededEdges)
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
    db.storeGmapsDistances(results).catch(console.error);
    return results.concat(cachedDistances);
  })
  .then(arr => _.keyBy(arr, e => `${e.fromedgeid},${e.toedgeid}`))
  .then(distances => info.edges.map((e) => {
    const part1 = distances[`${originEdge},${e.id}`];
    const part2 = distances[`${e.id},${destinationEdge}`];
    return Object.assign({}, e, {
      distance: part1.distance + part2.distance,
      duration: part1.duration + part2.duration,
    });
  }));
}

module.exports.addPlaceIdAndDistances = function addPlaceIdAndDistances(info, destinationEdge) {
  return Promise.all([
    getGoogleLocation(info.location.edge),
    getEdgesWithTimeInfo(info, destinationEdge),
  ]).then(([googleLocation, edges]) => ({
    location: Object.assign({}, info.location, googleLocation),
    edges,
  }));
};

module.exports.addLocation = function routeWithInformation(info) {
  return getGoogleLocation(info.location.edge)
  .then(googleLocation => ({
    location: Object.assign({}, info.location, googleLocation),
    edges: info.edges,
  }));
};
