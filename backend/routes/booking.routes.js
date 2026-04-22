const express = require('express');
const router  = express.Router();
const authenticate    = require('../middleware/auth.middleware');
const roleMiddleware  = require('../middleware/role.middleware');
const {
  createBooking,
  getMyBookings,
  getTrainerBookings,
  updateBookingStatus,
} = require('../controllers/booking.controller');

// Member routes
router.post('/',    authenticate, createBooking);
router.get('/my',   authenticate, getMyBookings);

// Admin routes
router.get('/trainer/:trainerId', authenticate, roleMiddleware(['admin']), getTrainerBookings);
router.patch('/:id/status',       authenticate, roleMiddleware(['admin']), updateBookingStatus);

module.exports = router;