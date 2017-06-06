'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex')(require('../knexfile'));

global.rootPath = () => __dirname;

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).end();
}

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('dist/'));
app.use('/api', require('./api/_routes'));
app.use(errorHandler);

knex.migrate.latest()
.then(() => console.log('Migrations finished'))
.then(() => {
  const config = require('../config');
  const apiPort = process.env.API_PORT || config.dev.api_port;
  console.log('Listening at port', apiPort);
  app.listen(apiPort);
});
