'use strict';

const express = require('express');
const router = express.Router();

router.use('/forward', require('./forward'));
router.use('/edgepoint', require('./edgepoint'));

module.exports = router;
