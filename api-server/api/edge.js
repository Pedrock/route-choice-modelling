'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { addPlaceIdAndDistances, addLocation } = require('../utils/gmaps');

router.get('/', (req, res, next) => {
  if (req.query.dest === undefined || ['id', 'forward'].every(p => req.query[p] === undefined)) {
    res.status(400).end();
    return;
  }

  const help = req.query.help !== undefined;
  const forward = req.query.forward !== undefined;

  (forward ? db.goForward(req.query.forward) : db.getEdgePoint(req.query.id))
  .then(info => ((help ? addPlaceIdAndDistances : addLocation)(info, Number(req.query.dest))))
  .then((info) => {
    res.status(200).json(info).end();
  }).catch(next);
});

module.exports = router;
