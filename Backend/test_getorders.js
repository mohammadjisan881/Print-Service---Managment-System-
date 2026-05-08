const db = require('./db');

async function testGetOrders() {
  try {
    let query = 'SELECT o.*, p.name as legacy_service_name, p.unit_type as legacy_unit_type FROM orders o LEFT JOIN products p ON o.service_id = p.id';
    query += ' WHERE o.status = "Pending" ORDER BY o.created_at DESC LIMIT 5';
    const [rows] = await db.query(query);

    const [items] = await db.query('SELECT oi.*, p.name as service_name, p.unit_type FROM order_items oi LEFT JOIN products p ON oi.service_id = p.id');
    
    const enrichedOrders = rows.map(order => {
      const orderItems = items.filter(i => i.order_id === order.id);
      return {
        ...order,
        items: orderItems
      };
    });

    console.log(JSON.stringify(enrichedOrders, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testGetOrders();
