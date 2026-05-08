import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Trash2, ArrowRight, User, Phone, Building, Calendar, FileText, Package } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PlaceOrder = () => {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('service');
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    client_name: '',
    phone_number: '',
    company_name: '',
    delivery_date: '',
    design_instructions: ''
  });

  const [orderItems, setOrderItems] = useState([
    { id: Date.now(), service_id: initialServiceId ? parseInt(initialServiceId) : '', quantity: 1, print_width: '', print_height: '' }
  ]);
  const [designFile, setDesignFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  const getProduct = (serviceId) => products.find(p => p.id === parseInt(serviceId));

  const calculateItemPrice = (item) => {
    const product = getProduct(item.service_id);
    if (!product) return 0;
    
    if (product.unit_type === 'Square Feet') {
      const w = parseFloat(item.print_width) || 0;
      const h = parseFloat(item.print_height) || 0;
      return product.base_price * w * h;
    } else {
      return product.base_price * (item.quantity || 1);
    }
  };

  const grandTotal = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + calculateItemPrice(item), 0);
  }, [orderItems, products]);

  const handleItemChange = (id, field, value) => {
    setOrderItems(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setOrderItems([...orderItems, { id: Date.now(), service_id: '', quantity: 1, print_width: '', print_height: '' }]);
  };

  const removeItem = (id) => {
    if (orderItems.length > 1) {
      setOrderItems(items => items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderItems.some(i => !i.service_id)) return alert('Please select a service for all items.');
    if (orderItems.some(i => getProduct(i.service_id)?.unit_type === 'Square Feet' && (!i.print_width || !i.print_height))) {
      return alert('Please enter width and height for all Square Feet items.');
    }

    setIsSubmitting(true);
    
    const formDataPayload = new FormData();
    formDataPayload.append('client_name', formData.client_name);
    formDataPayload.append('phone_number', formData.phone_number);
    formDataPayload.append('company_name', formData.company_name);
    formDataPayload.append('delivery_date', formData.delivery_date);
    formDataPayload.append('design_instructions', formData.design_instructions);
    
    const itemsData = orderItems.map(item => ({
      ...item,
      unit_price: getProduct(item.service_id)?.base_price || 0,
      total_price: calculateItemPrice(item)
    }));
    formDataPayload.append('items', JSON.stringify(itemsData));

    if (designFile) {
      formDataPayload.append('design_file', designFile);
    }

    try {
      const res = await axios.post('http://localhost:5000/api/orders', formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessOrder(res.data.order_id);
    } catch (err) {
      alert(`Error placing order: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-lg w-full rounded-3xl p-10 text-center shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Order Confirmed!</h2>
          <p className="text-slate-500 mb-6 font-medium">Your multi-item order has been successfully placed.</p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Tracking ID</span>
            <span className="text-2xl font-black text-accent">{successOrder}</span>
          </div>
          <button onClick={() => navigate('/products')} className="btn-primary w-full py-4">Browse More Services</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="container-custom max-w-6xl mx-auto">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-black mb-3">Place Your Order</h1>
          <p className="text-slate-500 font-medium">Fill out your details and customize the printing services you need in one quick order slip.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Services / Cart */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Package size={20} className="text-accent" /> Order Cart</h2>
              </div>
              
              <div className="space-y-6">
                {orderItems.map((item, index) => {
                  const selectedProduct = getProduct(item.service_id);
                  const isSqFt = selectedProduct?.unit_type === 'Square Feet';

                  return (
                    <div key={item.id} className="relative p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                      {orderItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 bg-white shadow-sm p-1.5 rounded-full transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                      
                      <div className="space-y-4 pr-8">
                        <div>
                          <label className="text-xs font-black uppercase text-slate-400 ml-1 block mb-1">Select Service</label>
                          <select 
                            className="input-field w-full bg-white" 
                            required 
                            value={item.service_id}
                            onChange={e => handleItemChange(item.id, 'service_id', e.target.value)}
                          >
                            <option value="">-- Choose a Service --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} - ৳{p.base_price} /{p.unit_type}</option>
                            ))}
                          </select>
                        </div>

                        {selectedProduct && (
                          <div className="pt-2 animate-fade-in">
                            {isSqFt ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-black uppercase text-slate-400 ml-1 block mb-1">Width (ft)</label>
                                  <input type="number" step="0.01" className="input-field bg-white" required value={item.print_width} onChange={e => handleItemChange(item.id, 'print_width', e.target.value)} placeholder="e.g. 10.5" />
                                </div>
                                <div>
                                  <label className="text-xs font-black uppercase text-slate-400 ml-1 block mb-1">Height (ft)</label>
                                  <input type="number" step="0.01" className="input-field bg-white" required value={item.print_height} onChange={e => handleItemChange(item.id, 'print_height', e.target.value)} placeholder="e.g. 5" />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="text-xs font-black uppercase text-slate-400 ml-1 block mb-1">Quantity ({selectedProduct.unit_type})</label>
                                <input type="number" min="1" className="input-field bg-white" required value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} />
                              </div>
                            )}
                            <div className="mt-4 text-right">
                              <span className="text-sm font-bold text-slate-500 mr-2">Item Subtotal:</span>
                              <span className="text-lg font-black text-slate-800">৳{calculateItemPrice(item).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button type="button" onClick={addItem} className="mt-6 w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:border-accent hover:text-accent rounded-2xl transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> Add Another Service
              </button>
            </div>
          </div>

          {/* Right Column: Checkout Details */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><User size={20} className="text-accent" /> Client Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 ml-1">Full Name *</label>
                  <div className="relative mt-1">
                    <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-4 text-slate-800 font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '3.2rem' }} required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} placeholder="Mohammad Jisan" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 ml-1">Phone Number *</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-4 text-slate-800 font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '3.2rem' }} required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="017XXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 ml-1">Company Name</label>
                  <div className="relative mt-1">
                    <Building className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-4 text-slate-800 font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '3.2rem' }} value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} placeholder="Your Company (Optional)" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 ml-1">Expected Delivery *</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-4 text-slate-800 font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '3.2rem' }} required value={formData.delivery_date} onChange={e => setFormData({...formData, delivery_date: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 ml-1">Design Instructions</label>
                  <div className="relative mt-1">
                    <FileText className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <textarea rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-4 text-slate-800 font-bold focus:border-accent focus:bg-white outline-none transition-all h-auto" style={{ paddingLeft: '3.2rem' }} value={formData.design_instructions} onChange={e => setFormData({...formData, design_instructions: e.target.value})} placeholder="Please make the background blue, etc..." />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="text-xs font-black uppercase text-slate-500 ml-1">Design Reference File</label>
                  <input type="file" accept="image/*,.pdf,.ai,.eps,.psd" onChange={e => setDesignFile(e.target.files[0])} className="w-full mt-1 bg-slate-50 border border-slate-200 text-slate-500 p-2.5 rounded-xl text-sm font-medium" />
                </div>
              </div>

              <div className="my-8 border-t border-slate-100"></div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-bold">Grand Total</span>
                <span className="text-3xl font-black text-accent">৳{grandTotal.toFixed(2)}</span>
              </div>

              <button disabled={isSubmitting || orderItems.length === 0} type="submit" className="w-full btn-primary py-4 disabled:opacity-70 text-lg flex items-center justify-center gap-2">
                {isSubmitting ? 'Processing...' : 'Confirm Order'} <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceOrder;
