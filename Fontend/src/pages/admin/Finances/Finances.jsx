import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, PieChart, TrendingDown, TrendingUp, Calendar, Tag, FileText, X } from 'lucide-react';

const Finances = () => {
  const [finances, setFinances] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ type: 'Expense', category: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
  
  const token = localStorage.getItem('adminToken');
  const API = 'http://localhost:5000/api/finances';

  const fetchFinances = async () => {
    try {
      const res = await axios.get(API, { headers: { Authorization: `Bearer ${token}` } });
      setFinances(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API, formData, { headers: { Authorization: `Bearer ${token}` } });
      setIsModalOpen(false);
      setFormData({ type: 'Expense', category: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
      fetchFinances();
    } catch (err) {
      alert('Error adding entry');
    }
  };

  const totals = finances.reduce((acc, curr) => {
    if (curr.type === 'Expense') acc.expenses += parseFloat(curr.amount);
    else acc.investments += parseFloat(curr.amount);
    return acc;
  }, { expenses: 0, investments: 0 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Financial Tracking</h1>
          <p className="text-slate-500 font-medium">Monitor your expenses and business investments</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Add Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Expenses</p>
              <h3 className="text-2xl font-black text-slate-800">৳{totals.expenses.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Investments</p>
              <h3 className="text-2xl font-black text-slate-800">৳{totals.investments.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-black mb-6">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                <th className="pb-5 font-black">Date</th>
                <th className="pb-5 font-black">Type</th>
                <th className="pb-5 font-black">Category</th>
                <th className="pb-5 font-black">Note</th>
                <th className="pb-5 text-right font-black">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold divide-y divide-slate-50/50">
              {finances.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 text-slate-500 font-medium">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${
                      item.type === 'Expense' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 text-slate-800">{item.category}</td>
                  <td className="py-4 text-slate-500 italic max-w-xs truncate">{item.note || 'No notes'}</td>
                  <td className={`py-4 text-right font-black ${item.type === 'Expense' ? 'text-red-600' : 'text-green-600'}`}>
                    ৳{item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">Add Financial Entry</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                {['Expense', 'Investment'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      formData.type === type ? 'bg-white shadow-sm text-accent' : 'text-slate-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    className="input-field pl-12" 
                    placeholder="e.g. Rent, Ink, Salary"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Amount (৳)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Note (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    className="input-field pl-12" 
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-4 mt-4">
                Save Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finances;
