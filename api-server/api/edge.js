'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { addLocationAndDistances, addLocation, getGoogleLocation } = require('../utils/gmaps');

router.get('/', (req, res, next) => {
  if (req.query.dest === undefined || ['id', 'forward'].every(p => req.query[p] === undefined)) {
    res.status(400).end();
    return;
  }

  const help = req.query.help !== undefined;
  const forward = req.query.forward !== undefined;
  const destEdge = Number(req.query.dest);

  (forward ? db.goForward(req.query.forward) : db.getEdgeInfo(req.query.id))
  .then(info => ((help ? addLocationAndDistances : addLocation)(info, destEdge)))
  .then((info) => {
    if (forward) return info;
    return getGoogleLocation(destEdge)
    .then(dest => Object.assign({}, info, { dest }));
  })
  .then((info) => {
    res.status(200).json(info).end();
  }).catch(next);
});

module.exports = router;
