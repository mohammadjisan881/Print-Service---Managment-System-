const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const db = require('./db');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('socketio', io);

const PORT = process.env.PORT || 5000;
const setupDB = require('./setup_db');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const financeRoutes = require('./routes/finances');
const employeeRoutes = require('./routes/employees');
const inventoryRoutes = require('./routes/inventory');
const performanceRoutes = require('./routes/performance');
const costPresetsRoutes = require('./routes/costPresets');
const analyticsRoutes = require('./routes/analytics');
const loanRoutes = require('./routes/loans');
const supplierRoutes = require('./routes/suppliers');
const customerRoutes = require('./routes/customers');

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/cost-presets', costPresetsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('PrintPress API is Running...');
});

// Run DB Setup and Start Server
setupDB().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} with WebSockets`);
    });
});
