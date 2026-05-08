const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/stats', authMiddleware, analyticsController.getDashboardStats);
router.get('/charts', authMiddleware, analyticsController.getChartData);
router.get('/collections', authMiddleware, analyticsController.getRecentCollections);
router.get('/report', authMiddleware, analyticsController.sendDailyWhatsAppReport);

module.exports = router;
