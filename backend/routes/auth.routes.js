const express = require('express');
const authenticate   = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { register, login, cancelMembership } = require('../controllers/auth.controller');

const router = express.Router();
router.post('/register', register);
router.post('/login',    login);
router.post('/cancel-membership/:userId', authenticate, roleMiddleware(['admin', 'trainer']), cancelMembership);

module.exports = router;