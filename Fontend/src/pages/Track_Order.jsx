import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Package, Clock, Truck, CheckCircle, RefreshCcw, Loader2, FileText, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Designing', 'Printing', 'Delivered', 'Completed'];

const Track_Order = () => {
  const [trackingId, setTrackingId] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fetchOrder = async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/track/${idToFetch.trim()}`);
      setOrderInfo(res.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setError('Order not found. Please check your tracking ID.');
      } else {
        setError('Failed to fetch order details. Please try again later.');
      }
      setOrderInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrder(trackingId);
  };

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('orderUpdate', () => {
      // If we are currently viewing an order, re-fetch its details quietly
      if (orderInfo && orderInfo.order_id) {
         axios.get(`http://localhost:5000/api/orders/track/${orderInfo.order_id}`)
           .then(res => setOrderInfo(res.data))
           .catch(() => {}); // ignore errors on background refresh
      }
    });

    return () => socket.disconnect();
  }, [orderInfo?.order_id]);

  const getStepStatus = (stepIndex, currentStatus) => {
    if (currentStatus === 'Returned' || currentStatus === 'Cancelled') return 'error';
    const currentIndex = STATUS_STEPS.indexOf(currentStatus);
    if (currentIndex === -1) return 'pending'; // Unknown status
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="container-custom max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black mb-3">Track Your Order</h1>
          <p className="text-slate-500 font-medium">Enter your Order ID below to get real-time tracking updates (<span className="text-accent font-bold">Live</span>)</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="e.g. ORD-A1B2C3D4" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pr-4 text-slate-800 font-bold focus:border-accent focus:bg-white outline-none transition-all pl-12 text-lg uppercase" 
                value={trackingId}
                onChange={e => setTrackingId(e.target.value.toUpperCase())}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary py-4 px-8 text-lg flex justify-center items-center gap-2 whitespace-nowrap min-w-[160px]">
              {loading ? <Loader2 size={24} className="animate-spin" /> : 'Track Order'}
            </button>
          </form>
          {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2"><XCircle size={18} /> {error}</div>}
        </div>

        {/* Order Details */}
        {orderInfo && !loading && (
          <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-slate-900 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
               {/* Live indicator */}
               <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-green-500/30">
                 <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Live Sync
               </div>

               <div>
                 <span className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1 block">Order ID</span>
                 <h2 className="text-3xl font-black">{orderInfo.order_id}</h2>
                 <p className="text-slate-300 font-medium text-sm mt-1">Placed on {new Date(orderInfo.created_at).toLocaleDateString()}</p>
               </div>
               <div className="text-left md:text-right">
                 <span className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1 block">Total Amount</span>
                 <div className="text-3xl font-black text-accent">৳{orderInfo.total_price}</div>
               </div>
            </div>

            {/* Tracking Pipeline */}
            <div className="p-6 md:p-10 border-b border-slate-100">
               <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">Order Status</h3>
               
               {orderInfo.status === 'Cancelled' || orderInfo.status === 'Returned' ? (
                 <div className={`p-6 rounded-2xl border ${orderInfo.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                   <h4 className="font-black text-xl mb-2">{orderInfo.status === 'Cancelled' ? 'Order Cancelled' : 'Order Returned'}</h4>
                   <p className="font-medium text-sm">This order has been {orderInfo.status.toLowerCase()}. Please contact support for more details.</p>
                 </div>
               ) : (
                 <div className="relative">
                   <div className="absolute left-[15px] md:left-auto md:top-[15px] md:w-full md:h-1 h-full w-1 bg-slate-100 z-0"></div>
                   
                   <div className="flex flex-col md:flex-row justify-between relative z-10 gap-6 md:gap-0">
                     {STATUS_STEPS.map((step, index) => {
                       const statusState = getStepStatus(index, orderInfo.status);
                       
                       let icon = <Clock size={16} />;
                       if (step === 'Completed' || step === 'Delivered') icon = <CheckCircle size={16} />;
                       if (step === 'Printing' || step === 'Designing') icon = <RefreshCcw size={16} className={statusState === 'current' ? 'animate-spin-slow' : ''} />;
                       if (step === 'Delivered') icon = <Truck size={16} />;

                       let badgeStyle = "bg-slate-100 text-slate-400 border border-slate-200";
                       let textStyle = "text-slate-400";
                       
                       if (statusState === 'completed') {
                         badgeStyle = "bg-accent border border-accent text-white shadow-md shadow-accent/20";
                         textStyle = "text-slate-800 font-bold";
                       } else if (statusState === 'current') {
                         badgeStyle = "bg-white border-2 border-accent text-accent shadow-lg shadow-accent/20";
                         textStyle = "text-accent font-black";
                       }

                       return (
                         <div key={step} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${badgeStyle}`}>
                             {icon}
                           </div>
                           <div className={`text-sm tracking-wide md:text-center mt-1 transition-colors duration-500 ${textStyle}`}>
                             {step}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-slate-100">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Package size={16} /> Order Summary</h3>
                 <div className="space-y-4">
                   {(orderInfo.items && orderInfo.items.length > 0) ? (
                     orderInfo.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-start pb-4 border-b border-slate-50 last:border-0">
                         <div>
                           <div className="font-bold text-slate-800">{item.service_name || item.custom_service_name || 'Service Item'}</div>
                           <div className="text-xs text-slate-500 font-medium mt-1">
                             {item.unit_type === 'Square Feet' && item.print_width && item.print_height
                               ? `${item.print_width}W × ${item.print_height}H (SqFt)`
                               : `Qty: ${item.quantity || 1}`
                             }
                           </div>
                         </div>
                         <div className="font-black text-slate-700">৳{item.total_price}</div>
                       </div>
                     ))
                   ) : (
                     <div className="text-sm font-bold text-slate-600">Legacy Order Format</div>
                   )}
                 </div>
              </div>
              
              <div className="p-6 md:p-10 bg-slate-50/50">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><FileText size={16} /> Fulfillment Details</h3>
                 <div className="space-y-6">
                   <div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Expected Delivery</span>
                     <span className="font-bold text-slate-800 text-lg">{new Date(orderInfo.delivery_date).toLocaleDateString()}</span>
                   </div>
                   
                   <div className="bg-white p-4 rounded-2xl border border-slate-200">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Payment Status</span>
                     <div className="flex justify-between items-center">
                       <span className="font-bold text-slate-600">Advance Paid</span>
                       <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">৳{orderInfo.advance_paid}</span>
                     </div>
                     <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                       <span className="font-bold text-slate-600">Due Amount</span>
                       <span className="font-black text-red-500 bg-red-50 px-2 py-0.5 rounded">৳{(parseFloat(orderInfo.total_price) - parseFloat(orderInfo.advance_paid)).toFixed(2)}</span>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Track_Order;
