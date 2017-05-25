'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.post('/', (req, res, next) => {
  if (req.body.routes === undefined || req.body.form === undefined) {
    res.status(400).end();
    return;
  }

  console.log(req.body);

  db.storeData(req.body).then(() => {
    res.status(200).end();
  }).catch(next);
});

module.exports = router;
