import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Plus, Search, Trash2, Edit, AlertCircle, Package } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState('stock'); // 'stock' or 'stats'
  const [formData, setFormData] = useState({
    item_code: '',
    name: '',
    category: 'Media',
    total_stock: '',
    unit_type: 'SqFt',
    unit_cost: ''
  });
  const [bulkHelper, setBulkHelper] = useState({ totalPrice: '', totalQty: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [wastePrompt, setWastePrompt] = useState(null); // { order, amount }

  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const token = localStorage.getItem('adminToken');
  const API = 'http://localhost:5000/api/inventory';

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const [invRes, statsRes] = await Promise.all([
        axios.get(API, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setItems(invRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/${editingItem.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(API, formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowAddModal(false);
      setEditingItem(null);
      fetchInventory();
      setFormData({ item_code: '', name: '', category: 'Media', total_stock: '', unit_type: 'SqFt', unit_cost: '' });
      setBulkHelper({ totalPrice: '', totalQty: '' });
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session Expired. Please login again.");
        localStorage.clear();
        window.location.href = '/admin/login';
      } else {
        alert(err.response?.data?.message || err.response?.data?.error || 'Failed to process request');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchInventory();
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session Expired. Please login again.");
        localStorage.clear();
        window.location.href = '/admin/login';
      } else if (err.response?.data?.message?.includes('history usage')) {
        alert("বিঃদ্রঃ এই ম্যাটেরিয়ালটি ইতিমধ্যে কোনো অর্ডারে ব্যবহার করা হয়েছে, তাই এটি ডিলিট করা যাবে না। আপনি চাইলে স্টক বা দাম 'Edit' করে পরিবর্তন করতে পারেন।");
      } else {
        alert(err.response?.data?.message || err.response?.data?.error || 'Failed to delete');
      }
    }
  };

  const handleResidualWaste = (item) => {
    setWastePrompt({ item, amount: item.total_stock });
  };

  const submitWastePrompt = async () => {
    if (!wastePrompt) return;
    const { item, amount } = wastePrompt;
    
    let wasteAmount = parseFloat(amount === 'all' || !amount ? item.total_stock : amount);
    
    if (isNaN(wasteAmount) || wasteAmount <= 0 || wasteAmount > item.total_stock) {
      alert("Invalid amount entered. (সঠিক পরিমাণ দিন)");
      return;
    }

    try {
      await axios.post(`${API}/record-usage`, {
        inventory_id: item.id,
        order_id: null,
        quantity_used: 0,
        waste_quantity: wasteAmount
      }, { headers: { Authorization: `Bearer ${token}` } });
      setWastePrompt(null);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record waste');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code,
      name: item.name,
      category: item.category,
      total_stock: item.total_stock,
      unit_type: item.unit_type,
      unit_cost: item.unit_cost
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Inventory Management</h1>
          <p className="text-slate-500 font-medium mt-1">Track material stock, consumption, and costs</p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'SuperAdmin' && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setView('stock')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'stock' ? 'bg-white shadow-sm text-accent' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Stock View
              </button>
              <button 
                onClick={() => setView('stats')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'stats' ? 'bg-white shadow-sm text-accent' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Consumption Stats
              </button>
            </div>
          )}
          {user.role === 'SuperAdmin' && (
            <button 
              onClick={() => {
                setEditingItem(null);
                setFormData({ item_code: '', name: '', category: 'Media', total_stock: '', unit_type: 'SqFt', unit_cost: '' });
                setBulkHelper({ totalPrice: '', totalQty: '' });
                setShowAddModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Plus size={20} /> Add Material
            </button>
          )}
        </div>
      </div>

      {view === 'stock' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.filter(item => item.total_stock > 0).map(item => (
            <div key={item.id} className="card group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 pointer-events-none ${
                item.total_stock < 50 ? 'bg-red-500' : 'bg-green-500'
              }`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                  <Package size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                  {item.item_code}
                </span>
                {user.role === 'SuperAdmin' && (
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Item">
                      <Edit size={16} />
                    </button>
                    {item.total_stock > 0 && (
                      <button onClick={() => handleResidualWaste(item)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Mark Residual as Waste / Adjust Stock">
                         <AlertCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-black text-slate-800">{item.name}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{item.category}</p>

              <div className="mt-6 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Stock</p>
                  <p className={`text-2xl font-black ${item.total_stock < 50 ? 'text-red-500' : 'text-slate-800'}`}>
                    {item.total_stock} <span className="text-sm">{item.unit_type}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Value</p>
                  <p className="text-lg font-black text-emerald-600">৳{(item.total_stock * item.unit_cost).toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400">৳{item.unit_cost}/{item.unit_type}</p>
                </div>
              </div>

              {item.total_stock < 50 && (
                <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg border border-red-100 animate-pulse">
                  <AlertCircle size={14} /> Low Stock Warning
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Item Details</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Usage & Orders</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-rose-400">Total Waste</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Analytics (Revenue/Profit)</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.map(stat => (
                <tr key={stat.item_code} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-slate-800">{stat.name}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.item_code}</p>
                  </td>
                  <td className="p-6">
                    <p className="font-black text-slate-600">
                      {stat.total_used || 0} <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{stat.unit_type}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black rounded border border-indigo-100 uppercase tracking-tighter">
                        {stat.total_orders || 0} Linked Orders
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="font-black text-rose-500">{stat.total_waste || 0} <span className="text-[10px] text-rose-300 uppercase tracking-tighter">{stat.unit_type}</span></p>
                    <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Material Loss</p>
                  </td>
                  <td className="p-6">
                    <div className="grid grid-cols-2 gap-6 items-center">
                      <div>
                        <p className="text-base font-black text-slate-800">৳{(stat.total_revenue || 0).toLocaleString()}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
                      </div>
                      <div>
                        <p className={`text-base font-black ${(stat.total_revenue - stat.total_consumption_cost) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ৳{(stat.total_revenue - stat.total_consumption_cost).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EST. Profit</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden flex">
                       <div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, (stat.total_consumption_cost / (stat.total_revenue || 1)) * 100)}%` }} />
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Operating Margin: {stat.total_revenue > 0 ? (((stat.total_revenue - stat.total_consumption_cost) / stat.total_revenue) * 100).toFixed(1) : 0}%</p>
                  </td>
                  <td className="p-6 text-right">
                     <div className="flex items-center justify-end gap-3">
                        {user.role === 'SuperAdmin' && (
                          <div className="flex gap-2">
                             <button onClick={() => openEditModal(items.find(i => i.item_code === stat.item_code))} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                               <Edit size={18} />
                             </button>
                             <button onClick={() => handleDelete(items.find(i => i.item_code === stat.item_code)?.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                               <Trash2 size={18} />
                             </button>
                          </div>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="text-2xl font-black text-slate-800 mb-6">{editingItem ? 'Edit Material' : 'Add New Material'}</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Item Code</label>
                  <input required className="input-field" value={formData.item_code} onChange={e => setFormData({...formData, item_code: e.target.value})} placeholder="FLX-001" />
                </div>
                <div>
                  <select className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm outline-none focus:border-accent" value={formData.unit_type} onChange={e => setFormData({...formData, unit_type: e.target.value})}>
                    <option value="SqFt">SqFt (ব্যানার/মিডিয়া)</option>
                    <option value="Piece">Piece (মগ/ক্রেস্ট)</option>
                    <option value="Set">Set (সেট)</option>
                    <option value="Unit">Unit (অন্যান্য)</option>
                  </select>
                </div>
              </div>

              {/* Bulk Pricing Helper */}
              <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> 
                    {formData.unit_type === 'SqFt' ? 'Roll Dimension Helper (রোল হিসাব)' : 'Bulk Pricing Helper (ঐচ্ছিক)'}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => {
                        let totalQty = 0;
                        if (formData.unit_type === 'SqFt') {
                            totalQty = parseFloat(bulkHelper.width || 0) * parseFloat(bulkHelper.length || 0);
                        } else {
                            totalQty = parseFloat(bulkHelper.totalQty || 0);
                        }
                        
                        const cost = parseFloat(bulkHelper.totalPrice) / totalQty;
                        if (totalQty > 0) {
                            setFormData({
                                ...formData, 
                                total_stock: totalQty.toString(),
                                unit_cost: isFinite(cost) ? cost.toFixed(2) : ''
                            });
                        }
                    }}
                    className="text-[9px] font-black bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-all shadow-md shadow-indigo-200"
                  >
                    APPLY CALCULATION
                  </button>
                </div>

                {formData.unit_type === 'SqFt' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Width (ফিট)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold outline-none focus:border-indigo-400" 
                        placeholder="e.g. 3"
                        value={bulkHelper.width || ''}
                        onChange={e => setBulkHelper({...bulkHelper, width: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Length (ফিট)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold outline-none focus:border-indigo-400" 
                        placeholder="e.g. 200"
                        value={bulkHelper.length || ''}
                        onChange={e => setBulkHelper({...bulkHelper, length: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total Cost (৳)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold outline-none focus:border-indigo-400" 
                        placeholder="e.g. 5000"
                        value={bulkHelper.totalPrice}
                        onChange={e => setBulkHelper({...bulkHelper, totalPrice: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total Purchase Cost (মোট দাম ৳)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold outline-none focus:border-indigo-400" 
                        placeholder="e.g. 5000"
                        value={bulkHelper.totalPrice}
                        onChange={e => setBulkHelper({...bulkHelper, totalPrice: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total Quantity (মোট পিস)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold outline-none focus:border-indigo-400" 
                        placeholder="e.g. 250"
                        value={bulkHelper.totalQty}
                        onChange={e => setBulkHelper({...bulkHelper, totalQty: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                <p className="text-[9px] font-bold text-slate-400 leading-tight italic">
                  {formData.unit_type === 'SqFt' 
                    ? "* ৩ ফিট প্রস্থ এবং ২০০ ফিট লম্বা হলে অটো ৬০০ স্কয়ার ফিট স্টক হিসাবে নিবে।" 
                    : "* মোট দামকে মোট পিস দিয়ে ভাগ করে প্রতি ১ পিসের দাম অটো বের করবে।"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Item Name</label>
                <input required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Star Flex 2M" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total {formData.unit_type} Stock</label>
                  <input type="number" required className="input-field" value={formData.total_stock} onChange={e => setFormData({...formData, total_stock: e.target.value})} placeholder="250" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 italic text-accent">Unit Cost (প্রতি ১ ইউনিটের দাম)</label>
                  <input type="number" step="0.01" required className="input-field border-accent/20 bg-accent/5" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: e.target.value})} placeholder="20.00" />
                  <p className="text-[9px] text-slate-400 mt-1 italic">যেমন: ১ স্কয়ার ফিট বা ১ পিসের দাম</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3 font-bold text-white bg-accent rounded-xl shadow-lg shadow-accent/20 hover:scale-105 transition-all">Save Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waste Adjustment Modal */}
      {wastePrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden border border-slate-100">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16" />
             <div className="relative">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
                      <AlertCircle size={32} />
                    </div>
                    <button onClick={() => setWastePrompt(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                      <Plus className="rotate-45" size={24} />
                    </button>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Record Material Waste</h2>
                <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-wider">Item: {wastePrompt.item.name} ({wastePrompt.item.item_code})</p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Stock</p>
                        <p className="text-lg font-black text-slate-800">{wastePrompt.item.total_stock} <span className="text-xs">{wastePrompt.item.unit_type}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Action</p>
                        <p className="text-xs font-black text-amber-500 uppercase">Manual Deduction</p>
                      </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Amount to mark as waste (৳)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl text-xl font-black focus:border-amber-400 outline-none transition-all"
                      value={wastePrompt.amount} 
                      onChange={e => setWastePrompt({...wastePrompt, amount: e.target.value})} 
                      placeholder="e.g. 2.5"
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-2 italic">
                      * এই পরিমাণটি আপনার বর্তমান স্টক থেকে বাদ দেওয়া হবে এবং লস হিসেবে রেকর্ড হবে।
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setWastePrompt(null)} className="flex-1 py-4 font-black text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">Cancel</button>
                    <button onClick={submitWastePrompt} className="flex-2 py-4 font-black text-white bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                        Confirm Waste
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
