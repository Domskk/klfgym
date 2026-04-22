const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { scanQR, getTodayAttendance, getMyAttendance } = require('../controllers/attendance.controller');

const router = express.Router();
router.post('/scan', authenticate, roleMiddleware(['admin', 'trainer']), scanQR);
router.get('/today', authenticate, roleMiddleware(['admin', 'trainer']), getTodayAttendance);

router.get('/my', authenticate, getMyAttendance);
module.exports = router;