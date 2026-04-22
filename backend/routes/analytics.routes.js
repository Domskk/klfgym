const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const {
  getDropoutRisk,
  getAtRiskMembers,
  refreshAllAnalytics,
} = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/dropout-risk/:userId', authenticate, getDropoutRisk);
router.get('/at-risk',              authenticate, getAtRiskMembers);
router.post('/refresh-all',         authenticate, refreshAllAnalytics); // call once to backfill

module.exports = router;