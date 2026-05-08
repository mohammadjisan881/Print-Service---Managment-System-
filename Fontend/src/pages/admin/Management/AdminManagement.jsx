import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, Trash2, Shield, Mail, Calendar, X } from 'lucide-react';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'OrderManager'
  });

  const token = localStorage.getItem('adminToken');
  const API = 'http://localhost:5000/api/auth/admins';

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(API, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register-subadmin', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || 'Sub-Admin Created Successfully');
      setShowAddModal(false);
      fetchAdmins();
      setFormData({ username: '', email: '', password: '', role: 'OrderManager' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create sub-admin. Your session might be expired, try logging out and back in.';
      alert(msg);
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/auth/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdmins();
    } catch (err) {
      alert('Failed to delete admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Admin Control</h1>
          <p className="text-slate-500 font-medium mt-1">Manage system access levels and sub-admin accounts</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <UserPlus size={20} /> Create New Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map(admin => (
          <div key={admin.id} className="card group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:text-accent group-hover:bg-accent/5">
                <Shield size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                admin.role === 'SuperAdmin' 
                ? 'bg-purple-50 text-purple-600 border-purple-100' 
                : admin.role === 'OrderManager' 
                ? 'bg-blue-50 text-blue-600 border-blue-100'
                : 'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
                {admin.role}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-800">{admin.username}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Mail size={16} /> {admin.email}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Calendar size={16} /> Created: {new Date(admin.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-end">
              {admin.role !== 'SuperAdmin' && (
                <button 
                  onClick={() => deleteAdmin(admin.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)} 
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-black text-slate-800 mb-6 font-sans tracking-tight">Provision Sub-Admin</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Username</label>
                <input required className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="jisan_manager" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                <input type="email" required className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="manager@artifypix.com" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Password</label>
                <input type="password" required className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Access Level (Role)</label>
                <select 
                  className="input-field" 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="OrderManager">Order Management (Emply oder Mangment)</option>
                  <option value="PrintManager">Print Management (Inventory Access)</option>
                </select>
              </div>

              <button type="submit" className="w-full mt-6 py-4 bg-accent text-white rounded-2xl font-black shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
