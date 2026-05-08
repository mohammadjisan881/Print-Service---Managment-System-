import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar, User, Phone } from 'lucide-react';

const OrderModal = ({ product, isOpen, onClose }) => {
  const [formData, setFormData] = useState({ client_name: '', phone_number: '', delivery_date: '', quantity: 1, print_width: '', print_height: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isSqFt = product?.unit_type === 'Square Feet';
  let dynamicPrice = product?.base_price || 0;
  if (isSqFt) {
    const w = parseFloat(formData.print_width) || 0;
    const h = parseFloat(formData.print_height) || 0;
    dynamicPrice = dynamicPrice * w * h;
  } else {
    dynamicPrice = dynamicPrice * (formData.quantity || 1);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSqFt && (!formData.print_width || !formData.print_height)) return alert('Please provide width and height.');
    
    setIsSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/orders', {
        ...formData,
        service_id: product.id,
        total_price: dynamicPrice,
        advance_paid: 0
      });
      setSuccessMsg(`Order placed successfully! Tracking ID: ${res.data.order_id}`);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setFormData({ client_name: '', phone_number: '', delivery_date: '', quantity: 1, print_width: '', print_height: '' });
      }, 4000);
    } catch (err) {
      alert('Error placing order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative">
        <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 focus:outline-none">
          <X size={24} />
        </button>
        
        {successMsg ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Order Confirmed!</h3>
            <p className="text-slate-500 font-medium">{successMsg}</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-1">Order {product?.name}</h2>
            <p className="text-slate-500 mb-6 font-medium text-sm">Base Price: ৳{product?.base_price} / {product?.unit_type || 'Piece'}</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input className="input-field pl-12" required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} placeholder="Mohammad Jisan" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input className="input-field pl-12" required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="017XXXXXXXX" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Expected Delivery</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input type="date" className="input-field pl-12" required value={formData.delivery_date} onChange={e => setFormData({...formData, delivery_date: e.target.value})} />
                </div>
              </div>

              {isSqFt ? (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Width (ft)</label>
                    <input type="number" step="0.01" className="input-field" required value={formData.print_width} onChange={e => setFormData({...formData, print_width: e.target.value})} placeholder="e.g. 10.5" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Height (ft)</label>
                    <input type="number" step="0.01" className="input-field" required value={formData.print_height} onChange={e => setFormData({...formData, print_height: e.target.value})} placeholder="e.g. 5" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Quantity ({product?.unit_type || 'Piece'})</label>
                  <input type="number" min="1" className="input-field" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} />
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl mt-6 flex justify-between items-center border border-slate-100">
                <span className="text-sm font-bold text-slate-500">Estimated Total:</span>
                <span className="text-2xl font-black text-accent">৳{dynamicPrice.toFixed(2)}</span>
              </div>

              <button disabled={isSubmitting} type="submit" className="w-full btn-primary py-4 mt-2 disabled:opacity-70 transition-all">
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderModal;
