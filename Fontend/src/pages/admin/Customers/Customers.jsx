import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Contact, 
  Search, 
  ChevronRight, 
  Phone, 
  Briefcase, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  History
} from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/customers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c => 
        (c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone_number?.includes(searchTerm)) ||
        (c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-10 text-center font-black text-slate-400 animate-pulse uppercase tracking-widest">Loading Customer Ledgers...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight italic">Customer Ledger</h1>
                    <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                        Client Relationship & Financial History
                    </p>
                </div>
                
                <div className="relative w-full md:w-96 group">
                    <input 
                        type="text" 
                        placeholder="Search by name, phone or company..." 
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition-colors" size={18} />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-white p-6 flex items-center gap-4 border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                        <Contact size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Clients</p>
                        <h3 className="text-2xl font-black text-slate-800 italic">{customers.length}</h3>
                    </div>
                </div>
                <div className="card bg-white p-6 flex items-center gap-4 border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Business</p>
                        <h3 className="text-2xl font-black text-slate-800 italic">৳{customers.reduce((acc, c) => acc + Number(c.total_spent), 0).toLocaleString()}</h3>
                    </div>
                </div>
                <div className="card bg-white p-6 flex items-center gap-4 border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Outstanding</p>
                        <h3 className="text-2xl font-black text-slate-800 italic">৳{customers.reduce((acc, c) => acc + Number(c.current_dues), 0).toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Customer List */}
            <div className="card bg-white border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                                <th className="px-8 py-4">Client Information</th>
                                <th className="px-6 py-4">Orders</th>
                                <th className="px-6 py-4">Total Spent</th>
                                <th className="px-6 py-4">Current Dues</th>
                                <th className="px-6 py-4">Last Activity</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold divide-y divide-slate-50">
                            {filteredCustomers.length === 0 ? (
                                <tr><td colSpan="6" className="py-20 text-center text-slate-300 italic font-medium">No customers found matching your search.</td></tr>
                            ) : filteredCustomers.map((customer, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black">
                                                {customer.client_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-black uppercase tracking-tight">{customer.client_name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] text-slate-400 flex items-center gap-1"><Phone size={10} /> {customer.phone_number}</span>
                                                    {customer.company_name && <span className="text-[9px] text-accent flex items-center gap-1 font-black"><Briefcase size={10} /> {customer.company_name}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black">{customer.total_orders} Orders</span>
                                    </td>
                                    <td className="px-6 py-5 text-slate-700">৳{Number(customer.total_spent).toLocaleString()}</td>
                                    <td className="px-6 py-5">
                                        <span className={`font-black ${Number(customer.current_dues) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            ৳{Number(customer.current_dues).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-slate-400 font-medium">
                                        {new Date(customer.last_order_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => window.location.href = `/admin/customers/ledger/${customer.phone_number}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-lg shadow-slate-200"
                                        >
                                            <History size={12} /> View Ledger
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Customers;
