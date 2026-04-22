const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { getAllTrainers, addTrainer, deleteTrainer } = require('../controllers/trainer.controller');

const router = express.Router();

router.get('/', authenticate, getAllTrainers);
router.post('/', authenticate, roleMiddleware(['admin']), addTrainer);
router.delete('/:id', authenticate, roleMiddleware(['admin']), deleteTrainer);

module.exports = router;