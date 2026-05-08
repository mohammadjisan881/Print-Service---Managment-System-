import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign,
  ArrowUpRight,
  Clock,
  Calendar,
  Wallet,
  ArrowDownRight,
  CreditCard,
  Target,
  Banknote,
  Briefcase,
  Layers,
  CircleDot,
  ChevronDown
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const MetricCard = ({ title, value, color, icon: Icon, subText, subValue, isCurrency = true }) => (
  <div className="card flex items-center justify-between group hover:border-accent/20 transition-all cursor-default relative overflow-hidden">
    <div className="relative z-10">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">
        {isCurrency ? '৳' : ''}{(value || 0).toLocaleString()}
      </h3>
      {subText && (
        <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500">
                {subValue || 0}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{subText}</span>
        </div>
      )}
    </div>
    <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shadow-current/10 group-hover:scale-110 transition-transform relative z-10`}>
      <Icon size={24} />
    </div>
  </div>
);

const SmallCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`p-3 rounded-xl ${color} shadow-sm`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
            <h4 className="text-md font-black text-slate-800">৳{(value || 0).toLocaleString()}</h4>
        </div>
    </div>
);

const Dashboard = () => {
  const getLocalDate = (date = new Date()) => {
    // Returns YYYY-MM-DD in local time
    return date.toLocaleDateString('en-CA'); 
  };

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ 
    start: getLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    end: getLocalDate()
  });
  const [activePreset, setActivePreset] = useState('This Month');

  const presets = [
    { label: 'Today', getValue: () => ({ start: getLocalDate(), end: getLocalDate() }) },
    { label: 'Last 7 Days', getValue: () => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return { start: getLocalDate(d), end: getLocalDate() };
    }},
    { label: 'This Month', getValue: () => ({ 
        start: getLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), 
        end: getLocalDate() 
    })},
    { label: 'This Year', getValue: () => ({ 
        start: getLocalDate(new Date(new Date().getFullYear(), 0, 1)), 
        end: getLocalDate() 
    })}
  ];

  const handlePreset = (p) => {
    setActivePreset(p.label);
    setDateRange(p.getValue());
  };

  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const token = localStorage.getItem('adminToken');

  const fetchData = async () => {
    try {
      if (!token) return;
      const [statsRes, chartRes, collRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/analytics/stats?startDate=${dateRange.start}&endDate=${dateRange.end}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/analytics/charts', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/analytics/collections', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data || []);
      setCollections(collRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = io('http://localhost:5000');
    socket.on('orderUpdate', fetchData);
    socket.on('financeUpdate', fetchData);
    return () => socket.disconnect();
  }, [dateRange]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Synchronizing Intel...</p>
        </div>
    </div>
  );

  const summary = stats?.summary || {};
  const todayStats = stats?.today || {};

  const pieData = [
    { name: 'Production', value: summary.productionCost || 0, color: '#6366f1' },
    { name: 'Materials', value: summary.materialCost || 0, color: '#f59e0b' },
    { name: 'General Exp', value: summary.generalExpenses || 0, color: '#ec4899' },
    { name: 'Payroll', value: summary.payroll || 0, color: '#8b5cf6' },
    { name: 'Net Profit', value: Math.max(0, summary.trueNetProfit || 0), color: '#10b981' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Simplified Header with Presets */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic">Welcome, {user.username || 'Admin'}!</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                Real-time Enterprise Overview
            </p>
            <button 
                onClick={async () => {
                    try {
                        const res = await axios.get('http://localhost:5000/api/analytics/report', { headers: { Authorization: `Bearer ${token}` } });
                        alert(res.data.message);
                    } catch(e) { alert('Error sending report'); }
                }}
                className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5"
            >
                <Banknote size={12} /> Send Daily Report
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            {/* Quick Presets */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                {presets.map(p => (
                    <button 
                        key={p.label}
                        onClick={() => handlePreset(p)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activePreset === p.label ? 'bg-white text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Custom Range Pill */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm group">
                <Calendar size={14} className="text-accent" />
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => {
                            setDateRange({...dateRange, start: e.target.value});
                            setActivePreset('Custom');
                        }}
                        className="bg-transparent border-none outline-none font-bold text-[10px] text-slate-600 uppercase cursor-pointer w-24"
                    />
                    <span className="text-[10px] font-black text-slate-300">→</span>
                    <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => {
                            setDateRange({...dateRange, end: e.target.value});
                            setActivePreset('Custom');
                        }}
                        className="bg-transparent border-none outline-none font-bold text-[10px] text-slate-600 uppercase cursor-pointer w-24"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Sales" 
          value={stats?.summary?.revenue || 0} 
          color="bg-purple-600" 
          icon={DollarSign}
          subText="Today's Sales"
          subValue={`৳${(stats?.today?.revenue || 0).toLocaleString()}`}
        />
        <MetricCard 
          title="Cash Collected" 
          value={stats?.summary?.cashCollected || 0} 
          color="bg-blue-600" 
          icon={Wallet}
          subText="Today's Cash"
          subValue={`৳${(stats?.today?.cash || 0).toLocaleString()}`}
        />
        <MetricCard 
          title="Net Profit" 
          value={stats?.summary?.trueNetProfit || 0} 
          color="bg-green-600" 
          icon={TrendingUp}
          subText="Final Calc"
          subValue={`৳${(stats?.today?.profit || 0).toLocaleString()}`}
        />
        <MetricCard 
          title="Pending Orders" 
          value={stats?.summary?.pending || 0} 
          color="bg-orange-600" 
          icon={CircleDot}
          isCurrency={false}
          subText="Active Pipeline"
          subValue={stats?.summary?.orders || 0}
        />
      </div>

      {/* Financial Secondary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <SmallCard title="Staff Salaries" value={stats?.summary?.payroll || 0} icon={Briefcase} color="bg-indigo-50 text-indigo-600" />
        <SmallCard title="Capital Invest" value={stats?.summary?.investment || 0} icon={Target} color="bg-purple-50 text-purple-600" />
        <SmallCard title="Media Costs" value={stats?.summary?.materialCost || 0} icon={Layers} color="bg-orange-50 text-orange-600" />
        <SmallCard title="Shop Expenses" value={stats?.summary?.generalExpenses || 0} icon={ArrowDownRight} color="bg-pink-50 text-pink-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="lg:col-span-2 card bg-white border border-slate-100 p-8 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-black text-slate-800 italic tracking-tight">Sales Trajectory</h2>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Daily Revenue</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}}
                                tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                dy={15}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} dx={-10} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '15px' }}
                                itemStyle={{ fontWeight: 800, fontSize: '11px' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 italic text-[10px] uppercase font-black">No Historical Data</div>
                )}
            </div>
        </div>

        {/* Expense Pie Chart */}
        <div className="card bg-white border border-slate-100 p-8 shadow-sm flex flex-col items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 italic tracking-tight w-full mb-6">Financial Balance</h2>
            
            <div className="h-[200px] w-full">
                {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '10px', border: 'none', padding: '8px', fontSize: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 italic text-[10px] uppercase font-black">No Active Costs</div>
                )}
            </div>

            <div className="w-full space-y-2.5 mt-4">
                {pieData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-800 italic">৳{Math.round(item.value).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Cash Ledger Table Style */}
      <div className="card bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-800 italic">Recent Cash Flow</h2>
            <button className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                View All Transactions <ArrowUpRight size={14} />
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                    <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                        <th className="px-6 py-4">Client Name</th>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4 text-right">Timestamp</th>
                    </tr>
                </thead>
                <tbody className="text-xs font-bold divide-y divide-slate-50">
                    {collections.length === 0 ? (
                        <tr><td colSpan="5" className="py-10 text-center text-slate-300 italic font-medium">No recent cash transactions logged.</td></tr>
                    ) : collections.map(coll => (
                        <tr key={coll.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 text-slate-700 font-extrabold">{coll.client_name}</td>
                            <td className="px-6 py-4 text-slate-400 uppercase tracking-wider">{coll.display_id}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${coll.type === 'Advance' ? 'bg-indigo-50 text-indigo-500' : 'bg-green-50 text-green-500'}`}>
                                    {coll.type}
                                 </span>
                            </td>
                            <td className="px-6 py-4 text-slate-900 font-black italic">৳{coll.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right text-slate-400">
                                {new Date(coll.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
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

export default Dashboard;
