const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, customerController.getAllCustomers);
router.get('/ledger/:phone', authMiddleware, customerController.getCustomerLedger);

module.exports = router;
