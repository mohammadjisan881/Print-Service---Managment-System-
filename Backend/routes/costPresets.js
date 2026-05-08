const express = require('express');
const router = express.Router();
const costPresetController = require('../controllers/costPresetController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, costPresetController.getPresets);
router.post('/', authMiddleware, costPresetController.addPreset);
router.put('/:id', authMiddleware, costPresetController.updatePreset);
router.delete('/:id', authMiddleware, costPresetController.deletePreset);

module.exports = router;
