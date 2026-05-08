const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { sendWhatsAppMessage } = require('../utils/whatsapp');

const STATUS_SEQUENCE = ['Pending', 'Confirmed', 'Designing', 'Printing', 'Delivered', 'Completed'];

// Create Order
exports.createOrder = async (req, res) => {
  const { client_name, phone_number, company_name, delivery_date, design_instructions, advance_paid } = req.body;
  const order_id = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
  
  let design_file = '';
  if (req.file) {
    design_file = `http://localhost:5000/uploads/${req.file.filename}`;
  }

  let items = [];
  try {
    if (req.body.items) {
      items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
    }
  } catch (e) {
    console.error('Error parsing items JSON:', e);
  }

  try {
    // Calculate total price based on items array
    let total_price = 0;
    let initial_printing_cost = 0;
    
    if (items && Array.isArray(items) && items.length > 0) {
      // Calculate total price
      items.forEach(item => total_price += parseFloat(item.total_price || 0));

      // NEW: Calculate initial printing cost based on product -> cost_presets (match by ID)
      // This is more robust as it doesn't depend on name matching
      const productIds = items.filter(it => it.service_id && it.service_id !== 'custom').map(it => it.service_id);
      
      if (productIds.length > 0) {
        // Look up the cost_preset_id for these products
        const [products] = await db.query('SELECT p.id, cp.amount FROM products p JOIN cost_presets cp ON p.cost_preset_id = cp.id WHERE p.id IN (?)', [productIds]);
        const costMap = {};
        products.forEach(p => costMap[p.id] = p.amount);
        
        items.forEach(item => {
          if (item.service_id && costMap[item.service_id]) {
            initial_printing_cost += (parseFloat(costMap[item.service_id]) * (item.quantity || 1));
          }
        });
      }
    } else if (req.body.total_price) {
      total_price = parseFloat(req.body.total_price || 0);
    }
    
    // Safety check
    if (isNaN(total_price)) total_price = 0;

    let initial_status = 'Pending';
    if (req.body.admin_created === 'true' || req.body.admin_created === true) {
      initial_status = 'Confirmed';
    }

    let parsedAdvance = parseFloat(advance_paid || 0);
    if (isNaN(parsedAdvance)) parsedAdvance = 0;

    const { is_wholesale, outside_press_name } = req.body;
    const [result] = await db.query(
      'INSERT INTO orders (order_id, client_name, phone_number, company_name, delivery_date, total_price, advance_paid, design_instructions, design_file, status, is_wholesale, outside_press_name, printing_cost, net_profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [order_id, client_name, phone_number, company_name || null, delivery_date, total_price, parsedAdvance, design_instructions || null, design_file || null, initial_status, is_wholesale || false, outside_press_name || null, initial_printing_cost, total_price - initial_printing_cost]
    );

    const insertedOrderId = result.insertId;

    if (items && Array.isArray(items) && items.length > 0) {
      const values = items.map(item => {
        let sid = item.service_id;
        let cName = null;
        if (sid === 'custom') {
          sid = null;
          cName = item.custom_service_name || 'Custom Order';
        }
        return [
          insertedOrderId,
          sid,
          cName,
          item.quantity || 1,
          item.print_width || null,
          item.print_height || null,
          item.unit_price || 0,
          item.total_price || 0
        ];
      });
      await db.query(
        'INSERT INTO order_items (order_id, service_id, custom_service_name, quantity, print_width, print_height, unit_price, total_price) VALUES ?',
        [values]
      );
    }

    res.json({ message: 'Order Created', id: insertedOrderId, order_id });

    if (parsedAdvance > 0) {
      await db.query('INSERT INTO payments_log (order_id, amount, type, note) VALUES (?, ?, ?, ?)', 
        [insertedOrderId, parsedAdvance, 'Advance', 'Initial Advance at Creation']);
    }

    // Send WhatsApp Notification
    const trackUrl = `http://localhost:5173/track/${order_id}`;
    const welcomeMsg = `Hello ${client_name}, your order ${order_id} has been received. Expected delivery: ${delivery_date}. You can track your order and view invoice here: ${trackUrl}. Thank you!`;
    sendWhatsAppMessage(phone_number, welcomeMsg);

    req.app.get('socketio').emit('orderUpdate');
  } catch (err) {
    console.error('Order Submission Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get All Orders (With Filters and Items)
exports.getOrders = async (req, res) => {
  const { status, search } = req.query;
  try {
    let query = 'SELECT o.*, p.name as legacy_service_name, p.unit_type as legacy_unit_type FROM orders o LEFT JOIN products p ON o.service_id = p.id';
    let params = [];
    let conditions = [];

    if (status && status !== 'All') {
      conditions.push('o.status = ?');
      params.push(status);
    } else if (status !== 'All') {
      // Default behavior: exclude Completed from the active list if no specific status is asked
      // BUT if 'All' is explicitly requested, we show EVERYTHING.
      conditions.push('o.status != ?');
      params.push('Completed');
    }

    if (search) {
      conditions.push('(o.client_name LIKE ? OR o.phone_number LIKE ? OR o.company_name LIKE ? OR o.order_id LIKE ?)');
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY o.created_at DESC';
    const [rows] = await db.query(query, params);

    // Fetch items for all orders
    const [items] = await db.query('SELECT oi.*, p.name as service_name, p.unit_type FROM order_items oi LEFT JOIN products p ON oi.service_id = p.id');
    
    const enrichedOrders = rows.map(order => {
      const orderItems = items.filter(i => i.order_id === order.id);
      return {
        ...order,
        items: orderItems
      };
    });

    res.json(enrichedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Finance Details per order
exports.updateFinances = async (req, res) => {
  const { id } = req.params;
  const { advance_paid, printing_cost, return_cost } = req.body;
  try {
    const adv = parseFloat(advance_paid || 0);
    const print = parseFloat(printing_cost || 0);
    const ret = parseFloat(return_cost || 0);
    
    // NEW: Log the finance correction if advance changed
    const [oldOrder] = await db.query('SELECT advance_paid FROM orders WHERE id = ?', [id]);
    const diff = adv - (oldOrder[0]?.advance_paid || 0);
    if (diff !== 0) {
        await db.query('INSERT INTO payments_log (order_id, amount, type, note) VALUES (?, ?, ?, ?)', 
            [id, diff, 'Partial', 'Advance amount corrected in finance update']);
    }

    await db.query(
      'UPDATE orders SET advance_paid = ?, printing_cost = ?, return_cost = ?, net_profit = (total_price - ? - ?) WHERE id = ?',
      [adv, print, ret, print, ret, id]
    );
    
    res.json({ message: 'Finances Updated Successfully' });
    req.app.get('socketio').emit('orderUpdate');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Order Status & Calculate Profit
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, advance_paid, printing_cost, extra_expenses } = req.body;

  try {
    const [currentOrder] = await db.query('SELECT status, total_price, printing_cost, advance_paid FROM orders WHERE id = ?', [id]);
    if (!currentOrder || currentOrder.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    let currentStatus = currentOrder[0].status;
    const totalPrice = parseFloat(currentOrder[0].total_price || 0);
    const existingAdvance = parseFloat(currentOrder[0].advance_paid || 0);

    // Legacy normalization no longer needed

    // Handle Cancelled / Returned separately (allowed from most steps)
    if (status === 'Cancelled') {
        const currentStatus = currentOrder[0].status;
        let pCost = parseFloat(currentOrder[0].printing_cost || 0);
        
        // NEW RULE: If cancelled from early stages, it didn't cost anything yet
        if (['Pending', 'Confirmed', 'Designing'].includes(currentStatus)) {
            pCost = 0;
            // Also update the order record to zero out printing_cost
            await db.query('UPDATE orders SET printing_cost = 0, net_profit = 0 WHERE id = ?', [id]);
        }
        
        const now = new Date();
        // Set completed_at to JS Date so analytics can track the loss for TODAY
        await db.query('UPDATE orders SET status = ?, net_profit = ?, completed_at = ? WHERE id = ?', [status, -pCost, now, id]);
        
        req.app.get('socketio').emit('orderUpdate');
        req.app.get('socketio').emit('financeUpdate');
        return res.json({ message: 'Order Cancelled' });
    }

    if (status === 'Returned') {
        const { refund_amount } = req.body;
        // Returned is a holding state. NO profit change here yet.
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        
        if (refund_amount && parseFloat(refund_amount) > 0) {
            await db.query('INSERT INTO payments_log (order_id, amount, type, note) VALUES (?, ?, ?, ?)', 
                [id, -parseFloat(refund_amount), 'Partial', `Refund issued during return`]);
            req.app.get('socketio').emit('financeUpdate');
        }

        req.app.get('socketio').emit('orderUpdate');
        return res.json({ message: 'Order Moved to Returned (Holding)' });
    }

    // Allow transition FROM Returned to others
    if (currentStatus === 'Returned') {
        // From Returned, can go to Delivered, Completed, or Cancelled (handled above)
        if (!['Delivered', 'Completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid transition from Returned' });
        }
        // Fall through to normal step logic below
    } else {
        // Strict Sequence Check for normal workflow
        const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
        const targetIndex = STATUS_SEQUENCE.indexOf(status);

        if (targetIndex === -1) return res.status(400).json({ error: 'Invalid status' });

        // Ensure it's the next step
        if (targetIndex !== currentIndex + 1) {
            return res.status(400).json({ 
                error: `You must move step-by-step. Current: ${currentStatus}, Next should be: ${STATUS_SEQUENCE[currentIndex + 1] || 'None'}` 
            });
        }
    }

    // Step-Specific Logic
    let updateFields = { status };
    let queryParams = [status];

    // 1. Pending/Confirmed/Designing -> Confirmed/Designing/Printing (Advance Check)
    if (advance_paid !== undefined) {
        const newAdv = parseFloat(advance_paid);
        updateFields.advance_paid = newAdv;
        queryParams.push(newAdv);
        
        // Log the payment if it changed substantially (> 0.1)
        const diff = newAdv - existingAdvance;
        if (Math.abs(diff) > 0.1) {
            await db.query('INSERT INTO payments_log (order_id, amount, type, note) VALUES (?, ?, ?, ?)', 
                [id, diff, 'Advance', `Advance adjusted during transition to ${status}`]);
            req.app.get('socketio').emit('financeUpdate');
        }
    }

    // 2. Printing -> Delivered (Cost Check)
    if (status === 'Delivered') {
        const pCost = parseFloat(printing_cost || currentOrder[0].printing_cost || 0);
        updateFields.printing_cost = pCost;
        queryParams.push(pCost);
    }

    // 3. Delivery -> Completed (Profit Calc)
    if (status === 'Completed') {
        const pCost = currentOrder[0].printing_cost || 0;
        const extra = parseFloat(extra_expenses || 0);
        const profit = totalPrice - pCost - extra;
        
        updateFields.net_profit = profit;
        updateFields.completed_by = req.admin.id;
        updateFields.completed_at = new Date();
        
        // Remove profit/admin from queryParams first to rebuild it cleanly
        // Actually, just let the dynamic builder handle everything
        const k = Object.keys(updateFields);
        const v = Object.values(updateFields);
        v.push(id);
        
        await db.query(`UPDATE orders SET ${k.map(f => `${f} = ?`).join(', ')} WHERE id = ?`, v);
        req.app.get('socketio').emit('financeUpdate');
    } else {
        // General update for other transitions
        const setClause = Object.keys(updateFields).map(k => `${k} = ?`).join(', ');
        queryParams.push(id);
        await db.query(`UPDATE orders SET ${setClause} WHERE id = ?`, queryParams);
    }

    res.json({ message: `Order moved to ${status}` });
    
    // Send WhatsApp Notification for Status Change
    const statusMsg = `Update for Order ${currentOrder[0].order_id}: Your order status has been changed to "${status}".`;
    sendWhatsAppMessage(currentOrder[0].phone_number, statusMsg);

    req.app.get('socketio').emit('orderUpdate');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Payment
exports.addPayment = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  try {
    await db.query('UPDATE orders SET advance_paid = advance_paid + ? WHERE id = ?', [amount, id]);
    
    // Log the payment
    const pType = req.body.type || 'Due Payment';
    await db.query('INSERT INTO payments_log (order_id, amount, type, note) VALUES (?, ?, ?, ?)', 
        [id, amount, pType, `Dues collected: ৳${amount}`]);

    res.json({ message: 'Payment Added Successfully' });
    req.app.get('socketio').emit('orderUpdate');
    req.app.get('socketio').emit('financeUpdate');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Payment History for an Order
exports.getPaymentHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM payments_log WHERE order_id = ? ORDER BY payment_date DESC', [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ message: 'Order Deleted Successfully' });
    req.app.get('socketio').emit('orderUpdate');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Track Order Public API
exports.trackOrder = async (req, res) => {
  const { order_id } = req.params;
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[0];
    const [items] = await db.query('SELECT oi.*, p.name as service_name, p.unit_type FROM order_items oi LEFT JOIN products p ON oi.service_id = p.id WHERE oi.order_id = ?', [order.id]);
    
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
