import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Plus, 
  Search, 
  ChevronRight, 
  Phone, 
  Briefcase, 
  MapPin,
  CreditCard,
  ShoppingCart,
  History,
  X
} from 'lucide-react';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTransModal, setShowTransModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        phone: '',
        address: ''
    });

    const [transData, setTransData] = useState({
        type: 'Purchase',
        amount: '',
        note: '',
        transaction_date: new Date().toISOString().split('T')[0]
    });

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/suppliers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
            setLoading(false);
        }
    };

    const handleAddSupplier = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/suppliers', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddModal(false);
            setFormData({ name: '', company: '', phone: '', address: '' });
            fetchSuppliers();
        } catch (err) {
            alert('Error adding supplier');
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/suppliers/transaction', {
                ...transData,
                supplier_id: selectedSupplier.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowTransModal(false);
            setTransData({ type: 'Purchase', amount: '', note: '', transaction_date: new Date().toISOString().split('T')[0] });
            fetchSuppliers();
        } catch (err) {
            alert('Error recording transaction');
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm)
    );

    if (loading) return <div className="p-10 text-center font-black text-slate-400 animate-pulse uppercase tracking-widest">Loading Suppliers...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight italic">Suppliers</h1>
                    <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                        Raw Material Procurement & Debt Management
                    </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Search suppliers..." 
                            className="input-field pl-10 w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition-colors" size={18} />
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary px-6 flex items-center gap-2 shadow-xl shadow-accent/20"
                    >
                        <Plus size={18} /> New Supplier
                    </button>
                </div>
            </div>

            {/* Supplier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-300 italic font-medium">No suppliers found.</div>
                ) : filteredSuppliers.map(supplier => (
                    <div key={supplier.id} className="card bg-white p-6 border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        {/* Status Glow */}
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-10 ${Number(supplier.balance) > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-6 relative">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                                <Truck size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                                <h4 className={`text-xl font-black italic ${Number(supplier.balance) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    ৳{Number(supplier.balance).toLocaleString()}
                                </h4>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{supplier.name}</h3>
                                <p className="text-xs text-accent font-bold flex items-center gap-1.5 mt-0.5">
                                    <Briefcase size={12} /> {supplier.company || 'Private Lender'}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                                    <Phone size={12} className="text-slate-300" /> {supplier.phone || 'N/A'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 truncate">
                                    <MapPin size={12} className="text-slate-300" /> {supplier.address || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 relative">
                            <button 
                                onClick={() => { setSelectedSupplier(supplier); setTransData({...transData, type: 'Purchase'}); setShowTransModal(true); }}
                                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={12} /> Add Purchase
                            </button>
                            <button 
                                onClick={() => { setSelectedSupplier(supplier); setTransData({...transData, type: 'Payment'}); setShowTransModal(true); }}
                                className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                            >
                                <CreditCard size={12} /> Record Payment
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Supplier Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tight">New Supplier</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Onboard a new raw material provider</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white transition-all text-slate-400 hover:text-rose-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSupplier} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lender Name</label>
                                    <input 
                                        className="input-field" 
                                        required 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Company/Shop Name</label>
                                    <input 
                                        className="input-field" 
                                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone Number</label>
                                <input 
                                    className="input-field" 
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Address</label>
                                <textarea 
                                    className="input-field h-24 py-3" 
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="btn-primary w-full py-4 shadow-xl shadow-accent/20">Add Supplier Profile</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            {showTransModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tight">{transData.type} Entry</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recording for {selectedSupplier?.name}</p>
                            </div>
                            <button onClick={() => setShowTransModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white transition-all text-slate-400 hover:text-rose-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleTransaction} className="p-8 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount (৳)</label>
                                <input 
                                    type="number" 
                                    className="input-field text-xl font-black text-accent" 
                                    required 
                                    onChange={(e) => setTransData({...transData, amount: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</label>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    required 
                                    value={transData.transaction_date}
                                    onChange={(e) => setTransData({...transData, transaction_date: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Note/Remarks</label>
                                <input 
                                    className="input-field" 
                                    placeholder="e.g. Bought 10 rims of Offset paper"
                                    onChange={(e) => setTransData({...transData, note: e.target.value})}
                                />
                            </div>
                            <button type="submit" className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl transition-all ${transData.type === 'Purchase' ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'}`}>
                                Confirm {transData.type}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
