const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const {
  scanQR,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getUserAttendance,
  getUserAnalytics,
} = require('../controllers/attendance.controller');

const router = express.Router();

// ── QR Scanning & Check-in/out ────────────────────────────────────────────────
// POST /attendance/scan — Admin/Trainer scans QR (smart check-in/out)
router.post('/scan', authenticate, roleMiddleware(['admin', 'trainer']), scanQR);

// POST /attendance/checkout/:logId — Member explicitly checks out
router.post('/checkout/:logId', authenticate, checkOut);

// ── Attendance Records ─────────────────────────────────────────────────────────
// GET /attendance/today — Admin/Trainer views today's attendance
router.get('/today', authenticate, roleMiddleware(['admin', 'trainer']), getTodayAttendance);

// GET /attendance/my — Member views their last N attendance logs
router.get('/my', authenticate, getMyAttendance);

// ── Activity Tab Endpoints ─────────────────────────────────────────────────────
// GET /users/attendance — Member views all their attendance logs (for Activity tab)
router.get('/users/attendance', authenticate, getUserAttendance);

// GET /users/analytics — Member views their engagement analytics (for Activity tab)
router.get('/users/analytics', authenticate, getUserAnalytics);

module.exports = router;