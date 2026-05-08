import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductsSection = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data.slice(0, 3)); // Only show top 3 on home
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container-custom relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-sm font-black uppercase tracking-widest text-accent mb-4 block">Featured Services</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">Premium Printing for Your Brand.</h2>
          </div>
          <button onClick={() => navigate('/products')} className="text-slate-600 font-bold hover:text-accent flex items-center gap-2 transition-colors">
            View All Services <ArrowRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map(product => (
            <div key={product.id} className="bg-slate-50 rounded-3xl p-4 border border-slate-100 hover:border-accent/20 transition-colors group">
              <div className="w-full h-48 bg-white rounded-2xl mb-5 overflow-hidden relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Package size={48} />
                  </div>
                )}
              </div>
              <div className="px-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-black text-slate-800">{product.name}</h3>
                  <span className="font-black text-accent">৳{product.base_price}</span>
                </div>
                <p className="text-sm font-medium text-slate-500 line-clamp-2 mb-4">{product.description}</p>
                <button 
                  onClick={() => navigate(`/place-order?service=${product.id}`)}
                  className="w-full py-3 bg-white border border-slate-200 hover:border-accent hover:text-accent font-bold rounded-xl transition-all"
                >
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
