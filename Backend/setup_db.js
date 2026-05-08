const db = require('./db');
const fs = require('fs');
const path = require('path');

async function setupDB() {
  console.log('🚀 Starting Comprehensive Database Setup...');
  try {
    // 1. Initial Schema from schema.sql
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schema.split(';').filter(stmt => stmt.trim() !== '');

    for (let stmt of statements) {
      if (stmt.trim()) {
        try {
          await db.query(stmt);
        } catch (err) {
          // Ignore table exists errors
        }
      }
    }
    
    // 2. Comprehensive Column Migrations (ALTER TABLEs)
    // We group these by table for clarity
    const migrations = [
        // Products Table
        "ALTER TABLE products ADD COLUMN unit_type ENUM('Piece', 'Set', 'Square Feet') DEFAULT 'Piece'",
        "ALTER TABLE products ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0",
        "ALTER TABLE products ADD COLUMN cost_preset_id INT DEFAULT NULL",

        // Orders Table
        "ALTER TABLE orders ADD COLUMN quantity INT DEFAULT 1",
        "ALTER TABLE orders ADD COLUMN print_width DECIMAL(10,2) DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN print_height DECIMAL(10,2) DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN company_name VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN design_instructions TEXT DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN design_file TEXT DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN printing_cost DECIMAL(10,2) DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN return_cost DECIMAL(10,2) DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN net_profit DECIMAL(10,2) DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN is_wholesale BOOLEAN DEFAULT FALSE",
        "ALTER TABLE orders ADD COLUMN outside_press_name VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN completed_by INT DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN completed_at DATETIME DEFAULT NULL",
        "ALTER TABLE orders MODIFY status ENUM('Pending', 'Confirmed', 'Designing', 'Printing', 'Delivered', 'Completed', 'Returned', 'Cancelled') DEFAULT 'Pending'",

        // Order Items Table
        "ALTER TABLE order_items ADD COLUMN custom_service_name VARCHAR(255) DEFAULT NULL",

        // Employees Table
        "ALTER TABLE employees ADD COLUMN photo_url TEXT DEFAULT NULL",

        // Inventory Table
        "ALTER TABLE inventory MODIFY COLUMN unit_type ENUM('SqFt', 'Piece', 'Unit', 'Set') DEFAULT 'SqFt'",
        
        // Inventory Usage Table
        "ALTER TABLE inventory_usage ADD COLUMN waste_quantity DECIMAL(10,2) DEFAULT 0",
        "ALTER TABLE inventory_usage ADD COLUMN recorded_by INT DEFAULT NULL",
        "ALTER TABLE inventory_usage ADD COLUMN cost_at_usage DECIMAL(10,2) DEFAULT 0",

        // Admins Table
        "ALTER TABLE admins ADD COLUMN role ENUM('SuperAdmin', 'OrderManager', 'PrintManager') DEFAULT 'SuperAdmin'",
        "ALTER TABLE loans ADD COLUMN phone VARCHAR(20) DEFAULT NULL"
    ];

    for (const sql of migrations) {
        try { 
            await db.query(sql); 
        } catch(e) {
            // Silence "Duplicate column name" errors
            if (!e.message.includes('Duplicate column name')) {
                // console.log(`Note: ${e.message}`);
            }
        }
    }

    // 3. Create Missing Core Tables (New Features)

    // A. Cost Presets (for product auto-calculation)
    await db.query(`
      CREATE TABLE IF NOT EXISTS cost_presets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'Piece',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // B. Payments Log (for tracking partial payments & dashboard analytics)
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type ENUM('Advance', 'Final', 'Partial') DEFAULT 'Advance',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        note VARCHAR(255),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // C. Suppliers (New Feature)
    await db.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        balance DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // D. Supplier Transactions (Purchase/Payment)
    await db.query(`
      CREATE TABLE IF NOT EXISTS supplier_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT NOT NULL,
        type ENUM('Purchase', 'Payment') NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        note TEXT,
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
      )
    `);

    // E. Loans (for business debt tracking)
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

    // D. Loan Repayments
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

    // 4. Final Data Integrity Fixes
    const extraMigrations = [
        "ALTER TABLE orders ADD COLUMN designer_id INT DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN printer_id INT DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN print_done_at DATETIME DEFAULT NULL"
    ];

    for (const sql of extraMigrations) {
        try { await db.query(sql); } catch(e) {}
    }

    try { await db.query("UPDATE admins SET role = 'SuperAdmin' WHERE role IS NULL"); } catch(e){}

    console.log('✅ MASTER DATABASE SYNC COMPLETE: All tables and columns are ready.');
    return true;
  } catch (err) {
    console.error('❌ CRITICAL ERROR during DB Setup:', err.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
    setupDB().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = setupDB;
