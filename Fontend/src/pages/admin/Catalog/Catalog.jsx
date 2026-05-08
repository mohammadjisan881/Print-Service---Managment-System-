import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Package, Search, X } from 'lucide-react';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [presets, setPresets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', base_price: '', cost_price: '', category: '', unit_type: 'Piece', image_url: '', cost_preset_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem('adminToken');
  const API = 'http://localhost:5000/api/products';

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/cost-presets', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setPresets(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('base_price', formData.base_price);
      submitData.append('cost_price', formData.cost_price || 0);
      submitData.append('cost_preset_id', formData.cost_preset_id || '');
      submitData.append('category', formData.category);
      submitData.append('unit_type', formData.unit_type);
      if (formData.image_url) submitData.append('image_url', formData.image_url);
      if (imageFile) submitData.append('image', imageFile);

      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };

      if (editingId) {
        await axios.put(`${API}/${editingId}`, submitData, config);
      } else {
        await axios.post(API, submitData, config);
      }
      setIsModalOpen(false);
      setFormData({ name: '', description: '', base_price: '', cost_price: '', category: '', unit_type: 'Piece', image_url: '', cost_preset_id: '' });
      setImageFile(null);
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      alert('Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchProducts();
      } catch (err) {
        alert('Error deleting product');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Service Catalog</h1>
          <p className="text-slate-500 font-medium">Manage your printing services and pricing</p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); setEditingId(null); setImageFile(null); setFormData({ name: '', description: '', base_price: '', cost_price: '', category: '', unit_type: 'Piece', image_url: '', cost_preset_id: '' }); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Add New Service
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products by name or category..." 
            className="bg-transparent border-none focus:outline-none w-full font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="border border-slate-100 rounded-3xl p-5 hover:border-accent/40 transition-all group relative">
              <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingId(product.id);
                      setFormData(product);
                      setImageFile(null);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-white/90 backdrop-blur rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-white/90 backdrop-blur rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded-md">
                    {product.category || 'General'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    {product.unit_type || 'Piece'}
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800">৳{product.base_price}</p>
              </div>
              <h3 className="text-lg font-black text-slate-800">{product.name}</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">{editingId ? 'Edit Service' : 'Add New Service'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Service Name</label>
                  <input 
                    className="input-field" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Base Price (৳)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.base_price}
                    onChange={e => setFormData({...formData, base_price: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-indigo-400 ml-1">Cost Price (৳) - Factory</label>
                  <input 
                    type="number" 
                    className="input-field border-indigo-100 focus:border-indigo-400" 
                    value={formData.cost_price}
                    onChange={e => setFormData({...formData, cost_price: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-indigo-400 ml-1">Linked Cost Preset (Auto Accounting)</label>
                  <select 
                    className="input-field border-indigo-100 focus:border-indigo-400" 
                    value={formData.cost_preset_id}
                    onChange={e => setFormData({...formData, cost_preset_id: e.target.value})}
                  >
                    <option value="">No Preset linked</option>
                    {presets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (৳{p.amount}/{p.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Unit Type</label>
                  <select 
                    className="input-field" 
                    value={formData.unit_type}
                    onChange={e => setFormData({...formData, unit_type: e.target.value})}
                    required
                  >
                    <option value="Piece">Piece</option>
                    <option value="Set">Set</option>
                    <option value="Square Feet">Square Feet</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                  <input 
                    className="input-field" 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                <textarea 
                  className="input-field h-24 resize-none" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Product Image</label>
                <input 
                  type="file"
                  accept="image/*"
                  className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" 
                  onChange={e => setImageFile(e.target.files[0])}
                />
                {formData.image_url && !imageFile && (
                  <p className="text-xs font-bold text-slate-400 mt-2 px-2">Current image will be kept if no new file is selected.</p>
                )}
              </div>
              <button type="submit" className="w-full btn-primary py-4 mt-4">
                {editingId ? 'Update Service' : 'Add Service'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
