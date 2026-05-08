-- Create Database
CREATE DATABASE IF NOT EXISTS printpress_db;
USE printpress_db;

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('SuperAdmin', 'OrderManager', 'PrintManager') DEFAULT 'SuperAdmin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products/Services Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    unit_type ENUM('Piece', 'Set', 'Square Feet') NOT NULL DEFAULT 'Piece',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table (With Financial Tracking)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL, 
    client_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    service_id INT,
    quantity INT DEFAULT 1,
    print_width DECIMAL(10, 2) DEFAULT NULL,
    print_height DECIMAL(10, 2) DEFAULT NULL,
    order_date DATE DEFAULT (CURRENT_DATE),
    delivery_date DATE,
    total_price DECIMAL(10, 2) NOT NULL,
    advance_paid DECIMAL(10, 2) DEFAULT 0,
    due_amount DECIMAL(10, 2) AS (total_price - advance_paid) STORED,
    status ENUM('Pending', 'Confirmed', 'Designing', 'Printing', 'Delivered', 'Completed', 'Returned', 'Cancelled') DEFAULT 'Pending',
    printing_cost DECIMAL(10, 2) DEFAULT 0,
    return_cost DECIMAL(10, 2) DEFAULT 0,
    net_profit DECIMAL(10, 2) DEFAULT 0,
    company_name VARCHAR(255) DEFAULT NULL,
    design_instructions TEXT DEFAULT NULL,
    design_file TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Order Items Table (For Multi-Item Orders)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL, 
    service_id INT DEFAULT NULL, 
    custom_service_name VARCHAR(255) DEFAULT NULL,
    quantity INT DEFAULT 1,
    print_width DECIMAL(10, 2) DEFAULT NULL,
    print_height DECIMAL(10, 2) DEFAULT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Expenses & Investments Table
CREATE TABLE IF NOT EXISTS finances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('Expense', 'Investment') NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    note TEXT,
    date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    salary DECIMAL(10, 2) NOT NULL,
    photo_url TEXT DEFAULT NULL,
    join_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table (Materials Tracking)
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category ENUM('Media', 'Paper', 'Ink', 'Other') NOT NULL DEFAULT 'Media',
    total_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit_type ENUM('SqFt', 'Piece', 'Unit') DEFAULT 'SqFt',
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Usage Tracking (Link to Order Status updates)
CREATE TABLE IF NOT EXISTS inventory_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    order_id INT NOT NULL,
    quantity_used DECIMAL(10, 2) NOT NULL,
    cost_at_usage DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
