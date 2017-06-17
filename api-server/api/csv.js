'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const auth = require('basic-auth');

const columns = ['id', 'age', 'gender', 'experience', 'help', 'fromedge', 'toedge'];
const separator = ',';

const requireLogin = (req, res, next) => {
  const user = auth(req);
  const { ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env;

  if (user === undefined || user.name !== username || user.pass !== password) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="RouteChoiceModelling"');
    res.end('Unauthorized');
  } else {
    next();
  }
};

router.get('/', requireLogin, (req, res, next) => {
  db.getChoices()
  .then((rows) => {
    res.attachment('data.csv');
    res.write(`${columns.join(separator)}\n`);
    rows.forEach((row) => {
      res.write(`${columns.map(col => row[col]).join(separator)}\n`);
    });
    res.end();
  })
  .catch(next);
});

module.exports = router;
