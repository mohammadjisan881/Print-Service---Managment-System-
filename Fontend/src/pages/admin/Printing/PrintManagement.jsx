import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, CheckCircle, Package, ArrowRight, X, Layers } from 'lucide-react';

const PrintManagement = () => {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState({ 
    inventory_id: '', 
    quantity_used: '', 
    waste_quantity: '',
    width: '',
    height: ''
  });

  const [outsidePress, setOutsidePress] = useState({ orderId: null, name: '' });

  const token = localStorage.getItem('adminToken');
  const API_ORDERS = 'http://localhost:5000/api/orders?status=Printing';
  const API_INV = 'http://localhost:5000/api/inventory';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordRes, invRes] = await Promise.all([
        axios.get(API_ORDERS, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_INV, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setOrders(ordRes.data);
      setInventory(invRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOutsidePrintSubmit = async (orderId) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { 
        status: 'Printing', 
        outside_press_name: outsidePress.name 
      }, { headers: { Authorization: `Bearer ${token}` } });
      setOutsidePress({ orderId: null, name: '' });
      fetchData();
    } catch (err) {
      alert('Failed to update outside press info');
    }
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/inventory/record-usage', {
        inventory_id: usageData.inventory_id,
        order_id: selectedOrder.id,
        quantity_used: usageData.quantity_used,
        waste_quantity: usageData.waste_quantity || 0
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSelectedOrder(null);
      setUsageData({ inventory_id: '', quantity_used: '', waste_quantity: '', width: '', height: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record usage');
    }
  };

  const completePrint = async (orderId) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
        { status: 'Delivered' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const selectedMaterial = inventory.find(i => i.id == usageData.inventory_id);
  const calculatedArea = (parseFloat(usageData.width) || 0) * (parseFloat(usageData.height) || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Print Management</h1>
        <p className="text-slate-500 font-medium mt-1">Manage active print jobs and record material consumption</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform">
                  <Printer size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{order.client_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">#{order.order_id}</span>
                    {order.is_wholesale === 1 && <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100">Wholesale</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                  {order.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Order Items ({order.items?.length || 0})</h4>
              <div className="space-y-2">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-700">{item.service_name || 'Service'}</span>
                    <span className="text-slate-500 font-medium">
                      {item.unit_type === 'Square Feet' ? `${item.print_width}×${item.print_height} ft` : `Qty: ${item.quantity}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Outside Print Toggle */}
              <div className="flex items-center justify-between p-3 bg-rose-50/50 border border-rose-100 rounded-2xl">
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${order.outside_press_name ? 'bg-rose-500' : 'bg-slate-200'}`} onClick={() => setOutsidePress(prev => prev.orderId === order.id ? {orderId: null, name: ''} : {orderId: order.id, name: order.outside_press_name || ''})}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${order.outside_press_name ? 'left-5' : 'left-1'}`}></div>
                   </div>
                   <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Outside Printing?</span>
                 </div>
                 {order.outside_press_name && <span className="text-xs font-bold text-rose-500 truncate max-w-[150px]">{order.outside_press_name}</span>}
              </div>

              {outsidePress.orderId === order.id && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-white border border-rose-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-1 ring-rose-500 outline-none" 
                      placeholder="Enter Press Name (e.g. Art Digital)"
                      value={outsidePress.name}
                      onChange={e => setOutsidePress({...outsidePress, name: e.target.value})}
                    />
                    <button onClick={() => handleOutsidePrintSubmit(order.id)} className="px-4 py-2 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-colors">UPDATE</button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setSelectedOrder(order);
                    // Pre-fill dimensions if SqFt
                    const sqItem = order.items?.find(i => i.unit_type === 'Square Feet');
                    if (sqItem) {
                      setUsageData(prev => ({...prev, width: sqItem.print_width, height: sqItem.print_height}));
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  <Layers size={18} /> Record Usage
                </button>
                <button 
                  onClick={() => completePrint(order.id)}
                  className="px-4 py-3 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                >
                  <CheckCircle size={18} /> Done
                </button>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && !loading && (
          <div className="col-span-full card text-center py-20 grayscale opacity-50">
            <Printer size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-2xl font-black">No Active Print Jobs</h2>
            <p className="text-slate-500 mt-2">The printing stable is currently empty.</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setSelectedOrder(null);
                setUsageData({ inventory_id: '', quantity_used: '', waste_quantity: '', width: '', height: '' });
              }} 
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Layers size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Record Material Usage</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Order #{selectedOrder.order_id} <ArrowRight size={10} /> {selectedOrder.client_name}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUsageSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">1. Select Material</label>
                    <select 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                      value={usageData.inventory_id}
                      onChange={e => setUsageData({...usageData, inventory_id: e.target.value, quantity_used: ''})}
                    >
                      <option value="">-- Choose Material --</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.item_code}) - Stock: {item.total_stock} {item.unit_type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMaterial?.unit_type === 'SqFt' ? (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="col-span-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Dimensions (Feet)</div>
                      <div>
                        <input 
                          type="number" step="0.01" 
                          placeholder="Width"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-indigo-500"
                          value={usageData.width}
                          onChange={e => setUsageData({...usageData, width: e.target.value})}
                        />
                      </div>
                      <div>
                        <input 
                          type="number" step="0.01" 
                          placeholder="Height"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-indigo-500"
                          value={usageData.height}
                          onChange={e => setUsageData({...usageData, height: e.target.value})}
                        />
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center mt-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Calculated Area:</span>
                        <span className="text-sm font-black text-slate-700">{calculatedArea.toFixed(2)} SqFt</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">2. Quantity Used ({selectedMaterial?.unit_type || 'Piece'})</label>
                      <input 
                        type="number" step="0.01" 
                        required 
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm outline-none focus:border-indigo-500"
                        placeholder="e.g. 5"
                        value={usageData.quantity_used}
                        onChange={e => setUsageData({...usageData, quantity_used: e.target.value})}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5 ml-1">3. Waste Material ({selectedMaterial?.unit_type || 'Piece'})</label>
                    <input 
                      type="number" step="0.01" 
                      className="w-full bg-rose-50/30 border border-rose-100 px-4 py-3 rounded-xl font-bold text-sm outline-none focus:border-rose-300"
                      placeholder="e.g. 0.5"
                      value={usageData.waste_quantity}
                      onChange={e => setUsageData({...usageData, waste_quantity: e.target.value})}
                    />
                  </div>
                </div>

                <div className="bg-indigo-50/30 border border-indigo-100 rounded-[2rem] p-6 flex flex-col justify-between">
                   <div>
                     <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-4">Stock Impact Analysis</h4>
                     <div className="space-y-4">
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-500 font-bold tracking-tight">Current Stock:</span>
                         <span className="font-black text-slate-800">{selectedMaterial?.total_stock || 0} {selectedMaterial?.unit_type}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-500 font-bold tracking-tight">Net Used:</span>
                         <span className="font-black text-slate-800">{(selectedMaterial?.unit_type === 'SqFt' ? calculatedArea : parseFloat(usageData.quantity_used || 0)).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-500 font-bold tracking-tight">Waste:</span>
                         <span className="font-black text-rose-500">+{parseFloat(usageData.waste_quantity || 0).toFixed(2)}</span>
                       </div>
                       <div className="pt-3 border-t border-indigo-100 flex justify-between items-center">
                         <span className="text-xs font-black text-indigo-600 uppercase">After Deduction:</span>
                         <span className={`text-lg font-black ${(selectedMaterial?.total_stock - ((selectedMaterial?.unit_type === 'SqFt' ? calculatedArea : parseFloat(usageData.quantity_used || 0)) + parseFloat(usageData.waste_quantity || 0))) < 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                           {(selectedMaterial?.total_stock - ((selectedMaterial?.unit_type === 'SqFt' ? calculatedArea : parseFloat(usageData.quantity_used || 0)) + parseFloat(usageData.waste_quantity || 0))).toFixed(2)}
                         </span>
                       </div>
                     </div>
                   </div>

                   {selectedMaterial && (
                     <div className="mt-8 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Material Cost</span>
                          <span className="font-black text-slate-800">৳{(((selectedMaterial?.id ? (selectedMaterial.unit_type === 'SqFt' ? calculatedArea : parseFloat(usageData.quantity_used || 0)) + parseFloat(usageData.waste_quantity || 0) : 0) * selectedMaterial.unit_cost)).toFixed(2)}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 leading-tight">Price per {selectedMaterial.unit_type}: ৳{selectedMaterial.unit_cost}</p>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setUsageData({ inventory_id: '', quantity_used: '', waste_quantity: '', width: '', height: '' });
                  }}
                  className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm flex-1 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!usageData.inventory_id}
                  className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex-[2] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                  onMouseDown={() => {
                    // Update usageData.quantity_used with calculatedArea if SqFt
                    if (selectedMaterial?.unit_type === 'SqFt') {
                       setUsageData(prev => ({...prev, quantity_used: calculatedArea}));
                    }
                  }}
                >
                  Submit Tracking <ArrowRight size={20} className="inline ml-1" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintManagement;
