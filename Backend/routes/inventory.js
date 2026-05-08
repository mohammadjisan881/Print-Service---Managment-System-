const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, inventoryController.getAllInventory);
router.post('/', authMiddleware, inventoryController.addInventoryItem);
router.put('/:id', authMiddleware, inventoryController.updateInventoryItem);
router.delete('/:id', authMiddleware, inventoryController.deleteInventoryItem);
router.post('/record-usage', authMiddleware, inventoryController.recordUsage);
router.get('/stats', authMiddleware, inventoryController.getInventoryStats);

module.exports = router;
