import React, { useState } from 'react';
import { User, Shield, Database, Download, Save, RefreshCw } from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    username: JSON.parse(localStorage.getItem('adminUser'))?.username || 'admin',
    email: JSON.parse(localStorage.getItem('adminUser'))?.email || '',
    password: ''
  });

  const handleBackup = () => {
    alert('SQL Backup Generated! Check your downloads (Simulation)');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl font-black">Admin Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4 bg-accent text-white border-none shadow-premium">
             <div className="p-3 bg-white/20 rounded-xl"><User size={24}/></div>
             <div>
               <p className="text-xs font-bold text-white/70">Authenticated as</p>
               <p className="font-black">@{formData.username}</p>
             </div>
          </div>
          <p className="text-sm text-slate-500 font-medium px-2 leading-relaxed">
            Manage your credentials and secure your account. Only one admin account is permitted for SAAS security.
          </p>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-accent" size={24} />
              <h2 className="text-xl font-black">Profile Security</h2>
            </div>
            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Username</label>
                  <input className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Email</label>
                  <input className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">New Password (Leave blank to keep current)</label>
                <input type="password" className="input-field" placeholder="••••••••" onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                <Save size={18} /> Update Profile
              </button>
            </form>
          </div>

          <div className="card border-dashed border-2">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Database className="text-slate-400" size={24} />
                <h2 className="text-xl font-black">Data Management</h2>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full">Last Sync: Just now</span>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Export your entire database as a SQL file. Regularly backing up your data ensures you never lose order records or financial history.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleBackup}
                className="flex-1 px-6 py-4 bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg hover:bg-slate-900 transition-all"
              >
                <Download size={20} /> Export SQL Dump
              </button>
              <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
