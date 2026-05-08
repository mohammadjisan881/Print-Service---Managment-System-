import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-20 bg-slate-50 min-h-screen">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Our Printing Services</h1>
          <p className="text-slate-500 font-medium text-lg">Browse our premium printing solutions tailored for your business needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full group">
              <div className="w-full h-56 bg-slate-50 rounded-2xl mb-6 overflow-hidden relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package size={64} />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-black text-slate-800 shadow-sm">
                  ৳{product.base_price}
                </div>
              </div>
              
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-accent mb-2 block">
                  {product.category || 'Service'}
                </span>
                <h3 className="text-xl font-black text-slate-800 mb-3">{product.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 whitespace-pre-line">{product.description}</p>
              </div>

              <button 
                onClick={() => navigate(`/place-order?service=${product.id}`)}
                className="w-full py-3.5 bg-slate-50 hover:bg-accent hover:text-white text-slate-800 font-black rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Order Now <ArrowRight size={18} />
              </button>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold">No services published yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Products;
