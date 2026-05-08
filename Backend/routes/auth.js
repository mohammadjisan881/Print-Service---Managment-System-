const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);

// Admin Management (SuperAdmin Only)
router.post('/register-subadmin', authMiddleware, authController.createSubAdmin);
router.get('/admins', authMiddleware, authController.getAllAdmins);
router.delete('/admins/:id', authMiddleware, authController.deleteAdmin);

module.exports = router;
