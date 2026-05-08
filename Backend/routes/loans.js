const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, loanController.getAllLoans);
router.post('/', authMiddleware, loanController.createLoan);
router.post('/repay', authMiddleware, loanController.recordRepayment);
router.get('/history/:id', authMiddleware, loanController.getRepaymentHistory);
router.delete('/:id', authMiddleware, loanController.deleteLoan);
router.get('/stats', authMiddleware, loanController.getLoanStats);

module.exports = router;
