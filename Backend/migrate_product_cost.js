const db = require('./db');
async function migrate() {
  try {
    await db.query('ALTER TABLE products ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0');
    console.log("Migration Successful: cost_price added to products");
    process.exit(0);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Field already exists, skipping.");
      process.exit(0);
    }
    console.error("Migration Failed:", e);
    process.exit(1);
  }
}
migrate();
