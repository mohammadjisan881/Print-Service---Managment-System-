import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Search, Loader2, Package, CheckCircle, Clock, Truck, 
  RefreshCcw, XCircle, ChevronDown, ChevronUp, FileText, 
  User, MapPin, Building, Phone, Calendar, Plus, X, 
  ArrowRight, Banknote, Scissors, Printer, Box, Check,
  AlertTriangle, TrendingUp
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const STATUS_SEQUENCE = ['Pending', 'Confirmed', 'Designing', 'Printing', 'Delivered', 'Completed'];

const getStatusBadge = (status) => {
  const base = "px-3 py-1 font-black rounded-full text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 ";
  switch (status) {
    case 'Pending': return base + 'bg-orange-50 text-orange-600 border border-orange-200/50';
    case 'Confirmed': return base + 'bg-blue-50 text-blue-600 border border-blue-200/50';
    case 'Designing': return base + 'bg-purple-50 text-purple-600 border border-purple-200/50';
    case 'Printing': return base + 'bg-indigo-50 text-indigo-600 border border-indigo-200/50';
    case 'Delivered': return base + 'bg-emerald-50 text-emerald-600 border border-emerald-200/50';
    case 'Completed': return base + 'bg-teal-50 text-teal-600 border border-teal-200/50';
    case 'Cancelled': return base + 'bg-red-50 text-red-600 border border-red-200/50';
    case 'Returned': return base + 'bg-yellow-50 text-yellow-600 border border-yellow-200/50';
    default: return base + 'bg-slate-100 text-slate-600';
  }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  // Advanced Workflow Modals
  const [statusPrompt, setStatusPrompt] = useState(null);
  const [designModalData, setDesignModalData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders?status=${filter}&search=${searchQuery}`, config);
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch orders error:', err);
      if (err.response?.status === 401) navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery, navigate, token]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('orderUpdate', fetchOrders);
    return () => socket.disconnect();
  }, [fetchOrders]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => fetchOrders(), 400);
    return () => clearTimeout(delayDebounceFn);
  }, [filter, searchQuery]);

  const handleNextStep = async (order, overrideStatus = null) => {
    const currentIndex = STATUS_SEQUENCE.indexOf(order.status);
    const nextStatus = overrideStatus || STATUS_SEQUENCE[currentIndex + 1];

    if (!nextStatus) return;

    // SKIP PROMPT if printing_cost is already set (e.g. re-delivering)
    if (nextStatus === 'Delivered' && order.printing_cost > 0) {
        try {
            await axios.put(`http://localhost:5000/api/orders/${order.id}/status`, { status: 'Delivered' }, config);
            fetchOrders();
            return;
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to skip cost prompt');
            return;
        }
    }
    
    // Transition Logics
    if (['Confirmed', 'Designing', 'Printing'].includes(nextStatus)) {
        setStatusPrompt({
            type: 'advance',
            order,
            nextStatus,
            title: `Move to ${nextStatus}`,
            question: order.advance_paid > 0 ? 'Would you like to add more advance?' : 'Has the customer paid an advance?',
            amount: ''
        });
    } else if (nextStatus === 'Delivered') {
        setStatusPrompt({
            type: 'cost',
            order,
            nextStatus,
            title: 'Prepare for Delivery',
            question: 'Verify the Factory/Production Cost:',
            amount: (order.printing_cost || 0).toString()
        });
    } else if (nextStatus === 'Completed') {
        setStatusPrompt({
            type: 'complete',
            order,
            nextStatus,
            title: 'Finalize Order (অর্ডার সম্পন্ন করুন)',
            question: 'Any extra expenses for this order? (অতিরিক্ত খরচ আছে?)',
            amount: '0'
        });
    } else if (nextStatus === 'Returned') {
        setStatusPrompt({
            type: 'return',
            order,
            nextStatus: 'Returned',
            title: 'Return Order (অর্ডার ফেরত নিন)',
            question: 'Confirm Return? Enter refund amount if giving money back:',
            amount: '0'
        });
    }
  };

  const submitStatusChange = async (e) => {
    e.preventDefault();
    if (!statusPrompt || isSubmitting) return;
    setIsSubmitting(true);

    try {
        const { order, nextStatus, type, amount } = statusPrompt;
        const payload = { status: nextStatus };

        if (type === 'advance') {
            payload.advance_paid = (parseFloat(order.advance_paid) || 0) + (parseFloat(amount) || 0);
        } else if (type === 'cost') {
            payload.printing_cost = parseFloat(amount) || parseFloat(order.printing_cost) || 0;
            // NEW: Allow recording payment during delivery
            if (statusPrompt.payment) {
                payload.advance_paid = (parseFloat(order.advance_paid) || 0) + (parseFloat(statusPrompt.payment) || 0);
            }
        } else if (type === 'complete') {
            payload.extra_expenses = parseFloat(amount) || 0;
            // NEW: Allow recording final payment during completion
            if (statusPrompt.payment) {
                payload.advance_paid = (parseFloat(order.advance_paid) || 0) + (parseFloat(statusPrompt.payment) || 0);
            }
        } else if (type === 'return') {
            payload.refund_amount = parseFloat(amount) || 0;
        }

        await axios.put(`http://localhost:5000/api/orders/${order.id}/status`, payload, config);
        setStatusPrompt(null);
        fetchOrders();
    } catch (err) {
        alert(err.response?.data?.error || 'Failed to update order status');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCancel = async (order) => {
      if (window.confirm('Are you sure you want to cancel this order?')) {
          try {
              await axios.put(`http://localhost:5000/api/orders/${order.id}/status`, { status: 'Cancelled' }, config);
              fetchOrders();
          } catch (err) { alert('Failed to cancel order'); }
      }
  };

  const getActionInfo = (status) => {
      switch(status) {
          case 'Pending': return { label: 'Confirm Order', icon: CheckCircle, color: 'bg-blue-600' };
          case 'Confirmed': return { label: 'Start Design', icon: Scissors, color: 'bg-purple-600' };
          case 'Designing': return { label: 'Ready for Print', icon: Printer, color: 'bg-indigo-600' };
          case 'Printing': return { label: 'Ready for Delivery', icon: Truck, color: 'bg-emerald-600' };
          case 'Delivered': return { label: 'Mark Completed', icon: Check, color: 'bg-teal-600' };
          default: return null;
      }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic">Order Manager.</h1>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Step-by-step Workflow Tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search Client, Phone, ID..." 
              className="bg-white border border-slate-100 px-10 py-2.5 rounded-xl text-xs font-bold w-64 shadow-sm focus:ring-2 ring-accent/10 outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => navigate('/admin/orders/new')} className="bg-accent text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-105 transition-all active:scale-95">
            New Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-premium overflow-hidden mb-10">
        <div className="flex overflow-x-auto border-b border-slate-50 px-6 py-2 gap-2 hide-scrollbar">
          {STATUS_SEQUENCE.filter(s => s !== 'Completed').concat(['Returned']).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl ${filter === s ? 'bg-accent text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 gap-4">
            <Loader2 className="animate-spin text-accent" size={32} />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-slate-300 bg-slate-50/30">
            <Package size={56} strokeWidth={1} className="mb-4 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-widest italic">No orders in {filter} queue</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="py-5 px-8">Order Target</th>
                  <th className="py-5 px-8">Progress Status</th>
                  <th className="py-5 px-8 text-right">Financials</th>
                  <th className="py-5 px-8 text-center">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => {
                  const action = getActionInfo(order.status);
                  const isExpanded = expandedId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr className={`group transition-all hover:bg-slate-50/50 ${isExpanded ? 'bg-slate-50' : ''}`}>
                        <td className="py-6 px-8">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">{order.order_id}</span>
                            <div className="font-black text-slate-800 text-lg tracking-tight flex items-center gap-2">
                                {order.client_name}
                                {order.is_wholesale === 1 && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-amber-200">B2B</span>}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 italic">{order.company_name || order.phone_number}</span>
                            
                            {(order.design_instructions || order.design_file) && (
                              <button 
                                onClick={() => setDesignModalData(order)}
                                className="mt-3 text-[9px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 w-fit hover:bg-purple-100 transition-colors"
                              >
                                View Design
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <div className={getStatusBadge(order.status)}>
                            <Clock size={10} /> {order.status}
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 text-slate-400">
                             <Calendar size={12} />
                             <span className="text-[9px] font-bold">Due: {new Date(order.delivery_date || order.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="text-xl font-black text-slate-800 italic">৳{order.total_price.toLocaleString()}</div>
                          <div className={`text-[10px] font-black mt-1 ${order.due_amount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                             {order.due_amount > 0 ? `Unpaid: ৳${order.due_amount.toLocaleString()}` : 'Fully Paid'}
                          </div>
                          {order.printing_cost > 0 && <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Cost: ৳{order.printing_cost}</div>}
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex flex-col items-center gap-2">
                            {action ? (
                                <button 
                                    onClick={() => handleNextStep(order)}
                                    className={`w-full max-w-[160px] py-3 rounded-2xl ${action.color} text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-current/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2`}
                                >
                                    <action.icon size={14} />
                                    {action.label}
                                </button>
                            ) : order.status === 'Returned' ? (
                                <div className="flex flex-col gap-2 w-full max-w-[180px]">
                                    <button 
                                        onClick={() => handleNextStep({...order, status: 'Printing'}, 'Delivered')}
                                        className="bg-emerald-600 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-emerald-700 transition-all"
                                    >
                                        <Truck size={12} /> Re-Deliver
                                    </button>
                                    <button 
                                        onClick={() => handleNextStep({...order, status: 'Delivered'}, 'Completed')}
                                        className="bg-teal-600 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-teal-700 transition-all"
                                    >
                                        <Check size={12} /> Finish Order
                                    </button>
                                </div>
                            ) : order.status === 'Completed' ? (
                                <div className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle size={14} /> Finalized
                                </div>
                            ) : null}
                            
                            <div className="flex gap-2 mt-1">
                                <button 
                                    onClick={() => toggleExpand(order.id)}
                                    className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
                                >
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                                    <button 
                                        onClick={() => handleCancel(order)}
                                        className="p-2.5 rounded-xl bg-red-50 text-red-300 hover:bg-red-500 hover:text-white transition-all"
                                        title="Cancel Order"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                )}
                                {order.status === 'Delivered' && (
                                    <button 
                                        onClick={() => handleNextStep({...order, status: 'Delivered'}, 'Returned')}
                                        className="p-2.5 rounded-xl bg-yellow-50 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all"
                                        title="Return Order"
                                    >
                                        <RefreshCcw size={16} />
                                    </button>
                                )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-white">
                           <td colSpan="4" className="px-12 py-10">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
                                 <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                                       <Package size={14} /> Ordered Items
                                    </h4>
                                    <div className="space-y-4">
                                       {order.items?.map(it => (
                                          <div key={it.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-accent/30 transition-all">
                                             <div>
                                                <p className="font-black text-slate-800 text-sm italic">{it.service_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                   {it.unit_type === 'Square Feet' ? `${it.print_width} × ${it.print_height} SQFT` : `${it.quantity} ${it.unit_type}`}
                                                </p>
                                             </div>
                                             <span className="font-black text-indigo-600 italic">৳{it.total_price}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                                 <div className="bg-slate-50/50 p-6 rounded-3xl border border-dashed border-slate-200">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                       <Clock size={14} /> Production Log
                                    </h4>
                                    <div className="space-y-4">
                                       <div className="flex items-center gap-4">
                                          <div className={`w-3 h-3 rounded-full ${order.advance_paid > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                          <p className="text-xs font-bold text-slate-600">Advance: ৳{order.advance_paid}</p>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <div className={`w-3 h-3 rounded-full ${order.printing_cost > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                          <p className="text-xs font-bold text-slate-600">Printing Cost: ৳{order.printing_cost}</p>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <div className={`w-3 h-3 rounded-full ${order.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                          <p className="text-xs font-bold text-slate-600">Final Profit: ৳{order.net_profit || 0}</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WORKFLOW PROMPT MODAL */}
      {statusPrompt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
             <div className="bg-slate-50 p-8 flex items-center gap-4">
                <div className="p-4 bg-indigo-500 text-white rounded-2xl">
                    <TrendingUp size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 tracking-tight italic">{statusPrompt.title}</h3>
                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{statusPrompt.nextStatus} Pipeline</p>
                </div>
             </div>

             <form onSubmit={submitStatusChange} className="p-8 space-y-6">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{statusPrompt.question}</label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl italic">৳</span>
                            <input 
                                autoFocus
                                required
                                type="number" 
                                value={statusPrompt.amount}
                                onChange={e => setStatusPrompt({...statusPrompt, amount: e.target.value})}
                                placeholder="Enter Amount"
                                className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-6 pl-12 pr-6 text-2xl font-black text-slate-800 italic outline-none focus:ring-4 ring-indigo-500/10 transition-all placeholder:text-slate-200"
                            />
                        </div>
                    </div>

                    {/* Optional Payment Field for Cost/Complete stages */}
                    {(statusPrompt.type === 'cost' || statusPrompt.type === 'complete') && (
                        <div className="pt-6 border-t border-slate-50">
                            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 italic">
                                {statusPrompt.type === 'complete' ? "Final Payment Received? (আজকে কতো টাকা পেলেন?)" : "Cash Received Now? (এখন কোনো পেমেন্ট পেয়েছেন?)"} 
                            </label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl italic">৳</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={statusPrompt.payment || ''}
                                    onChange={(e) => setStatusPrompt({ ...statusPrompt, payment: e.target.value })}
                                    className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl pl-12 pr-6 py-4 text-xl font-black text-slate-800 outline-none focus:ring-4 ring-emerald-500/10 transition-all"
                                />
                            </div>
                            <p className="mt-3 text-[10px] font-bold text-slate-400 flex justify-between">
                                <span>Collection will be logged as 'Advance'</span>
                                <span>Balance: ৳{statusPrompt.order.due_amount}</span>
                            </p>
                        </div>
                    )}
                </div>

                {isSubmitting ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-accent" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button 
                            type="button"
                            onClick={() => setStatusPrompt(null)}
                            className="bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Back Down
                        </button>
                        <button 
                            type="submit"
                            className="bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Next Action <ArrowRight size={14} className="inline ml-1" />
                        </button>
                    </div>
                )}
             </form>
          </div>
        </div>
      )}

      {/* DESIGN INFO MODAL (Simplified) */}
      {designModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl animate-scale-up overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-purple-50">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg">
                          <FileText size={24} />
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight italic">Blueprint & Assets.</h3>
                          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{designModalData.order_id}</p>
                      </div>
                  </div>
                  <button onClick={() => setDesignModalData(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                      <X size={20} />
                  </button>
              </div>
              
              <div className="p-10 overflow-y-auto space-y-10">
                  {designModalData.design_file && (
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source Attachment</label>
                          <div className="relative group rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner">
                              <img src={designModalData.design_file} alt="Design" className="w-full h-auto object-cover" />
                              <a href={designModalData.design_file} download target="_blank" rel="noreferrer" className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <button className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                      <Clock size={16} /> Original Resolution
                                  </button>
                              </a>
                          </div>
                      </div>
                  )}

                  {designModalData.design_instructions && (
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Technical Instructions</label>
                          <div className="bg-slate-50 p-8 rounded-3xl text-sm font-bold text-slate-700 leading-relaxed italic border border-slate-100 shadow-inner whitespace-pre-wrap">
                              "{designModalData.design_instructions}"
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
