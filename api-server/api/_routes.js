'use strict';

const express = require('express');
const router = express.Router();

const db = require('../db/db');

router.get('/forward', (req, res) => {
  if (req.query.edge === undefined) {
    res.status(400).end();
    return;
  }

  db.goForward(req.query.edge).then((rows) => {
    res.status(200).json(rows).end();
  });
});


module.exports = router;
