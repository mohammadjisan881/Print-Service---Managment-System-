const db = require('../db');

// Add Cost Preset
exports.addPreset = async (req, res) => {
    const { name, amount, unit } = req.body;
    try {
        await db.query('INSERT INTO cost_presets (name, amount, unit) VALUES (?, ?, ?)', [name, amount || 0, unit || 'Piece']);
        res.json({ message: 'Cost Preset Added Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get All Presets
exports.getPresets = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cost_presets ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Preset
exports.updatePreset = async (req, res) => {
    const { id } = req.params;
    const { name, amount, unit } = req.body;
    try {
        await db.query('UPDATE cost_presets SET name = ?, amount = ?, unit = ? WHERE id = ?', [name, amount || 0, unit || 'Piece', id]);
        res.json({ message: 'Cost Preset Updated Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Preset
exports.deletePreset = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM cost_presets WHERE id = ?', [id]);
        res.json({ message: 'Cost Preset Deleted Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
