const bcrypt = require('bcryptjs');
const db = require('./db');

async function createAdmin() {
  const username = 'admin';
  const email = 'admin@example.com';
  const password = 'admin'; // ডিফল্ট পাসওয়ার্ড

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      'INSERT INTO admins (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    console.log('Admin user created successfully! \nUsername: admin\nPassword: admin');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('Admin user already exists!');
    } else {
      console.error('Error creating admin:', err);
    }
    process.exit(1);
  }
}

createAdmin();
