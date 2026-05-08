const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post('/', upload.single('design_file'), orderController.createOrder);
router.get('/track/:order_id', orderController.trackOrder);
router.get('/debug', require('../debug_order').debugGetOrders); // TEMP DEBUG
router.get('/', authMiddleware, orderController.getOrders);
router.put('/:id/status', authMiddleware, orderController.updateStatus);
router.put('/:id/payment', authMiddleware, orderController.addPayment);
router.get('/:id/payments', authMiddleware, orderController.getPaymentHistory);
router.put('/:id/finances', authMiddleware, orderController.updateFinances);
router.delete('/:id', authMiddleware, orderController.deleteOrder);

module.exports = router;
