const db = require('../db');

// Get All Inventory
exports.getAllInventory = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM inventory ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Inventory Item
exports.addInventoryItem = async (req, res) => {
  const { item_code, name, category, total_stock, unit_type, unit_cost } = req.body;
  if (req.admin.role !== 'SuperAdmin') return res.status(403).json({ message: 'Only SuperAdmin can add inventory' });

  try {
    await db.query(
      'INSERT INTO inventory (item_code, name, category, total_stock, unit_type, unit_cost) VALUES (?, ?, ?, ?, ?, ?)',
      [item_code, name, category, total_stock, unit_type, unit_cost]
    );
    res.json({ message: 'Inventory Item Added Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Full Inventory Item Details (SuperAdmin only)
exports.updateInventoryItem = async (req, res) => {
  const { id } = req.params;
  const { item_code, name, category, total_stock, unit_type, unit_cost } = req.body;
  if (req.admin.role !== 'SuperAdmin') return res.status(403).json({ message: 'Forbidden' });

  try {
    await db.query(
      'UPDATE inventory SET item_code = ?, name = ?, category = ?, total_stock = ?, unit_type = ?, unit_cost = ? WHERE id = ?',
      [item_code, name, category, total_stock, unit_type, unit_cost, id]
    );
    res.json({ message: 'Inventory Item Updated Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Inventory Item
exports.deleteInventoryItem = async (req, res) => {
  const { id } = req.params;
  if (req.admin.role !== 'SuperAdmin') return res.status(403).json({ message: 'Forbidden' });

  try {
    // Check if item has usage records (prevent deletion if used)
    const [usage] = await db.query('SELECT id FROM inventory_usage WHERE inventory_id = ? LIMIT 1', [id]);
    if (usage.length > 0) {
      return res.status(400).json({ message: 'Cannot delete item that has history usage records. Try editing instead.' });
    }

    await db.query('DELETE FROM inventory WHERE id = ?', [id]);
    res.json({ message: 'Inventory Item Deleted Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Record Usage (Mainly for PrintManagers)
exports.recordUsage = async (req, res) => {
  const { inventory_id, order_id, quantity_used, waste_quantity = 0 } = req.body;
  
  try {
    // 1. Get current item details
    const [inv] = await db.query('SELECT total_stock, unit_cost, unit_type FROM inventory WHERE id = ?', [inventory_id]);
    if (inv.length === 0) return res.status(404).json({ message: 'Item not found' });
    
    let finalQty = parseFloat(quantity_used || 0);

    // If SqFt and quantity not provided, try to calculate from order dimensions
    if (inv[0].unit_type === 'SqFt' && finalQty === 0) {
      const [order] = await db.query('SELECT print_width, print_height FROM orders WHERE id = ?', [order_id]);
      if (order.length > 0 && order[0].print_width && order[0].print_height) {
        finalQty = order[0].print_width * order[0].print_height;
      }
    }

    const totalDeduction = finalQty + parseFloat(waste_quantity);

    if (inv[0].total_stock < totalDeduction) {
      return res.status(400).json({ message: 'Insufficient stock in inventory' });
    }

    const cost = inv[0].unit_cost * totalDeduction;

    // 2. Insert usage record with admin ID
    await db.query(
      'INSERT INTO inventory_usage (inventory_id, order_id, quantity_used, waste_quantity, cost_at_usage, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [inventory_id, order_id || null, finalQty, waste_quantity, cost, req.admin.id]
    );

    // 3. Subtract from inventory
    await db.query('UPDATE inventory SET total_stock = total_stock - ? WHERE id = ?', [totalDeduction, inventory_id]);

    // 4. Update order printing cost and net profit (Only if order_id is provided)
    if (order_id) {
      await db.query('UPDATE orders SET printing_cost = printing_cost + ? WHERE id = ?', [cost, order_id]);
      await db.query('UPDATE orders SET net_profit = total_price - printing_cost - return_cost WHERE id = ?', [order_id]);
    }

    res.json({ message: 'Stock updated', cost, totalDeduction });
    req.app.get('socketio').emit('orderUpdate');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Inventory Stats (Profit/Loss per item)
exports.getInventoryStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        i.id,
        i.item_code, 
        i.name, 
        i.unit_type,
        i.unit_cost,
        i.total_stock as remaining_stock,
        COALESCE(usage_stats.total_used, 0) as total_used,
        COALESCE(usage_stats.total_waste, 0) as total_waste,
        COALESCE(usage_stats.total_consumption_cost, 0) as total_consumption_cost,
        COALESCE(usage_stats.total_orders, 0) as total_orders,
        COALESCE(order_stats.total_revenue, 0) as total_revenue
      FROM inventory i
      LEFT JOIN (
        SELECT 
          inventory_id,
          SUM(quantity_used) as total_used,
          SUM(waste_quantity) as total_waste,
          SUM(cost_at_usage) as total_consumption_cost,
          COUNT(DISTINCT order_id) as total_orders
        FROM inventory_usage
        GROUP BY inventory_id
      ) usage_stats ON i.id = usage_stats.inventory_id
      LEFT JOIN (
        SELECT 
          iu.inventory_id,
          SUM(o.total_price) as total_revenue
        FROM (SELECT DISTINCT inventory_id, order_id FROM inventory_usage) iu
        JOIN orders o ON iu.order_id = o.id
        GROUP BY iu.inventory_id
      ) order_stats ON i.id = order_stats.inventory_id
      GROUP BY i.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
