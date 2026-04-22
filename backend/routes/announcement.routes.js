const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { 
  createAnnouncement, 
  updateAnnouncement, 
  getAnnouncements, 
  deleteAnnouncement 
} = require('../controllers/announcement.controller');

const router = express.Router();

router.post('/', authenticate, roleMiddleware(['admin']), createAnnouncement);
router.put('/:id', authenticate, roleMiddleware(['admin']), updateAnnouncement);  // ← Added PUT
router.get('/', getAnnouncements);
router.delete('/:id', authenticate, roleMiddleware(['admin']), deleteAnnouncement);

module.exports = router;