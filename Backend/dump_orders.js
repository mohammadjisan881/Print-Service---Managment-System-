require('dotenv').config();
const db = require('./db');

async function dumpOrders() {
    try {
        console.log('Dumping orders with status length check...');
        const [rows] = await db.query(
            "SELECT id, order_id, status, LENGTH(status) as s_len, printing_cost FROM orders ORDER BY id DESC LIMIT 20"
        );
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dumpOrders();
