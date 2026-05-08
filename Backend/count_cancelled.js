require('dotenv').config();
const db = require('./db');

async function countCancelled() {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'Cancelled'");
        console.log('Count of Cancelled orders:', rows[0].count);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

countCancelled();
