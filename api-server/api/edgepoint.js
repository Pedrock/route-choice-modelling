'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', (req, res, next) => {
  if (req.query.id === undefined) {
    res.status(400).end();
    return;
  }

  db.getEdgePoint(req.query.id).then((info) => {
    res.status(200).json(info).end();
  }).catch(next);
});

module.exports = router;
