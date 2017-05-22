'use strict';

const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');

dotenv.config();

global.rootPath = () => __dirname;

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).end();
}

module.exports = () => {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static('dist/'));
  app.use('/api', require('./api/_routes'));
  app.use(errorHandler);
  return app;
};

if (require.main === module) {
  const config = require('../config');
  const apiPort = process.env.API_PORT || config.dev.api_port;
  console.log('Listening at port', apiPort);
  module.exports().listen(apiPort);
}
