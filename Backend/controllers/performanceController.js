const db = require('../db');

// Get Performance Stats for all employees
exports.getAllPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    let params = [];

    if (startDate && endDate) {
      dateFilter = ' AND created_at BETWEEN ? AND ?';
      params = [startDate, endDate];
    }

    // 1. Order Completion Stats
    const [orderStats] = await db.query(`
      SELECT 
        a.id as admin_id, 
        a.username, 
        a.role,
        COUNT(o.id) as orders_completed,
        SUM(o.total_price) as total_value_completed
      FROM admins a
      LEFT JOIN orders o ON a.id = o.completed_by AND o.status = 'Completed' ${dateFilter}
      GROUP BY a.id
    `, params);

    // 2. Printing/Usage Stats (SqFt)
    const [usageStats] = await db.query(`
      SELECT 
        recorded_by as admin_id,
        SUM(quantity_used) as total_sqft_used,
        SUM(waste_quantity) as total_waste_sqft
      FROM inventory_usage
      WHERE 1=1 ${dateFilter}
      GROUP BY recorded_by
    `, params);

    // Merge Stats
    const performance = orderStats.map(admin => {
      const usage = usageStats.find(u => u.admin_id === admin.admin_id) || { total_sqft_used: 0, total_waste_sqft: 0 };
      return {
        ...admin,
        total_sqft_printed: usage.total_sqft_used,
        total_waste: usage.total_waste_sqft
      };
    });

    res.json(performance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Detailed performance for one person
exports.getAdminDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE completed_by = ? ORDER BY created_at DESC LIMIT 50', [id]);
    const [usage] = await db.query(`
      SELECT iu.*, i.name as material_name, i.unit_type 
      FROM inventory_usage iu 
      JOIN inventory i ON iu.inventory_id = i.id 
      WHERE iu.recorded_by = ? 
      ORDER BY iu.created_at DESC LIMIT 50
    `, [id]);

    res.json({ orders, usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
