import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import Track_Order from './pages/Track_Order'
import PlaceOrder from './pages/PlaceOrder'

import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard/Dashboard';
import Catalog from './pages/admin/Catalog/Catalog';
import Orders from './pages/admin/Orders/Orders';
import CompletedOrders from './pages/admin/Orders/CompletedOrders';
import AdminAddOrder from './pages/admin/Orders/AdminAddOrder';
import Finances from './pages/admin/Finances/Finances';
import Dues from './pages/admin/Orders/Dues';
import Employees from './pages/admin/Management/Employees';
import Settings from './pages/admin/Settings/Settings';
import Inventory from './pages/admin/Inventory/Inventory';
import PrintManagement from './pages/admin/Printing/PrintManagement';
import AdminManagement from './pages/admin/Management/AdminManagement';
import PerformanceDashboard from './pages/admin/Management/PerformanceDashboard';
import ServiceCosts from './pages/admin/Management/ServiceCosts';
import CancelledOrders from './pages/admin/Management/CancelledOrders';
import Sidebar from './components/admin/Sidebar';
import Loans from './pages/admin/Loans/Loans';
import Customers from './pages/admin/Customers/Customers';
import Suppliers from './pages/admin/Suppliers/Suppliers';

const MainLayout = () => (
  <div>
    <Navbar />
    <Outlet />
    <Footer />
  </div>
);

const AdminProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const role = user.role || 'SuperAdmin';

  if (!token) return <Navigate to="/admin/login" />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home/>} />
        <Route path='/products' element={<Products/>} />
        <Route path='/track' element={<Track_Order/>} />
        <Route path='/place-order' element={<PlaceOrder/>} />
      </Route>

      <Route path="/admin/login" element={<Login />} />
      
      <Route path="/admin" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
      <Route path="/admin/catalog" element={<AdminProtectedRoute allowedRoles={['SuperAdmin']}><Catalog /></AdminProtectedRoute>} />
      <Route path="/admin/inventory" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'PrintManager']}><Inventory /></AdminProtectedRoute>} />
      <Route path="/admin/orders" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager']}><Orders /></AdminProtectedRoute>} />
      <Route path="/admin/print-management" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'PrintManager']}><PrintManagement /></AdminProtectedRoute>} />
      <Route path="/admin/completed-orders" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager', 'PrintManager']}><CompletedOrders /></AdminProtectedRoute>} />
      <Route path="/admin/orders/new" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager']}><AdminAddOrder /></AdminProtectedRoute>} />
      <Route path="/admin/dues" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager']}><Dues /></AdminProtectedRoute>} />
      <Route path="/admin/finances" element={<AdminProtectedRoute allowedRoles={['SuperAdmin']}><Finances /></AdminProtectedRoute>} />
      <Route path="/admin/loans" element={<AdminProtectedRoute allowedRoles={['SuperAdmin']}><Loans /></AdminProtectedRoute>} />
      <Route path="/admin/service-costs" element={<AdminProtectedRoute allowedRoles={['SuperAdmin']}><ServiceCosts /></AdminProtectedRoute>} />
      <Route path="/admin/employees" element={<AdminProtectedRoute allowedRoles={['SuperAdmin']}><Employees /></AdminProtectedRoute>} />
      <Route path="/admin/admins" element={<AdminProtectedRoute allowedRoles={['SuperAdmin']}><AdminManagement /></AdminProtectedRoute>} />
      <Route path="/admin/performance" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager', 'PrintManager']}><PerformanceDashboard /></AdminProtectedRoute>} />
      <Route path="/admin/cancelled-orders" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager']}><CancelledOrders /></AdminProtectedRoute>} />
      <Route path="/admin/customers" element={<AdminProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager']}><Customers /></AdminProtectedRoute>} />
      <Route path="/admin/suppliers" element={<AdminProtectedRoute allowedRoles={['SuperAdmin']}><Suppliers /></AdminProtectedRoute>} />
      <Route path="/admin/settings" element={<AdminProtectedRoute allowedRoles={['SuperAdmin']}><Settings /></AdminProtectedRoute>} />
    </Routes>
  )
}

export default App
