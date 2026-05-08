const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, supplierController.getAllSuppliers);
router.post('/', authMiddleware, supplierController.createSupplier);
router.post('/transaction', authMiddleware, supplierController.recordTransaction);
router.get('/history/:id', authMiddleware, supplierController.getTransactionHistory);
router.delete('/:id', authMiddleware, supplierController.deleteSupplier);

module.exports = router;
