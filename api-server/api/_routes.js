'use strict';

const express = require('express');
const router = express.Router();

router.use('/edge', require('./edge'));
router.use('/store', require('./store'));
router.use('/csv', require('./csv'));

module.exports = router;
