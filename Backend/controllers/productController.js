const db = require('../db');

// Add Product
exports.addProduct = async (req, res) => {
  const { name, description, base_price, category, unit_type, cost_price, cost_preset_id } = req.body;
  
  let image_url = req.body.image_url || '';
  if (req.file) {
    image_url = `http://localhost:5000/uploads/${req.file.filename}`;
  }

  try {
    await db.query(
      'INSERT INTO products (name, description, base_price, cost_price, category, unit_type, image_url, cost_preset_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, base_price || 0, cost_price || 0, category || 'General', unit_type || 'Piece', image_url, cost_preset_id || null]
    );
    res.json({ message: 'Product Added Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Products
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit Product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, base_price, cost_price, category, unit_type, cost_preset_id } = req.body;
  
  let image_url = req.body.image_url;
  if (req.file) {
    image_url = `http://localhost:5000/uploads/${req.file.filename}`;
  }

  try {
    if (image_url) {
      await db.query(
        'UPDATE products SET name = ?, description = ?, base_price = ?, cost_price = ?, category = ?, unit_type = ?, image_url = ?, cost_preset_id = ? WHERE id = ?',
        [name, description, base_price || 0, cost_price || 0, category || 'General', unit_type || 'Piece', image_url, cost_preset_id || null, id]
      );
    } else {
      await db.query(
        'UPDATE products SET name = ?, description = ?, base_price = ?, cost_price = ?, category = ?, unit_type = ?, cost_preset_id = ? WHERE id = ?',
        [name, description, base_price || 0, cost_price || 0, category || 'General', unit_type || 'Piece', cost_preset_id || null, id]
      );
    }
    res.json({ message: 'Product Updated Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product Deleted Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
