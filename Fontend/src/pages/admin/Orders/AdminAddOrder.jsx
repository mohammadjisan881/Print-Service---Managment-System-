import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Trash2, ArrowRight, User, Phone, Building, Calendar, FileText, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAddOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    client_name: '',
    phone_number: '',
    company_name: '',
    delivery_date: '',
    design_instructions: '',
    is_wholesale: false
  });

  const [orderItems, setOrderItems] = useState([
    { id: Date.now(), service_id: '', quantity: 1, print_width: '', print_height: '' }
  ]);
  
  const [designFile, setDesignFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    setIsSubmitting(true);
    const formDataPayload = new FormData();
    formDataPayload.append('client_name', formData.client_name);
    formDataPayload.append('phone_number', formData.phone_number);
    formDataPayload.append('company_name', formData.company_name);
    formDataPayload.append('delivery_date', formData.delivery_date);
    formDataPayload.append('design_instructions', formData.design_instructions);
    formDataPayload.append('is_wholesale', formData.is_wholesale ? '1' : '0');
    
    // Explicitly flag as admin created so status becomes "Confirmed"
    formDataPayload.append('admin_created', 'true');
    
    const itemsData = orderItems.map(item => ({
      ...item,
      unit_price: getProduct(item.service_id)?.base_price || 0,
      total_price: calculateItemPrice(item)
    }));
    formDataPayload.append('items', JSON.stringify(itemsData));

    if (designFile) formDataPayload.append('design_file', designFile);

    try {
      await axios.post('http://localhost:5000/api/orders', formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/admin/orders');
    } catch (err) {
      alert(`Error placing order: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">New Order Entry</h1>
        <p className="text-slate-500 font-medium mt-1">Orders created here will automatically bypass Pending and go to Confirmed state.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Client Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><User size={18} className="text-accent" /> Client Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-500 ml-1">Full Name *</label>
                <div className="relative mt-1">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-4 text-sm font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '2.5rem' }} required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500 ml-1">Phone Number *</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-4 text-sm font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '2.5rem' }} required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500 ml-1">Company Name</label>
                <div className="relative mt-1">
                  <Building className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-4 text-sm font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '2.5rem' }} value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500 ml-1">Expected Delivery *</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-4 text-sm font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '2.5rem' }} required value={formData.delivery_date} onChange={e => setFormData({...formData, delivery_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500 ml-1">Design Instructions</label>
                <div className="relative mt-1">
                  <FileText className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <textarea rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-4 text-sm font-bold focus:border-accent focus:bg-white outline-none transition-all" style={{ paddingLeft: '2.5rem' }} value={formData.design_instructions} onChange={e => setFormData({...formData, design_instructions: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setFormData({...formData, is_wholesale: !formData.is_wholesale})}>
                <input type="checkbox" checked={formData.is_wholesale} onChange={() => {}} className="w-4 h-4 accent-accent mt-0" />
                <span className="text-sm font-bold text-slate-700">Wholesale Order (পাইকারী অর্ডার)</span>
              </div>
              <div className="pt-1">
                <label className="text-xs font-black uppercase text-slate-500 ml-1">Attachment (Optional)</label>
                <input type="file" onChange={e => setDesignFile(e.target.files[0])} className="w-full mt-1 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-medium" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Package size={18} className="text-accent" /> Ordered Items</h2>
            
            <div className="space-y-4">
              {orderItems.map((item) => {
                const selectedProduct = getProduct(item.service_id);
                const isSqFt = selectedProduct?.unit_type === 'Square Feet';

                return (
                  <div key={item.id} className="relative p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    {orderItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 bg-white shadow-sm p-1.5 rounded-full transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                    
                    <div className="space-y-3 pr-6">
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold outline-none" 
                        required 
                        value={item.service_id}
                        onChange={e => handleItemChange(item.id, 'service_id', e.target.value)}
                      >
                        <option value="">-- Choose a Service --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - ৳{p.base_price} /{p.unit_type}</option>
                        ))}
                      </select>

                      {selectedProduct && (
                        <div>
                          {isSqFt ? (
                            <div className="grid grid-cols-2 gap-3">
                              <input type="number" step="0.01" className="w-full bg-white border border-slate-200 py-2 px-3 rounded-xl text-sm font-bold" required value={item.print_width} onChange={e => handleItemChange(item.id, 'print_width', e.target.value)} placeholder="Width (ft)" />
                              <input type="number" step="0.01" className="w-full bg-white border border-slate-200 py-2 px-3 rounded-xl text-sm font-bold" required value={item.print_height} onChange={e => handleItemChange(item.id, 'print_height', e.target.value)} placeholder="Height (ft)" />
                            </div>
                          ) : (
                            <input type="number" min="1" className="w-24 bg-white border border-slate-200 py-2 px-3 rounded-xl text-sm font-bold" required value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} placeholder="Qty" />
                          )}
                          <div className="mt-3 text-right">
                            <span className="text-xs font-bold text-slate-500 mr-2">Subtotal:</span>
                            <span className="text-base font-black text-slate-800">৳{calculateItemPrice(item).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={addItem} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:border-accent hover:text-accent rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
              <Plus size={16} /> Add Another Row
            </button>

            <div className="my-6 border-t border-slate-100"></div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-bold">Grand Total</span>
              <span className="text-2xl font-black text-accent">৳{grandTotal.toFixed(2)}</span>
            </div>

            <button disabled={isSubmitting || orderItems.length === 0} type="submit" className="w-full btn-primary py-3.5 disabled:opacity-70 text-base flex items-center justify-center gap-2">
              {isSubmitting ? 'Processing...' : 'Save & Confirm Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminAddOrder;
