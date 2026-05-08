require('dotenv').config();
const db = require('./db');

async function fixCancelledOrders() {
    try {
        console.log('Force-updating cancelled orders to Today...');
        const now = new Date();
        const [result] = await db.query(
            "UPDATE orders SET completed_at = ? WHERE status = 'Cancelled' AND completed_at IS NULL",
            [now]
        );
        console.log(`Success! Updated ${result.affectedRows} orders.`);
        process.exit(0);
    } catch (err) {
        console.error('Error fixing orders:', err);
        process.exit(1);
    }
}

fixCancelledOrders();
