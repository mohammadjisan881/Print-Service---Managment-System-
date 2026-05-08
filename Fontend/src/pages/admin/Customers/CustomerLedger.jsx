import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Contact, 
  Phone, 
  Briefcase, 
  ShoppingCart, 
  CreditCard, 
  Calendar,
  ChevronLeft,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';

const CustomerLedger = () => {
    const { phone } = useParams();
    const [ledger, setLedger] = useState({ orders: [], payments: [] });
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchLedger();
    }, [phone]);

    const fetchLedger = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/customers/ledger/${phone}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLedger(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching ledger:', err);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-black text-slate-400 animate-pulse uppercase tracking-widest">Generating Statement...</div>;

    const totalSpent = ledger.orders.reduce((acc, o) => acc + Number(o.total_price), 0);
    const totalPaid = ledger.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const currentBalance = totalSpent - totalPaid;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header & Back Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.history.back()}
                        className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-accent hover:border-accent transition-all shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Customer Statement</h1>
                        <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Full Transaction History for {phone}
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer Profile Banner */}
            <div className="card bg-slate-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[120px] rounded-full"></div>
                
                <div className="flex items-center gap-6 relative">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] flex items-center justify-center text-4xl font-black text-accent">
                        {(ledger.orders[0]?.client_name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black italic tracking-tight mb-1">{ledger.orders[0]?.client_name || 'Valued Customer'}</h2>
                        <div className="flex flex-wrap gap-4">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><Phone size={14} className="text-accent" /> {phone}</span>
                            {ledger.orders[0]?.company_name && <span className="text-xs font-bold text-slate-400 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><Briefcase size={14} className="text-accent" /> {ledger.orders[0].company_name}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 relative">
                    <div className="text-center bg-white/5 backdrop-blur-md px-8 py-4 rounded-[28px] border border-white/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Value</p>
                        <h4 className="text-2xl font-black italic">৳{totalSpent.toLocaleString()}</h4>
                    </div>
                    <div className={`text-center px-8 py-4 rounded-[28px] border ${currentBalance > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Balance Due</p>
                        <h4 className="text-2xl font-black italic">৳{currentBalance.toLocaleString()}</h4>
                    </div>
                </div>
            </div>

            {/* Split View: Orders vs Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Orders History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 italic">
                            <ShoppingCart className="text-accent" size={20} /> Order History
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{ledger.orders.length} Records</span>
                    </div>
                    <div className="space-y-4">
                        {ledger.orders.map(order => (
                            <div key={order.id} className="card bg-white p-6 border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                        <ArrowUpRight size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">#{order.order_id}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                                            <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-800 italic">৳{Number(order.total_price).toLocaleString()}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${order.status === 'Completed' ? 'text-emerald-500' : 'text-orange-500'}`}>{order.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 italic">
                            <CreditCard className="text-emerald-500" size={20} /> Payment History
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">{ledger.payments.length} Payments</span>
                    </div>
                    <div className="space-y-4">
                        {ledger.payments.map(payment => (
                            <div key={payment.id} className="card bg-white p-6 border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                                        <ArrowDownLeft size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">৳{Number(payment.amount).toLocaleString()}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1 uppercase italic">
                                            Ref: {payment.order_code} • {payment.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1.5 mb-1">
                                        <Calendar size={12} /> {new Date(payment.payment_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg inline-block">Payment Received</p>
                                </div>
                            </div>
                        ))}
                        {ledger.payments.length === 0 && (
                            <div className="py-20 text-center text-slate-300 italic font-medium">No payment records found for this customer.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerLedger;
