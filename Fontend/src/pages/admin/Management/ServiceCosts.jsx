import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Save, RefreshCw, AlertCircle, Plus, Trash2, Edit2, X } from 'lucide-react';

const ServiceCosts = () => {
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', amount: '', unit: 'Piece' });
    const [editingId, setEditingId] = useState(null);
    
    const API = 'http://localhost:5000/api/cost-presets';
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchPresets();
    }, []);

    const fetchPresets = async () => {
        try {
            const res = await axios.get(API, { headers: { Authorization: `Bearer ${token}` } });
            setPresets(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API}/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(API, formData, { headers: { Authorization: `Bearer ${token}` } });
            }
            setIsModalOpen(false);
            setFormData({ name: '', amount: '', unit: 'Piece' });
            setEditingId(null);
            fetchPresets();
        } catch (err) {
            alert("Error saving preset. (একই নামের খরচ আগে থেকে থাকতে পারে)");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this cost preset?")) return;
        try {
            await axios.delete(`${API}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchPresets();
        } catch (err) {
            alert("Error deleting preset");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <RefreshCw className="animate-spin text-slate-400" size={48} />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Order <span className="text-indigo-600">Expenses.</span></h1>
                    <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs flex items-center gap-2">
                        <CreditCard size={14} className="text-indigo-400" /> Independent Factory Costs Management
                    </p>
                </div>
                <button 
                    onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ name: '', amount: '', unit: 'Piece' }); }}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={18} /> New Expense Preset
                </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2.5rem] mb-10 flex items-start gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="font-black text-amber-800 uppercase tracking-wider text-sm">SuperAdmin - Cost Snapshotting Logic</h3>
                    <p className="text-amber-700/80 text-sm font-medium mt-1 leading-relaxed">
                        ১. এখানে খরচ যুক্ত করার সময় নামগুলো যেন আপনার **Service Name** এর সাথে হুবহু মিল থাকে। <br/>
                        ২. যখনই কোনো নতুন অর্ডার হবে, সিস্টেম এখান থেকে **বর্তমান খরচটি (Snapshot)** নিয়ে সেই অর্ডারের হিসাবে যোগ করবে। <br/>
                        ৩. ভবিষ্যতে খরচ কমলে বা বাড়লে এখান থেকে আপডেট করবেন, কিন্তু **পূর্বের হয়ে যাওয়া অর্ডারগুলোর হিসাবে কোনো পরিবর্তন আসবে না।**
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expense Template Name</th>
                            <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unit Type</th>
                            <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50/30 text-center">Factory Unit Cost (BDT)</th>
                            <th className="p-8 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {presets.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                        <CreditCard size={64} strokeWidth={1} />
                                        <p className="font-black uppercase tracking-widest text-sm italic">No cost presets defined yet.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : presets.map(preset => (
                            <tr key={preset.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="p-8">
                                    <p className="font-black text-slate-800 text-lg">{preset.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Linked to Printing/Service</p>
                                </td>
                                <td className="p-8">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-200">
                                        Per {preset.unit}
                                    </span>
                                </td>
                                <td className="p-8 bg-indigo-50/10 text-center">
                                    <p className="text-2xl font-black text-indigo-600 italic">৳{preset.amount}</p>
                                </td>
                                <td className="p-8 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => {
                                                setEditingId(preset.id);
                                                setFormData(preset);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(preset.id)}
                                            className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
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

            {/* CRUD Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden border border-slate-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
                        <div className="relative">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">
                                    {editingId ? 'Update' : 'Add New'} <span className="text-indigo-600">Preset.</span>
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Service Match Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-3xl font-black text-slate-800 focus:border-indigo-400 outline-none transition-all"
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Visiting Card Set"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1 italic">* এটি ক্যাটালগের নামের সাথে মিল থাকতে হবে।</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Unit Cost (৳)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required
                                            className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-3xl font-black text-slate-800 focus:border-indigo-400 outline-none transition-all"
                                            value={formData.amount} 
                                            onChange={e => setFormData({...formData, amount: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Calculation Unit</label>
                                        <select 
                                            className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-3xl font-black text-slate-800 focus:border-indigo-400 outline-none transition-all appearance-none"
                                            value={formData.unit} 
                                            onChange={e => setFormData({...formData, unit: e.target.value})} 
                                        >
                                            <option value="Piece">Piece</option>
                                            <option value="Set">Set</option>
                                            <option value="Square Feet">Square Feet</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-slate-200 mt-6 hover:scale-[1.02] active:scale-95 transition-all">
                                    {editingId ? 'Update Factory Preset' : 'Save New Preset'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceCosts;
