require('dotenv').config();
const db = require('./db');

async function zeroEarlyCancellations() {
    try {
        console.log('Zeroing out printing_cost for ALL currently cancelled orders...');
        const [result] = await db.query(
            "UPDATE orders SET printing_cost = 0, net_profit = 0 WHERE status = 'Cancelled'"
        );
        console.log(`Success! Updated ${result.affectedRows} orders.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

zeroEarlyCancellations();
