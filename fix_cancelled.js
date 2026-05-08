require('dotenv').config({ path: './Backend/.env' });
const db = require('./Backend/db');

async function fixCancelledOrders() {
    try {
        console.log('Updating existing cancelled orders to have a completed_at timestamp...');
        const [result] = await db.query(
            "UPDATE orders SET completed_at = created_at WHERE status = 'Cancelled' AND completed_at IS NULL"
        );
        console.log(`Success! Updated ${result.affectedRows} orders.`);
        process.exit(0);
    } catch (err) {
        console.error('Error fixing orders:', err);
        process.exit(1);
    }
}

fixCancelledOrders();
