const db = require('./db');

async function migrate() {
  try {
    console.log('Running migration...');
    // Check if is_wholesale exists
    const [columns] = await db.query(`SHOW COLUMNS FROM orders LIKE 'is_wholesale'`);
    if (columns.length === 0) {
      await db.query(`ALTER TABLE orders ADD COLUMN is_wholesale TINYINT(1) DEFAULT 0`);
      console.log('Added is_wholesale column');
    } else {
      console.log('is_wholesale already exists');
    }

    const [cols2] = await db.query(`SHOW COLUMNS FROM orders LIKE 'outside_press_name'`);
    if (cols2.length === 0) {
      await db.query(`ALTER TABLE orders ADD COLUMN outside_press_name VARCHAR(255) DEFAULT NULL`);
      console.log('Added outside_press_name column');
    } else {
      console.log('outside_press_name already exists');
    }
    
    console.log('Migration successful');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
