const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login Admin
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(400).json({ message: 'Invalid Credentials' });

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({ token, admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  const { username, email, password } = req.body;
  const adminId = req.admin.id;

  try {
    let query = 'UPDATE admins SET username = ?, email = ?';
    let params = [username, email];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(adminId);

    await db.query(query, params);
    res.json({ message: 'Profile Updated Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Current Admin
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, email, role FROM admins WHERE id = ?', [req.admin.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create Sub-Admin (SuperAdmin Only)
exports.createSubAdmin = async (req, res) => {
  const { username, email, password, role } = req.body;
  
  if (req.admin.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Unauthorized: Only SuperAdmin can create sub-admins' });
  }

  try {
    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM admins WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await db.query(
      'INSERT INTO admins (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    res.json({ message: 'Sub-Admin Created Successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Database Error: ' + err.message });
  }
};

// Get All Admins (SuperAdmin Only)
exports.getAllAdmins = async (req, res) => {
  if (req.admin.role !== 'SuperAdmin') return res.status(403).json({ message: 'Unauthorized' });
  try {
    const [rows] = await db.query('SELECT id, username, email, role, created_at FROM admins');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Admin (SuperAdmin Only)
exports.deleteAdmin = async (req, res) => {
  if (req.admin.role !== 'SuperAdmin') return res.status(403).json({ message: 'Unauthorized' });
  try {
    await db.query('DELETE FROM admins WHERE id = ?', [req.params.id]);
    res.json({ message: 'Admin Deleted Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
