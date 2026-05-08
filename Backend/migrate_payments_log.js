const db = require('./db');
async function migrate() {
  try {
    // 1. Create payments_log table
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type ENUM('Advance', 'Final', 'Partial') DEFAULT 'Advance',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        note VARCHAR(255),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration Successful: payments_log table created");

    // 2. Backfill existing advances from orders table
    const [orders] = await db.query('SELECT id, advance_paid, created_at FROM orders WHERE advance_paid > 0');
    for (const o of orders) {
        // Only insert if not already there (to avoid duplicates on re-run)
        const [existing] = await db.query('SELECT id FROM payments_log WHERE order_id = ? AND amount = ?', [o.id, o.advance_paid]);
        if (existing.length === 0) {
            await db.query('INSERT INTO payments_log (order_id, amount, type, payment_date, note) VALUES (?, ?, ?, ?, ?)', 
                [o.id, o.advance_paid, 'Advance', o.created_at, 'Initial Advance (Migrated)']);
        }
    }
    console.log(`Backfilled ${orders.length} payments from existing orders.`);

    process.exit(0);
  } catch (e) {
    console.error("Migration Failed:", e);
    process.exit(1);
  }
}
migrate();
