const db = require('./db');
async function migrate() {
  try {
    await db.query('ALTER TABLE products ADD COLUMN cost_preset_id INT NULL');
    await db.query('ALTER TABLE products ADD CONSTRAINT fk_cost_preset FOREIGN KEY (cost_preset_id) REFERENCES cost_presets(id) ON DELETE SET NULL');
    console.log("Migration Successful: cost_preset_id added to products with FK");
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
