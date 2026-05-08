import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, PieChart, Database, Settings, LogOut, Users, CheckCircle, Award, XCircle, Briefcase, Contact, Truck } from 'lucide-react';

const Sidebar = () => {
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const role = user.role || 'SuperAdmin';

  const links = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin', roles: ['SuperAdmin', 'OrderManager', 'PrintManager'] },
    { name: 'Catalog', icon: <Package size={20} />, path: '/admin/catalog', roles: ['SuperAdmin'] },
    { name: 'Inventory', icon: <Database size={20} />, path: '/admin/inventory', roles: ['SuperAdmin', 'PrintManager'] },
    { name: 'Orders', icon: <ShoppingCart size={20} />, path: '/admin/orders', roles: ['SuperAdmin', 'OrderManager'] },
    { name: 'Cancelled Orders', icon: <XCircle size={20} />, path: '/admin/cancelled-orders', roles: ['SuperAdmin', 'OrderManager'] },
    { name: 'Print Queue', icon: <PieChart size={20} />, path: '/admin/print-management', roles: ['SuperAdmin', 'PrintManager'] },
    { name: 'Performance', icon: <Award size={20} />, path: '/admin/performance', roles: ['SuperAdmin', 'OrderManager', 'PrintManager'] },
    { name: 'Completed Orders', icon: <CheckCircle size={20} />, path: '/admin/completed-orders', roles: ['SuperAdmin', 'OrderManager'] },
    { name: 'Customers', icon: <Contact size={20} />, path: '/admin/customers', roles: ['SuperAdmin', 'OrderManager'] },
    { name: 'Dues Tracker', icon: <CreditCard size={20} />, path: '/admin/dues', roles: ['SuperAdmin', 'OrderManager'] },
    { name: 'Suppliers', icon: <Truck size={20} />, path: '/admin/suppliers', roles: ['SuperAdmin'] },
    { name: 'Finances', icon: <PieChart size={20} />, path: '/admin/finances', roles: ['SuperAdmin'] },
    { name: 'Loans', icon: <Briefcase size={20} />, path: '/admin/loans', roles: ['SuperAdmin'] },
    { name: 'Service Costs', icon: <CreditCard size={20} />, path: '/admin/service-costs', roles: ['SuperAdmin'] },
    { name: 'Employees', icon: <Users size={20} />, path: '/admin/employees', roles: ['SuperAdmin'] },
    { name: 'Admin Control', icon: <Settings size={20} />, path: '/admin/admins', roles: ['SuperAdmin'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  return (
    <div className="w-68 bg-white border-r h-screen p-6 flex flex-col shadow-sm">
      <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
        <div className="w-12 h-12 bg-slate-900 border-2 border-accent/20 rounded-2xl flex items-center justify-center text-accent font-black text-2xl shadow-xl shadow-slate-200 transition-transform group-hover:scale-110">
          P
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">Print<span className="text-accent">X.</span></h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${role === 'SuperAdmin' ? 'bg-indigo-500' : role === 'PrintManager' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">{role.replace(/([A-Z])/g, ' $1').trim()} Control</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1">
        {filteredLinks.map(link => (
          <NavLink key={link.path} to={link.path} className={({isActive}) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
              isActive 
              ? 'bg-accent/10 text-accent' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`
          }>
            {link.icon} <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto mb-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3 group/profile">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover/profile:scale-110">
          {(user.username || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-black text-slate-800 truncate leading-tight">{user.username || 'Admin'}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{role}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-black text-sm uppercase tracking-widest"
      >
        <LogOut size={18} /> <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
