require('dotenv').config({ path: './Backend/.env' });
const db = require('./Backend/db');

async function debugDashboard() {
    try {
        const OFFSET = 'INTERVAL 6 HOUR';
        console.log('Today (Dhaka Date):', new Date(new Date().getTime() + 6*60*60*1000).toISOString().split('T')[0]);
        
        // Check Today's Costs
        const [costs] = await db.query(`
            SELECT id, order_id, status, printing_cost, completed_at, created_at,
                   DATE(DATE_ADD(completed_at, ${OFFSET})) as local_comp_date,
                   DATE(DATE_ADD(created_at, ${OFFSET})) as local_create_date,
                   DATE(DATE_ADD(NOW(), ${OFFSET})) as today_date
            FROM orders 
            WHERE (
                (status IN ('Completed', 'Cancelled') AND DATE(DATE_ADD(completed_at, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET})))
                OR 
                (status NOT IN ('Completed', 'Cancelled') AND DATE(DATE_ADD(created_at, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET})))
            )
        `);
        
        console.log('--- Orders contributing to Today Costs ---');
        console.table(costs);
        
        const [todayCosts] = await db.query(`
            SELECT SUM(printing_cost) as total FROM orders 
            WHERE (
                (status IN ('Completed', 'Cancelled') AND DATE(DATE_ADD(completed_at, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET})))
                OR 
                (status NOT IN ('Completed', 'Cancelled') AND DATE(DATE_ADD(created_at, ${OFFSET})) = DATE(DATE_ADD(NOW(), ${OFFSET})))
            )
        `);
        console.log('Total Today Cost:', todayCosts[0].total);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugDashboard();
