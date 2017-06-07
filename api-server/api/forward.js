'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { addTimeToEdgesInfo } = require('../utils/gmaps');

router.get('/', (req, res, next) => {
  if (['edge', 'dest'].some(p => req.query[p] === undefined)) {
    res.status(400).end();
    return;
  }

  db.goForward(req.query.edge)
  .then(info => addTimeToEdgesInfo(info, Number(req.query.dest)))
  .then((info) => {
    res.status(200).json(info).end();
  }).catch(next);
});

module.exports = router;
