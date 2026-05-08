import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Briefcase, 
  Plus, 
  History, 
  CreditCard, 
  ArrowUpRight, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Banknote,
  ChevronRight,
  Clock
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area
} from 'recharts';

const Loans = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRepayModal, setShowRepayModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [history, setHistory] = useState([]);
    const [loanStats, setLoanStats] = useState([]);
    
    const [formData, setFormData] = useState({
        source: '',
        amount: '',
        interest_rate: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        note: '',
        phone: ''
    });

    const [repayData, setRepayData] = useState({
        amount_paid: '',
        payment_date: new Date().toISOString().split('T')[0],
        note: ''
    });

    const token = localStorage.getItem('adminToken');

    const fetchLoans = async () => {
        try {
            const [loansRes, statsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/loans', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/loans/stats', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setLoans(loansRes.data);
            setLoanStats(statsRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching loans:', err);
            setLoading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchHistory = async (id) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/loans/history/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const filteredLoans = loans.filter(l => {
        const matchesSearch = l.source.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleAddLoan = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/loans', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddModal(false);
            setFormData({ source: '', amount: '', interest_rate: '', start_date: new Date().toISOString().split('T')[0], due_date: '', note: '', phone: '' });
            fetchLoans();
        } catch (err) {
            alert('Error adding loan');
        }
    };

    const handleRepay = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/loans/repay', {
                ...repayData,
                loan_id: selectedLoan.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowRepayModal(false);
            setRepayData({ amount_paid: '', payment_date: new Date().toISOString().split('T')[0], note: '' });
            fetchLoans();
        } catch (err) {
            alert('Error recording repayment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this loan?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/loans/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLoans();
        } catch (err) {
            alert('Error deleting loan');
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-400">Loading Enterprise Data...</div>;

    const totalLoanAmount = loans.reduce((acc, l) => acc + Number(l.amount), 0);
    const totalPaid = loans.reduce((acc, l) => acc + (Number(l.total_paid) || 0), 0);
    const totalRemaining = totalLoanAmount - totalPaid;

    // Feature 1: Alert Logic
    const getAlerts = () => {
        const today = new Date();
        return loans.filter(l => {
            if (l.status !== 'Active' || !l.due_date) return false;
            const dueDate = new Date(l.due_date);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7; // Within 7 days
        });
    };
    const alerts = getAlerts();

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight italic">Loan Management</h1>
                    <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                        Capital Liability Tracking
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 px-6 py-3 shadow-xl shadow-accent/20"
                >
                    <Plus size={18} /> New Loan Entry
                </button>
            </div>

            {/* Feature 1: Alerts Summary Banner */}
            {alerts.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-3xl flex items-center gap-4 animate-fade-in">
                    <div className="w-10 h-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-rose-200">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-rose-600 uppercase tracking-wider italic">Upcoming Deadlines</h4>
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">You have {alerts.length} loan{alerts.length > 1 ? 's' : ''} requiring payment attention this week.</p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-slate-900 text-white border-none p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Loan Principal</p>
                        <h2 className="text-3xl font-black italic">৳{totalLoanAmount.toLocaleString()}</h2>
                    </div>
                    <Briefcase className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                </div>
                <div className="card bg-white border-slate-100 p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 text-green-500">Total Repaid</p>
                    <h2 className="text-3xl font-black italic text-slate-800">৳{totalPaid.toLocaleString()}</h2>
                </div>
                <div className="card bg-white border-slate-100 p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 text-red-500">Net Outstanding</p>
                    <h2 className="text-3xl font-black italic text-slate-800">৳{totalRemaining.toLocaleString()}</h2>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <input 
                        type="text" 
                        placeholder="Search by lender/source..." 
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition-colors" size={18} />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
                    {['All', 'Active', 'Completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-white text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loans Table */}
            <div className="card bg-white border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                                <th className="px-6 py-4">Source/Lender</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold divide-y divide-slate-50">
                            {filteredLoans.length === 0 ? (
                                <tr><td colSpan="6" className="py-10 text-center text-slate-300 italic">No matching loans found.</td></tr>
                            ) : filteredLoans.map(loan => {
                                const remaining = Number(loan.amount) - (Number(loan.total_paid) || 0);
                                return (
                                    <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-black uppercase">{loan.source}</span>
                                                <span className="text-[9px] text-slate-400 mt-0.5">{loan.note || 'No description'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">৳{Number(loan.amount).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-red-500 font-black">৳{remaining.toLocaleString()}</span>
                                                {loan.interest_rate > 0 && loan.status === 'Active' && (() => {
                                                    // Normalize dates to midnight to get exact days
                                                    const start = new Date(loan.start_date);
                                                    start.setHours(0,0,0,0);
                                                    const today = new Date();
                                                    today.setHours(0,0,0,0);
                                                    
                                                    const diffTime = today - start;
                                                    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                                                    
                                                    // Use Reducing Balance logic: Interest on current remaining amount
                                                    // Formula: (Principal * Rate * Days) / (365 * 100)
                                                    const estInterest = (remaining * (Number(loan.interest_rate) / 100) * (diffDays / 365));
                                                    
                                                    return (
                                                        <div className="group relative">
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase italic cursor-help border-b border-dotted border-slate-300">
                                                                + ৳{Math.round(estInterest).toLocaleString()} Est. Interest
                                                            </span>
                                                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[8px] p-2 rounded shadow-xl z-50 w-32 font-medium">
                                                                Calculated for {diffDays} days on remaining balance ৳{remaining.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                                <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-green-500" 
                                                        style={{ width: `${(Number(loan.total_paid) / Number(loan.amount)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase w-fit ${loan.status === 'Active' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                                                    {loan.status}
                                                </span>
                                                {loan.status === 'Active' && loan.due_date && (() => {
                                                    const today = new Date();
                                                    const dueDate = new Date(loan.due_date);
                                                    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                                    if (diffDays < 0) return <span className="text-[8px] font-black text-rose-500 uppercase flex items-center gap-1"><AlertCircle size={10} /> Overdue</span>;
                                                    if (diffDays <= 7) return <span className="text-[8px] font-black text-orange-400 uppercase flex items-center gap-1"><Clock size={10} /> Near Due</span>;
                                                    return null;
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => { setSelectedLoan(loan); fetchHistory(loan.id); setShowHistoryModal(true); }}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-accent transition-colors"
                                                    title="History"
                                                >
                                                    <History size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedLoan(loan); setShowRepayModal(true); }}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-green-500 transition-colors"
                                                    title="Repay"
                                                    disabled={loan.status === 'Completed'}
                                                >
                                                    <CreditCard size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(loan.id)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Feature 5: Monthly Repayment Trend Chart */}
            <div className="card bg-white border-slate-100 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 italic">Repayment Trends</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Cash Outflow for Debt Servicing</p>
                    </div>
                </div>
                <div className="h-[250px] w-full">
                    {loanStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={loanStats}>
                                <defs>
                                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 800, fontSize: '11px' }}
                                />
                                <Area type="monotone" dataKey="total_repaid" name="Total Repaid" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPaid)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-300 italic text-[10px] uppercase font-black">No Payment Trends Available</div>
                    )}
                </div>
            </div>

            {/* Add Loan Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-scale-up">
                        <h2 className="text-2xl font-black text-slate-800 italic mb-6">Create New Loan</h2>
                        <form onSubmit={handleAddLoan} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lender Source</label>
                                    <input 
                                        className="input-field" 
                                        placeholder="e.g. Bank Asia" 
                                        required
                                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lender Phone (WhatsApp)</label>
                                    <input 
                                        className="input-field" 
                                        placeholder="017XXXXXXXX" 
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Principal Amount</label>
                                    <input 
                                        type="number"
                                        className="input-field" 
                                        placeholder="৳ 0.00" 
                                        required
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Start Date</label>
                                    <input 
                                        type="date"
                                        className="input-field" 
                                        value={formData.start_date}
                                        required
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Due Date</label>
                                    <input 
                                        type="date"
                                        className="input-field" 
                                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Interest Rate (%)</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    className="input-field" 
                                    placeholder="0.00"
                                    onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notes</label>
                                <textarea 
                                    className="input-field h-24" 
                                    placeholder="Optional details..."
                                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary py-3">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary py-3">Confirm Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Repayment Modal */}
            {showRepayModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-up">
                        <h2 className="text-2xl font-black text-slate-800 italic mb-2">Record Payment</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Lender: {selectedLoan?.source}</p>
                        <form onSubmit={handleRepay} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount to Pay</label>
                                <input 
                                    type="number"
                                    className="input-field" 
                                    placeholder="৳ 0.00" 
                                    required
                                    onChange={(e) => setRepayData({...repayData, amount_paid: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Date</label>
                                <input 
                                    type="date"
                                    className="input-field" 
                                    value={repayData.payment_date}
                                    required
                                    onChange={(e) => setRepayData({...repayData, payment_date: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Note</label>
                                <input 
                                    className="input-field" 
                                    placeholder="Reference or note..."
                                    onChange={(e) => setRepayData({...repayData, note: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowRepayModal(false)} className="flex-1 btn-secondary py-3">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary py-3">Confirm Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-scale-up max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 italic">Payment History</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLoan?.source}</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-800">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center py-10 text-slate-300 italic font-medium">No repayments recorded yet.</div>
                            ) : history.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-black text-slate-800">৳{Number(item.amount_paid).toLocaleString()}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.payment_date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">{item.note || 'Regular Installment'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Loans;
