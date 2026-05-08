const db = require('../db');

// Add Finance Entry
exports.addEntry = async (req, res) => {
  const { type, category, amount, note, date } = req.body;
  try {
    await db.query(
      'INSERT INTO finances (type, category, amount, note, date) VALUES (?, ?, ?, ?, ?)',
      [type, category, amount, note, date || new Date()]
    );
    res.json({ message: 'Finance Entry Added' });
    req.app.get('socketio').emit('financeUpdate');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Finances
exports.getFinances = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM finances ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Dashboard Stats
exports.getStats = async (req, res) => {
  try {
    const [revenue] = await db.query('SELECT SUM(total_price) as total FROM orders WHERE status != "Cancelled"');
    const [expenses] = await db.query('SELECT SUM(amount) as total FROM finances WHERE type = "Expense"');
    const [invUsage] = await db.query('SELECT SUM(cost_at_usage) as total FROM inventory_usage');
    const [activeOrders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE status IN ("Pending", "Processing", "Printing")');
    const [dues] = await db.query('SELECT SUM(due_amount) as total FROM orders');
    const [printingOrders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE status = "Printing"');
    const [lowStock] = await db.query('SELECT COUNT(*) as count FROM inventory WHERE total_stock < 50');

    const totalRev = revenue[0].total || 0;
    const generalExp = expenses[0].total || 0;
    const materialCost = invUsage[0].total || 0;

    res.json({
      revenue: totalRev,
      expenses: generalExp + materialCost,
      materialCost: materialCost,
      activeOrders: activeOrders[0].count || 0,
      printingOrders: printingOrders[0].count || 0,
      dues: dues[0].total || 0,
      lowStock: lowStock[0].count || 0,
      netProfit: totalRev - (generalExp + materialCost)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
