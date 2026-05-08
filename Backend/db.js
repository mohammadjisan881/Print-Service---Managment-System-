const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ SQL Database Connected Successfully');
    connection.release();
  } catch (err) {
    console.error('❌ Database Connection Error:', err.message);
  }
})();

module.exports = db;
