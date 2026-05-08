const db = require('./db');

async function testOrders() {
  try {
    const [orders] = await db.query('SELECT order_id, client_name, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5');
    console.log('Recent Orders:', orders);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testOrders();
