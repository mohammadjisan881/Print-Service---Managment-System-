const db = require('./db');

async function migrateLoans() {
  try {
    // 1. Create loans table
    await db.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source VARCHAR(255) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        interest_rate DECIMAL(5, 2) DEFAULT 0,
        start_date DATE NOT NULL,
        due_date DATE,
        status ENUM('Active', 'Completed') DEFAULT 'Active',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Migration: loans table created successfully.");

    // 2. Create loan_repayments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS loan_repayments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_id INT NOT NULL,
        amount_paid DECIMAL(15, 2) NOT NULL,
        payment_date DATE NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: loan_repayments table created successfully.");

    process.exit(0);
  } catch (e) {
    console.error("Migration Failed:", e);
    process.exit(1);
  }
}

migrateLoans();
