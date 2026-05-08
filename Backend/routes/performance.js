const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, performanceController.getAllPerformance);
router.get('/:id', authMiddleware, performanceController.getAdminDetails);

module.exports = router;
