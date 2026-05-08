import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, Package, Clock, User, Phone, CheckCircle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getStatusBadge = (status) => {
  return "px-3 py-1 font-black rounded-full text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 bg-teal-50 text-teal-600 border border-teal-200/50";
};

const CompletedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders?status=Completed&search=${searchQuery}`, config);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto pb-12 relative animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><CheckCircle className="text-teal-500" size={32} /> Completed Orders</h1>
          <p className="text-slate-500 font-medium mt-1">Archived view of perfectly delivered orders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Name, Phone..." 
              className="input-field pl-10 w-72 bg-white"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400">
              <Database size={48} className="mb-4 text-slate-300" />
              <p className="text-lg font-bold">No completed orders found.</p>
              <p className="text-sm">When you mark a shipment as Completed, it will safely archive here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="py-4 px-6 font-black w-32">Order ID</th>
                  <th className="py-4 px-6 font-black">Customer</th>
                  <th className="py-4 px-6 font-black text-center">Items</th>
                  <th className="py-4 px-6 font-black text-right">Total Accrued</th>
                  <th className="py-4 px-6 font-black text-right">Net Profit</th>
                  <th className="py-4 px-6 font-black text-center">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => {
                  const legacyItemFallback = (!order.items || order.items.length === 0) && order.legacy_service_name;

                  return (
                    <tr key={order.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="py-4 px-6">
                        <span className="font-black text-slate-700 text-sm bg-slate-100 px-2.5 py-1 rounded-md">{order.order_id}</span>
                        <div className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1"><Clock size={10} /> {new Date(order.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-800 flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {order.client_name}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {order.phone_number}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">
                          <Package size={12} /> {(order.items && order.items.length) || (legacyItemFallback ? 1 : 0)} Items
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-black text-slate-800 text-lg">৳{order.total_price}</div>
                        <div className="text-[10px] text-emerald-500 font-bold mt-1 tracking-wider uppercase">Fully Paid</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-black text-teal-700 bg-teal-50 inline-block px-3 py-1 rounded-lg">৳{parseFloat(order.net_profit || 0).toFixed(2)}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="text-center">
                          <span className={getStatusBadge('Completed')}>
                            COMPLETED
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedOrders;
