import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, TrendingUp, Calendar, Search, Award, Printer, Package, ChevronRight, BarChart3 } from 'lucide-react';

const PerformanceDashboard = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminDetails, setAdminDetails] = useState(null);

  const token = localStorage.getItem('adminToken');
  const API = 'http://localhost:5000/api/performance';

  useEffect(() => {
    fetchPerformance();
  }, [dateRange]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const url = dateRange.start && dateRange.end 
        ? `${API}?startDate=${dateRange.start}&endDate=${dateRange.end}` 
        : API;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setPerformance(res.data);
    } catch (err) {
      console.error('Error fetching performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (admin) => {
    try {
      const res = await axios.get(`${API}/${admin.admin_id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAdminDetails(res.data);
      setSelectedAdmin(admin);
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  const filteredPerformance = performance.filter(p => 
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.admin_id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 italic">EMPLOYEE PERFORMANCE</h1>
          <p className="text-slate-500 font-medium">Track staff output, order completion & material usage</p>
        </div>
        
        <div className="flex gap-4">
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
             <Calendar size={18} className="text-accent" />
             <input 
               type="date" 
               className="text-xs font-bold outline-none" 
               value={dateRange.start} 
               onChange={e => setDateRange({...dateRange, start: e.target.value})}
             />
             <span className="text-slate-300">-</span>
             <input 
               type="date" 
               className="text-xs font-bold outline-none" 
               value={dateRange.end} 
               onChange={e => setDateRange({...dateRange, end: e.target.value})}
             />
           </div>
           
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text"
               placeholder="Search Staff Name..."
               className="pl-12 pr-6 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:border-accent font-bold text-sm min-w-[250px]"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPerformance.map(staff => (
              <div 
                key={staff.admin_id} 
                onClick={() => fetchDetails(staff)}
                className={`p-6 rounded-[2.5rem] bg-white border transition-all cursor-pointer group ${
                  selectedAdmin?.admin_id === staff.admin_id ? 'border-accent ring-4 ring-accent/5' : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-xl">
                      {staff.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{staff.username}</h3>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{staff.role}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-accent group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-4 rounded-3xl">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Revenue Impact</span>
                    </div>
                    <p className="text-lg font-black text-slate-800">৳{parseFloat(staff.total_value_completed || 0).toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-slate-400">{staff.orders_completed || 0} Orders Done</p>
                  </div>
                  
                  <div className="bg-slate-50/50 p-4 rounded-3xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Printer size={14} className="text-blue-500" />
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Prod. Output</span>
                    </div>
                    <p className="text-lg font-black text-slate-800">{parseFloat(staff.total_sqft_printed || 0).toFixed(1)} <span className="text-xs">SqFt</span></p>
                    <p className="text-[9px] font-bold text-rose-500">{staff.total_waste || 0} SqFt Waste</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          {selectedAdmin ? (
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white sticky top-6 shadow-2xl shadow-slate-200">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-accent border-4 border-slate-800 rounded-3xl flex items-center justify-center text-white font-black text-2xl rotate-3 shadow-2xl">
                    {selectedAdmin.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedAdmin.username}</h2>
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-accent" />
                      <span className="text-xs font-bold text-slate-400">Top Performer Analysis</span>
                    </div>
                  </div>
               </div>

               <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <BarChart3 size={18} className="text-accent" />
                      <span className="text-sm font-bold">Total Orders</span>
                    </div>
                    <span className="text-xl font-black">{selectedAdmin.orders_completed}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Printer size={18} className="text-blue-400" />
                      <span className="text-sm font-bold">SqFt Produced</span>
                    </div>
                    <span className="text-xl font-black">{parseFloat(selectedAdmin.total_sqft_printed).toFixed(1)}</span>
                  </div>
               </div>

               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Recent Order History</h4>
               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {adminDetails?.orders.map(order => (
                    <div key={order.id} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black">{order.client_name}</p>
                          <p className="text-[9px] font-bold text-slate-500">{order.order_id}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-400">৳{order.total_price}</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center h-[500px] flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Users size={40} />
              </div>
              <h3 className="font-black text-slate-800 text-lg uppercase italic">No Staff Selected</h3>
              <p className="text-sm text-slate-400 mt-2 font-medium">Select an employee from the left to view their detailed performance report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
