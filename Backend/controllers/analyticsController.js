const db = require('../db');
const { sendWhatsAppMessage } = require('../utils/whatsapp');

exports.getDashboardStats = async (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Default to this month. 
    // Optimization: start/end are already in YYYY-MM-DD from frontend
    let start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    let end = endDate || new Date().toISOString().split('T')[0];

    try {
        const OFFSET = 'INTERVAL 6 HOUR'; // UTC to Dhaka (+06:00)
        
        // 1. Realized Revenue (Total Cash Collected in range) - Offset applied
        const [cash] = await db.query(`
            SELECT SUM(amount) as totalCash 
            FROM payments_log 
            WHERE DATE(DATE_ADD(payment_date, ${OFFSET})) >= ? 
              AND DATE(DATE_ADD(payment_date, ${OFFSET})) <= ?
        `, [start, end]);

        // 2. Recognized Production Costs (Orders completed) - Offset applied
        const [stats] = await db.query(`
            SELECT 
                SUM(printing_cost) as totalCost,
                COUNT(id) as totalOrders,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as totalPending
            FROM orders 
            WHERE 
                (
                (status IN ('Completed', 'Cancelled') AND DATE(DATE_ADD(completed_at, ${OFFSET})) >= ? AND DATE(DATE_ADD(completed_at, ${OFFSET})) <= ?)
                OR 
                (status NOT IN ('Completed', 'Cancelled') AND DATE(DATE_ADD(created_at, ${OFFSET})) >= ? AND DATE(DATE_ADD(created_at, ${OFFSET})) <= ?)
            )
        `, [start, end, start, end]);

        // 3. Overheads
        const [expenses] = await db.query(`
            SELECT 
                SUM(CASE WHEN type='Expense' AND category != 'Salary' THEN amount ELSE 0 END) as generalExpenses,
                SUM(CASE WHEN type='Expense' AND category = 'Salary' THEN amount ELSE 0 END) as actualSalaryPaid,
                SUM(CASE WHEN type='Investment' THEN amount ELSE 0 END) as investments
            FROM finances 
            WHERE DATE(DATE_ADD(date, ${OFFSET})) >= ? 
              AND DATE(DATE_ADD(date, ${OFFSET})) <= ?
        `, [start, end]);

        // 4. Employee Payroll Baseline
        const [payroll] = await db.query('SELECT SUM(salary) as total FROM employees');

        // 5. Inventory Material Cost
        const [materials] = await db.query(`
            SELECT SUM(cost_at_usage) as total 
            FROM inventory_usage 
            WHERE DATE(DATE_ADD(created_at, ${OFFSET})) >= ? 
              AND DATE(DATE_ADD(created_at, ${OFFSET})) <= ?
        `, [start, end]);

        // 6. Supplier Material Payments
        const [supplierCosts] = await db.query(`
            SELECT SUM(amount) as total 
            FROM supplier_transactions 
            WHERE type = 'Payment' 
              AND DATE(DATE_ADD(transaction_date, ${OFFSET})) >= ? 
              AND DATE(DATE_ADD(transaction_date, ${OFFSET})) <= ?
        `, [start, end]);

        // 7. Today's Local Activity (Using offset comparison)
        const [todayCash] = await db.query(`
            SELECT SUM(amount) as cash FROM payments_log WHERE DATE(DATE_ADD(payment_date, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET}))
        `, []);

        const [todayCosts] = await db.query(`
            SELECT SUM(printing_cost) as cost FROM orders 
            WHERE (
                (status IN ('Completed', 'Cancelled') AND DATE(DATE_ADD(completed_at, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET})))
                OR 
                (status NOT IN ('Completed', 'Cancelled') AND DATE(DATE_ADD(created_at, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET})))
            )
        `, []);

        const rev = Number(cash[0].totalCash) || 0;
        const prodCost = Number(stats[0].totalCost) || 0;
        const matCost = Number(materials[0].total) || 0;
        const genExp = Number(expenses[0].generalExpenses) || 0;
        const realSalary = Number(expenses[0].actualSalaryPaid) || 0;
        const payrollBaseline = Number(payroll[0].total) || 0;
        const supCost = Number(supplierCosts[0].total) || 0;

        res.json({
            range: { start, end },
            summary: {
                revenue: rev,
                productionCost: prodCost,
                materialCost: matCost,
                supplierMaterialCost: supCost,
                generalExpenses: genExp,
                payroll: realSalary || payrollBaseline || 0,
                payrollBaseline: payrollBaseline,
                actualSalaryPaid: realSalary,
                investment: Number(expenses[0].investments) || 0,
                orders: stats[0].totalOrders || 0,
                pending: stats[0].totalPending || 0,
                cashCollected: rev,
                trueNetProfit: rev - (prodCost + matCost + genExp + realSalary + supCost)
            },
            today: {
                revenue: Number(todayCash[0].cash) || 0,
                profit: (Number(todayCash[0].cash) || 0) - (Number(todayCosts[0].cost) || 0),
                cash: Number(todayCash[0].cash) || 0
            }
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getChartData = async (req, res) => {
    const { days = 30 } = req.query;
    try {
        const OFFSET = 'INTERVAL 6 HOUR';
        const [revenueData] = await db.query(`
            SELECT 
                DATE(DATE_ADD(payment_date, ${OFFSET})) as date,
                SUM(amount) as revenue
            FROM payments_log 
            WHERE payment_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(DATE_ADD(payment_date, ${OFFSET}))
        `, [parseInt(days)]);

        const [costData] = await db.query(`
            SELECT 
                DATE(DATE_ADD(completed_at, ${OFFSET})) as date,
                SUM(printing_cost) as cost
            FROM orders 
            WHERE status IN ('Completed', 'Cancelled') AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(DATE_ADD(completed_at, ${OFFSET}))
        `, [parseInt(days)]);

        const formatDate = (d) => {
            if (!d) return null;
            const dateObj = new Date(d);
            return dateObj.toISOString().split('T')[0];
        };

        const dates = new Set([
            ...revenueData.map(r => formatDate(r.date)),
            ...costData.map(c => formatDate(c.date))
        ].filter(Boolean));

        const chartData = Array.from(dates).sort().map(dateStr => {
            const rev = revenueData.find(r => formatDate(r.date) === dateStr)?.revenue || 0;
            const cost = costData.find(c => formatDate(c.date) === dateStr)?.cost || 0;
            return {
                date: dateStr,
                revenue: rev,
                profit: rev - cost
            };
        });

        res.json(chartData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRecentCollections = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT pl.*, o.client_name, o.order_id as display_id
            FROM payments_log pl
            JOIN orders o ON pl.order_id = o.id
            ORDER BY pl.payment_date DESC
            LIMIT 10
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.sendDailyWhatsAppReport = async (req, res) => {
    try {
        const OFFSET = 'INTERVAL 6 HOUR';
        // Get today's stats
        const [cash] = await db.query(`SELECT SUM(amount) as total FROM payments_log WHERE DATE(DATE_ADD(payment_date, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET}))`);
        const [orders] = await db.query(`SELECT COUNT(*) as count, SUM(total_price) as sales FROM orders WHERE DATE(DATE_ADD(created_at, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET}))`);
        const [expenses] = await db.query(`SELECT SUM(amount) as total FROM finances WHERE type='Expense' AND DATE(DATE_ADD(date, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET}))`);

        const todayCash = Number(cash[0].total) || 0;
        const todaySales = Number(orders[0].sales) || 0;
        const todayOrders = orders[0].count || 0;
        const todayExp = Number(expenses[0].total) || 0;

        const reportMsg = `📊 *Daily Business Summary - ${new Date().toLocaleDateString()}*\n\n` +
            `✅ *New Orders:* ${todayOrders}\n` +
            `💰 *Sales Volume:* ৳${todaySales.toLocaleString()}\n` +
            `💵 *Cash Collected:* ৳${todayCash.toLocaleString()}\n` +
            `💸 *Daily Expenses:* ৳${todayExp.toLocaleString()}\n\n` +
            `📈 *Net Cash Flow:* ৳${(todayCash - todayExp).toLocaleString()}\n\n` +
            `_Generated by PrintX Admin System_`;

        // Fetched from .env
        const ownerPhone = process.env.OWNER_PHONE; 
        if (ownerPhone) {
            await sendWhatsAppMessage(ownerPhone, reportMsg);
            res.json({ message: 'Daily report sent to owner WhatsApp' });
        } else {
            res.status(400).json({ error: 'OWNER_PHONE not set in .env' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
