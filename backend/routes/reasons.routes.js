const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const { submitReason } = require('../controllers/reasons.controller');
const router = express.Router();
router.post('/submit', authenticate, submitReason);
module.exports = router;