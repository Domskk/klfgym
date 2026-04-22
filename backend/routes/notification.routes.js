const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { 
  sendMembershipExpiryNotifications, 
  sendReEngagementNotifications 
} = require('../controllers/notification.controller');

const router = express.Router();

// Admin only routes
router.post('/send-expiry', 
  authenticate, 
  roleMiddleware(['admin']), 
  sendMembershipExpiryNotifications
);

router.post('/send-re-engagement', 
  authenticate, 
  roleMiddleware(['admin']), 
  sendReEngagementNotifications
);

module.exports = router;