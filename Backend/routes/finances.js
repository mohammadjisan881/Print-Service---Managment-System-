const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, financeController.addEntry);
router.get('/', authMiddleware, financeController.getFinances);
router.get('/stats', authMiddleware, financeController.getStats);

module.exports = router;
