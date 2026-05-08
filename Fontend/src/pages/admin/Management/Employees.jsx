import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Users, Search, Mail, Phone, Calendar, Trash2, Camera, Wallet, History, TrendingUp, Clock, CheckCircle, X } from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', designation: '', phone: '', email: '', salary: '', join_date: new Date().toISOString().split('T')[0] });
  const [photoFile, setPhotoFile] = useState(null);
  const [filter, setFilter] = useState('');

  // Salary Management State
  const [selectedSalaryEmp, setSelectedSalaryEmp] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ amount: '', type: 'Salary', month: '', year: new Date().getFullYear(), notes: '' });
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);
  const [salaryTab, setSalaryTab] = useState('pay'); // pay, history, increment

  const token = localStorage.getItem('adminToken');
  const API = 'http://localhost:5000/api/employees';
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(API, config);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const calculateTenure = (joinDate) => {
    if (!joinDate) return 'N/A';
    const start = new Date(joinDate);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    let result = '';
    if (years > 0) result += `${years} Year${years > 1 ? 's' : ''} `;
    if (months > 0) result += `${months} Month${months > 1 ? 's' : ''}`;
    return result || 'Just joined';
  };

  // NEW: Calculate Unpaid Months
  const getUnpaidMonths = (emp, history) => {
      if (!emp.join_date) return [];
      const joinDate = new Date(emp.join_date);
      const currDate = new Date();
      const unpaid = [];
      
      let tempDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
      
      // Only include current month if it's late in the month (>= 28th)
      const dayOfMonth = currDate.getDate();
      const stopDate = (dayOfMonth >= 28) 
          ? new Date(currDate.getFullYear(), currDate.getMonth(), 1)
          : new Date(currDate.getFullYear(), currDate.getMonth() - 1, 1);
      
      while (tempDate <= stopDate) {
          const monthName = tempDate.toLocaleString('default', { month: 'long' });
          const yearNum = tempDate.getFullYear();
          
          // Check if this month/year is in history as Salary
          const isPaid = history.some(log => log.month === monthName && log.year === yearNum && log.type === 'Salary');
          
          if (!isPaid) {
              unpaid.push({ month: monthName, year: yearNum });
          }
          
          tempDate.setMonth(tempDate.getMonth() + 1);
      }
      return unpaid;
  };

  const handleSalaryManagement = async (emp) => {
    setSelectedSalaryEmp(emp);
    setPaymentForm({ ...paymentForm, amount: emp.salary, month: new Date().toLocaleString('default', { month: 'long' }) });
    setSalaryTab('pay');
    try {
      const res = await axios.get(`${API}/${emp.id}/history`, config);
      setSalaryHistory(res.data);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  const submitSalaryPayment = async (e) => {
    e.preventDefault();
    setIsSubmittingSalary(true);
    try {
        await axios.post(`${API}/${selectedSalaryEmp.id}/pay`, paymentForm, config);
        const hist = await axios.get(`${API}/${selectedSalaryEmp.id}/history`, config);
        setSalaryHistory(hist.data);
        setSalaryTab('history');
        setIsSubmittingSalary(false);
    } catch (err) {
        // Better error message
        alert(err.response?.data?.error || 'Failed to record payment. Please check server logs.');
        setIsSubmittingSalary(false);
    }
  };

  const submitIncrement = async (e) => {
    e.preventDefault();
    setIsSubmittingSalary(true);
    try {
        await axios.put(`${API}/${selectedSalaryEmp.id}/increment`, { 
            new_salary: paymentForm.amount,
            notes: paymentForm.notes 
        }, config);
        fetchEmployees();
        const hist = await axios.get(`${API}/${selectedSalaryEmp.id}/history`, config);
        setSalaryHistory(hist.data);
        setSalaryTab('history');
        setIsSubmittingSalary(false);
    } catch (err) {
        alert('Failed to update salary');
        setIsSubmittingSalary(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('designation', formData.designation);
      payload.append('phone', formData.phone);
      payload.append('email', formData.email);
      payload.append('salary', formData.salary);
      payload.append('join_date', formData.join_date);
      if (photoFile) payload.append('photo', photoFile);

      await axios.post(API, payload, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      });
      setIsModalOpen(false);
      setFormData({ name: '', designation: '', phone: '', email: '', salary: '', join_date: new Date().toISOString().split('T')[0] });
      setPhotoFile(null);
      fetchEmployees();
    } catch (err) {
      alert('Error adding employee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`${API}/${id}`, config);
        fetchEmployees();
      } catch (err) {
        alert('Error deleting employee');
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">Team <span className="text-accent">Manager.</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Personnel logistics & payroll</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Add Staff
        </button>
      </div>

      <div className="card !p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner group">
            <Search className="text-slate-300 group-focus-within:text-accent transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search talent archive..." 
              className="bg-transparent border-none focus:outline-none w-full font-bold text-sm text-slate-700"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {employees
            .filter(e => e.name.toLowerCase().includes(filter.toLowerCase()) || e.designation.toLowerCase().includes(filter.toLowerCase()))
            .map(emp => (
            <div key={emp.id} className="border border-slate-100 rounded-[2.5rem] p-8 hover:border-accent/40 transition-all group bg-white shadow-low hover:shadow-premium relative overflow-hidden">
              <div className="flex items-start justify-between mb-8 relative z-10">
                {emp.photo_url ? (
                  <img src={emp.photo_url} alt={emp.name} className="w-16 h-16 rounded-3xl object-cover shadow-lg bg-slate-50 border-2 border-white" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-indigo-600 text-white rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white">
                    {emp.name.charAt(0)}
                  </div>
                )}
                <button onClick={() => handleDelete(emp.id)} className="text-slate-200 hover:text-rose-500 hover:bg-rose-50 p-2.5 rounded-2xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">{emp.name}</h3>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-6">{emp.designation}</p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><Phone size={14} className="text-slate-400" /></div>
                    {emp.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><Calendar size={14} className="text-slate-400" /></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-300 leading-none mb-1">Tenure</span>
                        {calculateTenure(emp.join_date)}
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Standard Salary</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-black text-slate-800 italic leading-none">৳{parseFloat(emp.salary).toLocaleString()}</p>
                            {getUnpaidMonths(emp, salaryHistory).length > 0 && (
                                <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                    {getUnpaidMonths(emp, salaryHistory).length} Pending
                                </span>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={() => handleSalaryManagement(emp)}
                        className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-accent transition-all shadow-lg hover:rotate-3 shadow-slate-200"
                        title="Manage Salary & History"
                    >
                        <Wallet size={20} />
                    </button>
                </div>
              </div>

              {/* Decorative side accent */}
              <div className="absolute top-0 right-0 w-1 h-full bg-slate-50 group-hover:bg-accent/20 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 relative overflow-hidden">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-800 transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-black italic tracking-tighter mb-2">Recruit <span className="text-accent text-4xl">Staff.</span></h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px] mb-10">Personnel acquisition form</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                  <input className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 ring-accent/5 outline-none transition-all" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <input className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 ring-accent/5 outline-none transition-all" placeholder="Designation" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <input className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 ring-accent/5 outline-none transition-all" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                    <input className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 ring-accent/5 outline-none transition-all" type="number" placeholder="Salary (৳)" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} required />
                  </div>
                  <div className="pt-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Joining Date (কবে জয়েন করেছেন?)</label>
                      <input type="date" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 ring-accent/5 outline-none transition-all" value={formData.join_date} onChange={e => setFormData({...formData, join_date: e.target.value})} required />
                  </div>
                  <input className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 ring-accent/5 outline-none transition-all" type="email" placeholder="Email Address (Optional)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-dashed border-blue-100 mt-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-blue-500 flex items-center gap-1.5 mb-3"><Camera size={14} /> Profile Visual</label>
                <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="w-full text-[10px] font-black text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:uppercase file:tracking-widest file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all cursor-pointer" />
              </div>
              
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 mt-6 hover:bg-accent transition-all">Onboard Employee</button>
            </form>
          </div>
        </div>
      )}

      {/* SALARY MANAGEMENT MODAL */}
      {selectedSalaryEmp && (
          <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto pt-20 pb-20">
              <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-scale-up">
                  {/* Modal Header */}
                  <div className="bg-slate-900 p-10 text-white flex justify-between items-end relative">
                      <button onClick={() => setSelectedSalaryEmp(null)} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                      <div className="flex items-center gap-6">
                           {selectedSalaryEmp.photo_url ? (
                                <img src={selectedSalaryEmp.photo_url} className="w-20 h-20 rounded-3xl object-cover border-4 border-slate-800" />
                           ) : (
                                <div className="w-20 h-20 bg-accent text-white rounded-3xl flex items-center justify-center font-black text-3xl border-4 border-slate-800">
                                    {selectedSalaryEmp.name.charAt(0)}
                                </div>
                           )}
                           <div>
                               <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1">Financial Archive</p>
                               <h2 className="text-3xl font-black italic tracking-tighter leading-none">{selectedSalaryEmp.name}</h2>
                               <p className="text-slate-400 font-bold text-[10px] mt-2 tracking-widest uppercase">Base Salary: ৳{parseFloat(selectedSalaryEmp.salary).toLocaleString()}</p>
                           </div>
                      </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-50 px-10 gap-8">
                        {[
                            { id: 'pay', label: 'Payment', icon: Wallet },
                            { id: 'history', label: 'Ledger', icon: History },
                            { id: 'increment', label: 'Promotion', icon: TrendingUp }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSalaryTab(t.id)}
                                className={`py-6 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${salaryTab === t.id ? 'border-accent text-accent' : 'border-transparent text-slate-300 hover:text-slate-600'}`}
                            >
                                <t.icon size={14} /> {t.label}
                            </button>
                        ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-10">
                      {salaryTab === 'pay' && (
                          <form onSubmit={submitSalaryPayment} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Payout Type</label>
                                      <select 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 ring-accent/5 outline-none appearance-none cursor-pointer"
                                        value={paymentForm.type}
                                        onChange={e => setPaymentForm({...paymentForm, type: e.target.value, amount: e.target.value === 'Salary' ? selectedSalaryEmp.salary : ''})}
                                      >
                                          <option value="Salary">Monthly Salary</option>
                                          <option value="Bonus">Performance Bonus</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Amount (৳)</label>
                                      <input 
                                        type="number" 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 ring-accent/5 outline-none"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                                        required
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Month</label>
                                      <select 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none"
                                        value={paymentForm.month}
                                        onChange={e => setPaymentForm({...paymentForm, month: e.target.value})}
                                      >
                                          {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                                              <option key={m} value={m}>{m}</option>
                                          ))}
                                      </select>
                                      {getUnpaidMonths(selectedSalaryEmp, salaryHistory).length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                              <span className="text-[8px] font-black text-rose-400 uppercase mr-1">Unpaid:</span>
                                              {getUnpaidMonths(selectedSalaryEmp, salaryHistory).slice(0, 3).map(up => (
                                                  <button 
                                                    key={`${up.month}-${up.year}`}
                                                    type="button" 
                                                    onClick={() => setPaymentForm({...paymentForm, month: up.month, year: up.year})}
                                                    className="text-[8px] font-black bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded hover:bg-rose-100 transition-colors"
                                                  >
                                                      {up.month}
                                                  </button>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Year</label>
                                      <input 
                                        type="number" 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none"
                                        value={paymentForm.year}
                                        onChange={e => setPaymentForm({...paymentForm, year: e.target.value})}
                                      />
                                  </div>
                              </div>

                              <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Reference Notes (Optional)</label>
                                  <textarea 
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none min-h-[100px]"
                                    placeholder="Enter details..."
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                                  />
                              </div>

                              <button 
                                type="submit" 
                                disabled={isSubmittingSalary}
                                className="w-full bg-accent text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                              >
                                {isSubmittingSalary ? <Clock className="animate-spin inline mr-2" /> : <><CheckCircle size={16} className="inline mr-2" /> Confirm Payout</>}
                              </button>
                          </form>
                      )}

                      {salaryTab === 'history' && (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {salaryHistory.length === 0 ? (
                                  <div className="py-20 text-center opacity-30 italic font-bold">No transaction history found</div>
                              ) : (
                                  salaryHistory.map(log => (
                                      <div key={log.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-accent/20 transition-all">
                                          <div className="flex items-center gap-4">
                                              <div className={`p-3 rounded-2xl ${log.type === 'Salary' ? 'bg-blue-100 text-blue-600' : log.type === 'Bonus' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                                                  <Clock size={16} />
                                              </div>
                                              <div>
                                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.type} - {log.month} {log.year}</p>
                                                  <p className="text-xs font-bold text-slate-600 mt-1">{new Date(log.payment_date).toLocaleDateString()}</p>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <p className="text-lg font-black text-slate-800 italic">৳{parseFloat(log.amount).toLocaleString()}</p>
                                              {log.notes && <p className="text-[9px] font-bold text-slate-300 mt-1 max-w-[150px] truncate">{log.notes}</p>}
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      )}

                      {salaryTab === 'increment' && (
                          <form onSubmit={submitIncrement} className="space-y-6">
                                <div className="p-8 bg-blue-50/50 rounded-3xl border border-dashed border-blue-200">
                                    <p className="text-xs font-bold text-blue-600 leading-relaxed italic text-center">
                                        Note: Applying an increment will update the official monthly salary for this employee. Historical salary logs will NOT be altered.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">New Base Salary (৳)</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">৳</span>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-8 py-5 text-2xl font-black text-slate-800 outline-none focus:ring-4 ring-accent/5 transition-all"
                                            value={paymentForm.amount}
                                            onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="mt-3 flex justify-between px-2">
                                        <span className="text-[10px] font-black text-slate-300 uppercase">Current: ৳{selectedSalaryEmp.salary}</span>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase">Diff: +৳{paymentForm.amount - selectedSalaryEmp.salary}</span>
                                    </div>
                                </div>

                                <textarea 
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none min-h-[100px]"
                                    placeholder="Reason for promotion/increment..."
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                                />

                                <button 
                                    type="submit" 
                                    disabled={isSubmittingSalary}
                                    className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-600 transition-all disabled:opacity-50"
                                >
                                    {isSubmittingSalary ? <Clock className="animate-spin inline mr-2" /> : 'Apply Promotion'}
                                </button>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Employees;
