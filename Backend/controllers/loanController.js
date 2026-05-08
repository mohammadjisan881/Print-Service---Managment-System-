const db = require('../db');
const { sendWhatsAppMessage } = require('../utils/whatsapp');

// Get all loans
exports.getAllLoans = async (req, res) => {
    try {
        const [loans] = await db.query(`
            SELECT l.*, 
            (SELECT SUM(amount_paid) FROM loan_repayments WHERE loan_id = l.id) as total_paid
            FROM loans l
            ORDER BY l.created_at DESC
        `);
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new loan
exports.createLoan = async (req, res) => {
    const { source, amount, interest_rate, start_date, due_date, note, phone } = req.body;
    try {
        await db.query(
            'INSERT INTO loans (source, amount, interest_rate, start_date, due_date, note, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [source, amount, interest_rate || 0, start_date, due_date, note, phone]
        );
        
        if (phone) {
            const msg = `Hello, a new loan entry from ${source} for ৳${amount} has been recorded in PrintX Admin.`;
            sendWhatsAppMessage(phone, msg);
        }

        res.json({ message: 'Loan added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Record a repayment
exports.recordRepayment = async (req, res) => {
    const { loan_id, amount_paid, payment_date, note } = req.body;
    try {
        await db.query(
            'INSERT INTO loan_repayments (loan_id, amount_paid, payment_date, note) VALUES (?, ?, ?, ?)',
            [loan_id, amount_paid, payment_date, note]
        );
        
        // Update loan status if fully paid
        const [loan] = await db.query('SELECT amount, source, phone FROM loans WHERE id = ?', [loan_id]);
        const [paid] = await db.query('SELECT SUM(amount_paid) as total FROM loan_repayments WHERE loan_id = ?', [loan_id]);
        
        const isCompleted = Number(paid[0].total) >= Number(loan[0].amount);
        if (isCompleted) {
            await db.query('UPDATE loans SET status = "Completed" WHERE id = ?', [loan_id]);
        }

        // Send WhatsApp Notification
        if (loan[0].phone) {
            const msg = `Payment Received: ৳${amount_paid} has been paid towards your loan from ${loan[0].source}. Remaining balance: ৳${Math.max(0, Number(loan[0].amount) - Number(paid[0].total))}. ${isCompleted ? 'Loan is now FULLY PAID.' : ''}`;
            sendWhatsAppMessage(loan[0].phone, msg);
        }

        res.json({ message: 'Repayment recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get repayment history for a specific loan
exports.getRepaymentHistory = async (req, res) => {
    try {
        const [history] = await db.query(
            'SELECT * FROM loan_repayments WHERE loan_id = ? ORDER BY payment_date DESC',
            [req.params.id]
        );
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a loan
exports.deleteLoan = async (req, res) => {
    try {
        await db.query('DELETE FROM loans WHERE id = ?', [req.params.id]);
        res.json({ message: 'Loan deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get monthly repayment stats for charts
exports.getLoanStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                DATE_FORMAT(payment_date, '%Y-%m') as month,
                SUM(amount_paid) as total_repaid
            FROM loan_repayments
            WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
