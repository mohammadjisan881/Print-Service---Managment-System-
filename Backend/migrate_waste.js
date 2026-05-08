const db = require('./db');
async function migrate() {
  try {
    // 1. Drop foreign key first if needed (usually required for modifying column that's part of FK)
    // But let's try simple ALTER first as some engines allow it
    await db.query('ALTER TABLE inventory_usage MODIFY order_id INT NULL');
    console.log("Migration Successful: order_id is now nullable");
    process.exit(0);
  } catch (e) {
    console.error("Migration Failed:", e);
    process.exit(1);
  }
}
migrate();
