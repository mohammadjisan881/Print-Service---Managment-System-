const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, 'emp_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', authMiddleware, employeeController.getEmployees);
router.post('/', authMiddleware, upload.single('photo'), employeeController.addEmployee);
router.delete('/:id', authMiddleware, employeeController.deleteEmployee);

// Salary Management Routes
router.get('/:id/history', authMiddleware, employeeController.getSalaryHistory);
router.post('/:id/pay', authMiddleware, employeeController.recordSalaryPayment);
router.put('/:id/increment', authMiddleware, employeeController.updateSalaryIncrement);

module.exports = router;
