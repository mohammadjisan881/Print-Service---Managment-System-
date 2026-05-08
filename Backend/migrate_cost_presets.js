const db = require('./db');
async function migrate() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS cost_presets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'Piece',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Migration Successful: cost_presets table created");
    
    // Optional: Migrate existing product costs as presets
    const [products] = await db.query('SELECT name, cost_price, unit_type FROM products WHERE cost_price > 0');
    for (const p of products) {
        try {
            await db.query('INSERT IGNORE INTO cost_presets (name, amount, unit) VALUES (?, ?, ?)', [p.name, p.cost_price, p.unit_type]);
        } catch (e) {}
    }
    console.log("Initial data migrated from products to cost_presets");

    process.exit(0);
  } catch (e) {
    console.error("Migration Failed:", e);
    process.exit(1);
  }
}
migrate();
