const db = require('../db');

exports.addEmployee = async (req, res) => {
  const { name, designation, phone, email, salary, join_date } = req.body;
  let photo_url = null;
  if (req.file) {
    photo_url = `http://localhost:5000/uploads/${req.file.filename}`;
  }
  
  try {
    await db.query(
      'INSERT INTO employees (name, designation, phone, email, salary, photo_url, join_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, designation, phone, email || null, salary || 0, photo_url, join_date || new Date()]
    );
    res.json({ message: 'Employee Added Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ message: 'Employee Deleted Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Salary & History Extensions ---

exports.getSalaryHistory = async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await db.query('SELECT * FROM salary_payments WHERE employee_id = ? ORDER BY payment_date DESC', [id]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  exports.recordSalaryPayment = async (req, res) => {
      const { id } = req.params;
      const { amount, type, month, year, notes } = req.body;
      
      // Ensure ID is integer
      const empId = parseInt(id);
      if (isNaN(empId)) return res.status(400).json({ error: 'Invalid Employee ID' });

      const connection = await db.getConnection();
      try {
          await connection.beginTransaction();
  
          // 1. Insert into salary_payments
          await connection.query(
              'INSERT INTO salary_payments (employee_id, amount, type, month, year, notes) VALUES (?, ?, ?, ?, ?, ?)',
              [empId, amount, type, month, year, notes]
          );
  
          // 2. Insert into finances ledger
          const category = type === 'Bonus' ? 'Bonus' : 'Salary';
          const financeNote = `Personnel Payout: ${type} for ${month} ${year}. ${notes || ''}`;
          
          await connection.query(
              'INSERT INTO finances (type, category, amount, note, date) VALUES (?, ?, ?, ?, CURDATE())',
              ['Expense', category, amount, financeNote]
          );
  
          await connection.commit();
          res.json({ message: 'Payment Recorded Successfully' });
      } catch (err) {
          await connection.rollback();
          console.error('PAYMENT_ERROR:', err);
          res.status(500).json({ error: 'Database Error: ' + err.message });
      } finally {
          connection.release();
      }
  };
  
  exports.updateSalaryIncrement = async (req, res) => {
      const { id } = req.params;
      const { new_salary, notes } = req.body;
      
      const connection = await db.getConnection();
      try {
          await connection.beginTransaction();
  
          // 1. Get old salary for logging
          const [oldEmp] = await connection.query('SELECT salary FROM employees WHERE id = ?', [id]);
          const oldSalary = oldEmp[0]?.salary || 0;
  
          // 2. Update employee table
          await connection.query('UPDATE employees SET salary = ? WHERE id = ?', [new_salary, id]);
  
          // 3. Log as Increment in history
          const diff = parseFloat(new_salary) - parseFloat(oldSalary);
          const incrementNote = `Increment from ৳${oldSalary} to ৳${new_salary} (Diff: +৳${diff}). ${notes || ''}`;
          const currentMonth = new Date().toLocaleString('default', { month: 'long' });
          const currentYear = new Date().getFullYear();
  
          await connection.query(
              'INSERT INTO salary_payments (employee_id, amount, type, month, year, notes) VALUES (?, ?, ?, ?, ?, ?)',
              [id, new_salary, 'Increment', currentMonth, currentYear, incrementNote]
          );
  
          await connection.commit();
          res.json({ message: 'Salary updated and increment logged' });
      } catch (err) {
          await connection.rollback();
          res.status(500).json({ error: err.message });
      } finally {
          connection.release();
      }
  };
