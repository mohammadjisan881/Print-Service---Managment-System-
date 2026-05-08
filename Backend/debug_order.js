const db = require('./db');
exports.debugGetOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT o.*, p.name as legacy_service_name, p.unit_type as legacy_unit_type FROM orders o LEFT JOIN products p ON o.service_id = p.id';
    let params = [];
    let conditions = [];

    if (status && status !== 'All') {
      conditions.push('o.status = ?');
      params.push(status);
    } else {
      conditions.push('o.status != ?');
      params.push('Completed');
    }

    if (search) {
      conditions.push('(o.client_name LIKE ? OR o.phone_number LIKE ? OR o.company_name LIKE ? OR o.order_id LIKE ?)');
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY o.created_at DESC';
    const [rows] = await db.query(query, params);

    const [items] = await db.query('SELECT oi.*, p.name as service_name, p.unit_type FROM order_items oi LEFT JOIN products p ON oi.service_id = p.id');
    
    const enrichedOrders = rows.map(order => {
      const orderItems = items.filter(i => i.order_id === order.id);
      return { ...order, items: orderItems };
    });

    res.json(enrichedOrders);
  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};
