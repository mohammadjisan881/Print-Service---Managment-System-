const db = require('./db');

async function testInvUpdate() {
  try {
    const [rows] = await db.query('SELECT * FROM inventory LIMIT 1');
    if (rows.length === 0) {
      console.log("No inventory items found.");
      return;
    }
    const id = rows[0].id;
    console.log("Found item to edit:", rows[0]);
    
    // Simulate what the controller does
    const [result] = await db.query(
      'UPDATE inventory SET name = ? WHERE id = ?',
      [rows[0].name + ' Editable', id]
    );
    console.log("Update result:", result.affectedRows > 0 ? "SUCCESS" : "NO ROWS UPDATED");

    process.exit(0);
  } catch (e) {
    console.error("DB Error:", e);
    process.exit(1);
  }
}

testInvUpdate();
