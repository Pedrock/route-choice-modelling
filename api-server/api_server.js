'use strict';

const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');

dotenv.config();

global.rootPath = () => __dirname;

module.exports = () => {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static('dist/'));
  app.use('/api', require('./api/_routes'));
  return app;
};

