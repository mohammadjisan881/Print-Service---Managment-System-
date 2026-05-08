const db = require('../db');

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM suppliers ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add new supplier
exports.createSupplier = async (req, res) => {
    const { name, company, phone, address } = req.body;
    try {
        await db.query(
            'INSERT INTO suppliers (name, company, phone, address) VALUES (?, ?, ?, ?)',
            [name, company, phone, address]
        );
        res.json({ message: 'Supplier added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Record transaction (Purchase or Payment)
exports.recordTransaction = async (req, res) => {
    const { supplier_id, type, amount, note, transaction_date } = req.body;
    try {
        await db.query(
            'INSERT INTO supplier_transactions (supplier_id, type, amount, note, transaction_date) VALUES (?, ?, ?, ?, ?)',
            [supplier_id, type, amount, note, transaction_date]
        );

        // Update supplier balance
        // If Purchase, balance increases (we owe more)
        // If Payment, balance decreases (we paid)
        const multiplier = (type === 'Purchase') ? 1 : -1;
        await db.query(
            'UPDATE suppliers SET balance = balance + ? WHERE id = ?',
            [amount * multiplier, supplier_id]
        );

        res.json({ message: 'Transaction recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get supplier transaction history
exports.getTransactionHistory = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM supplier_transactions WHERE supplier_id = ? ORDER BY transaction_date DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
    try {
        await db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Supplier deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
