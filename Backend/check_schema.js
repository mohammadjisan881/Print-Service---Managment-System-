const db = require('./db');
async function checkSchema() {
  try {
    const [rows] = await db.query('DESCRIBE inventory_usage');
    console.table(rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
checkSchema();
