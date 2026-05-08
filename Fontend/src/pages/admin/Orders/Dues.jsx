import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, Phone, User, Calendar, ArrowRight, 
  AlertTriangle, X, Search, Loader2, History, 
  TrendingDown, CheckCircle, Clock, Filter, ChevronRight
} from 'lucide-react';
import io from 'socket.io-client';

const Dues = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All'); // Today, 7Days, ThisMonth, All
  
  const [paymentModal, setPaymentModal] = useState(null);
  const [historyOrder, setHistoryOrder] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const token = localStorage.getItem('adminToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const socket = io('http://localhost:5000');

  const fetchDues = async () => {
    try {
      setLoading(true);
      // Specifically fetch Completed orders for the Dues Tracker
      const res = await axios.get(`http://localhost:5000/api/orders?status=Completed`, config);
      setOrders(res.data.filter(o => parseFloat(o.due_amount) > 0));
    } catch (err) {
      console.error('Fetch dues error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();

    socket.on('orderUpdate', fetchDues);
    socket.on('financeUpdate', fetchDues);

    return () => {
      socket.off('orderUpdate');
      socket.off('financeUpdate');
      socket.disconnect();
    };
  }, []);

  const fetchHistory = async (order) => {
    setHistoryOrder(order);
    try {
      setLoadingHistory(true);
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}/payments`, config);
      setPaymentHistory(res.data);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount)) return;
    
    setIsSubmitting(true);
    try {
      await axios.put(`http://localhost:5000/api/orders/${paymentModal.id}/payment`, 
        { amount: parseFloat(paymentAmount) },
        config
      );
      setPaymentModal(null);
      setPaymentAmount('');
      fetchDues();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone_number.includes(searchQuery) ||
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (dateFilter === 'All') return true;
    
    // Use completion date for dues tracking logic
    const refDate = order.completed_at ? new Date(order.completed_at) : new Date(order.created_at);
    const today = new Date();
    
    if (dateFilter === 'Today') {
      return refDate.toDateString() === today.toDateString();
    }
    if (dateFilter === '7Days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      return refDate >= sevenDaysAgo;
    }
    if (dateFilter === 'ThisMonth') {
      return refDate.getMonth() === today.getMonth() && refDate.getFullYear() === today.getFullYear();
    }
    
    return true;
  });

  const totalDues = filteredOrders.reduce((sum, o) => sum + parseFloat(o.due_amount), 0);

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic flex items-center gap-3">
             <CreditCard className="text-rose-500" size={36} /> Dues <span className="text-rose-500">Tracker.</span>
          </h1>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-[0.2em] text-[10px]">Strategic collection management & audit</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
                {['All', 'Today', '7Days', 'ThisMonth'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setDateFilter(f)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === f ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {f.replace('Days', ' Days').replace('Month', ' Month')}
                    </button>
                ))}
            </div>

            <div className="relative group flex-1 lg:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search ledger..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full lg:w-72 bg-white border border-slate-100 pl-12 pr-6 py-3.5 rounded-2xl text-xs font-bold text-slate-700 shadow-sm focus:ring-4 ring-rose-500/5 outline-none transition-all"
                />
            </div>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium flex items-center justify-between">
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
                  <p className="text-3xl font-black text-rose-500 italic">৳{totalDues.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                  <TrendingDown size={28} />
              </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium flex items-center justify-between">
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unpaid Clients</p>
                  <p className="text-3xl font-black text-slate-800 italic">{filteredOrders.length}</p>
              </div>
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                  <User size={28} />
              </div>
          </div>

          <div className="bg-rose-500 p-8 rounded-[2.5rem] shadow-premium flex items-center justify-between text-white">
              <div>
                  <p className="text-[10px] font-black text-rose-100 uppercase tracking-widest mb-1 italic">Collection Priority</p>
                  <p className="text-xl font-black italic">Urgent Action Required</p>
              </div>
              <AlertTriangle size={32} className="text-rose-200" />
          </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden">
        {loading ? (
             <div className="flex flex-col items-center justify-center p-32 gap-4">
                <Loader2 className="animate-spin text-rose-500" size={32} />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Scanning Ledger...</p>
            </div>
        ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-slate-300">
                <CheckCircle size={56} strokeWidth={1} className="mb-4 opacity-30 text-emerald-500" />
                <p className="text-xs font-black uppercase tracking-widest">Zero Dues Discovered</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                            <th className="py-6 px-10">Client / Record</th>
                            <th className="py-6 px-8">Contact</th>
                            <th className="py-6 px-8">Order Status</th>
                            <th className="py-6 px-8 text-right">Balance Due</th>
                            <th className="py-6 px-10 text-center">Collection</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="py-6 px-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.order_id}</span>
                                        <p className="font-black text-slate-800 text-lg tracking-tight italic group-hover:text-rose-600 transition-colors uppercase">{order.client_name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar size={12} className="text-slate-300" />
                                            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-6 px-8">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-black text-slate-600 flex items-center gap-2"><Phone size={14} className="text-slate-300" /> {order.phone_number}</p>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Direct Line Verified</span>
                                    </div>
                                </td>
                                <td className="py-6 px-8">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200/50">
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-6 px-8 text-right">
                                    <p className="text-2xl font-black text-rose-500 italic leading-none">৳{order.due_amount}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Of ৳{order.total_price} Total</p>
                                </td>
                                <td className="py-6 px-10">
                                    <div className="flex items-center justify-center gap-3">
                                        <button 
                                            onClick={() => setPaymentModal(order)}
                                            className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <CreditCard size={14} /> Receive
                                        </button>
                                        <button 
                                            onClick={() => fetchHistory(order)}
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                            title="View Payment History"
                                        >
                                            <History size={18} />
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

      {/* PAYMENT MODAL */}
      {paymentModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl relative animate-scale-up overflow-hidden">
                  <div className="bg-rose-500 p-10 text-white relative">
                      <button 
                        onClick={() => { setPaymentModal(null); setPaymentAmount(''); }}
                        className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-all"
                      >
                        <X size={24} />
                      </button>
                      <CreditCard size={48} className="mb-6 text-rose-200" strokeWidth={1.5} />
                      <h2 className="text-3xl font-black italic tracking-tighter leading-none">Collect Balance.</h2>
                      <p className="text-rose-100 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 opacity-80">Recording financial recovery</p>
                  </div>

                  <div className="p-10">
                      <div className="mb-8 flex justify-between items-end border-b border-slate-100 pb-8">
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                              <p className="text-xl font-black text-slate-800 italic uppercase">{paymentModal.client_name}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Remaining Due</p>
                              <p className="text-2xl font-black text-rose-500 italic">৳{paymentModal.due_amount}</p>
                          </div>
                      </div>

                      <form onSubmit={handlePaymentSubmit}>
                          <div className="mb-8">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Collecting Amount (৳)</label>
                              <div className="relative">
                                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">৳</span>
                                  <input
                                      type="number"
                                      autoFocus
                                      required
                                      min="1"
                                      max={paymentModal.due_amount}
                                      value={paymentAmount}
                                      onChange={e => setPaymentAmount(e.target.value)}
                                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-8 py-5 text-2xl font-black text-slate-800 outline-none focus:ring-4 ring-rose-500/10 transition-all font-mono"
                                      placeholder="0.00"
                                  />
                              </div>
                              <p className="mt-3 text-[10px] font-bold text-slate-400">Recording as 'Due Payment' in central ledger</p>
                          </div>

                          <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-rose-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                               {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Update Ledger</>}
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* HISTORY DRAWER (LEDGER) */}
      {historyOrder && (
          <div className="fixed inset-0 z-[1100] bg-slate-900/40 backdrop-blur-sm flex justify-end">
              <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-left overflow-hidden">
                  <div className="p-10 border-b border-slate-50 relative flex items-center gap-6">
                      <button 
                        onClick={() => setHistoryOrder(null)}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
                      >
                        <X size={24} />
                      </button>
                      <div>
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Historical Audit Trail</p>
                          <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">{historyOrder.client_name}</h2>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                      {loadingHistory ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                              <Loader2 className="animate-spin" size={32} />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanning Archives...</p>
                          </div>
                      ) : paymentHistory.length === 0 ? (
                          <div className="text-center py-20 opacity-30">
                              <History size={48} className="mx-auto mb-4" />
                              <p className="text-xs font-black uppercase tracking-widest">No transaction history found</p>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              {paymentHistory.map((log, idx) => (
                                  <div key={log.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-100 transition-all">
                                      {idx === 0 && <div className="absolute top-0 right-0 p-1.5 bg-rose-500 text-[8px] font-black text-white uppercase tracking-widest rounded-bl-xl">Latest Entry</div>}
                                      <div className="flex justify-between items-start mb-4">
                                          <div>
                                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                                  <Clock size={10} /> {new Date(log.payment_date).toLocaleString()}
                                              </p>
                                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{log.type}</p>
                                          </div>
                                          <p className="text-xl font-black text-emerald-500 italic">+৳{log.amount}</p>
                                      </div>
                                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                                          <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">"{log.note}"</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-10 border-t border-slate-100 bg-white">
                      <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl">
                          <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Balance Status</p>
                              <p className="text-lg font-black text-rose-500">৳{historyOrder.due_amount} STILL DUE</p>
                          </div>
                          <button 
                            onClick={() => { setHistoryOrder(null); setPaymentModal(historyOrder); }}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-500 transition-all shadow-lg shadow-slate-200"
                          >
                              Settle Now
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CSS For Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-left {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-left {
          animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default Dues;
