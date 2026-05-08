const db = require('../db');

// Get all unique customers based on phone number
exports.getAllCustomers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                phone_number, 
                MAX(client_name) as client_name, 
                MAX(company_name) as company_name,
                COUNT(id) as total_orders,
                SUM(total_price) as total_spent,
                SUM(advance_paid) as total_paid,
                SUM(total_price - advance_paid) as current_dues,
                MAX(created_at) as last_order_date
            FROM orders
            GROUP BY phone_number
            ORDER BY last_order_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get detailed ledger for a specific customer (by phone)
exports.getCustomerLedger = async (req, res) => {
    const { phone } = req.params;
    try {
        // Get all orders for this customer
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE phone_number = ? ORDER BY created_at DESC',
            [phone]
        );

        // Get all payment logs for these orders
        const [payments] = await db.query(`
            SELECT p.*, o.order_id as order_code 
            FROM payments_log p
            JOIN orders o ON p.order_id = o.id
            WHERE o.phone_number = ?
            ORDER BY p.payment_date DESC
        `, [phone]);

        res.json({
            orders,
            payments
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
