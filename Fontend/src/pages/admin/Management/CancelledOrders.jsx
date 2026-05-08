import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, RefreshCw, XCircle, Search, Loader2, Package, User, Phone, Calendar, Clock, RotateCcw } from 'lucide-react';

const CancelledOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const token = localStorage.getItem('adminToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/orders?status=Cancelled&search=${searchQuery}`, config);
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch cancelled orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchQuery]);

  const recoverOrder = async (id) => {
    if (window.confirm('Do you want to recover this order? It will be moved back to "Pending" status.')) {
        try {
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: 'Pending' }, config);
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to recover order');
        }
    }
  };

  const deletePermanently = async (id) => {
    if (window.confirm('WARNING: Permenantly deleting this order will remove all records from the database. This cannot be undone. Proceed?')) {
        try {
            await axios.delete(`http://localhost:5000/api/orders/${id}`, config);
            fetchOrders();
        } catch (err) {
            alert('Failed to delete order');
        }
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-rose-600 tracking-tight italic">Cancelled Orders.</h1>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Registry of terminated operations</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search cancelled backlog..." 
            className="bg-white border border-slate-100 px-10 py-2.5 rounded-xl text-xs font-bold w-72 shadow-sm focus:ring-2 ring-rose-500/10 outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        {loading ? (
            <div className="flex flex-col items-center justify-center p-32 gap-4">
                <Loader2 className="animate-spin text-rose-500" size={32} />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Scanning Wasteland...</p>
            </div>
        ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-slate-300">
                <XCircle size={56} strokeWidth={1} className="mb-4 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">No matching cancellations found</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                            <th className="py-6 px-10">Termination Record</th>
                            <th className="py-6 px-10">Original Value</th>
                            <th className="py-6 px-10 text-center">Safety Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {orders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-6 px-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.order_id}</span>
                                        <p className="font-black text-slate-700 text-lg tracking-tight italic">{order.client_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                            <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </td>
                                <td className="py-6 px-10">
                                    <p className="text-xl font-black text-slate-400 italic line-through decoration-rose-500/30 hover:decoration-rose-500 transition-all">৳{order.total_price.toLocaleString()}</p>
                                    <p className="text-[10px] font-black text-rose-500/50 uppercase tracking-tighter mt-1">Zero Realized Value</p>
                                </td>
                                <td className="py-6 px-10">
                                    <div className="flex items-center justify-center gap-4">
                                        <button 
                                            onClick={() => recoverOrder(order.id)}
                                            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-500/10"
                                        >
                                            <RotateCcw size={14} /> Recover
                                        </button>
                                        <button 
                                            onClick={() => deletePermanently(order.id)}
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                            title="Permanently Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default CancelledOrders;
