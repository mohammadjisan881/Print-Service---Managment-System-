import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { branding } from '../config/branding';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border-custom px-4 lg:px-0">
      <div className="max-w-[1126px] mx-auto h-20 flex justify-between items-center">
        
        {/* Logo */}
        <div className="text-2xl font-heading font-extrabold text-text-heading tracking-tight">
          {branding.logoText}<span className="text-accent underline decoration-accent/20 decoration-4 underline-offset-4">{branding.logoAccent}</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex gap-10 items-center font-semibold text-sm">
          {branding.links.map((link, idx) => (
            <a key={idx} href={link.path} className="hover:text-accent transition-colors">
              {link.name}
            </a>
          ))}
          <button onClick={() => navigate('/place-order')} className="bg-accent text-white px-7 py-3 rounded-xl font-bold shadow-premium hover:shadow-hover hover:-translate-y-0.5 transition-all">
            Order Now
          </button>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-2xl text-text-heading focus:outline-none">
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-border-custom flex flex-col items-center gap-6 py-10 animate-in slide-in-from-top duration-300">
          {branding.links.map((link, idx) => (
            <a key={idx} href={link.path} onClick={() => setIsOpen(false)} className="text-lg font-bold">
              {link.name}
            </a>
          ))}
          <button onClick={() => { setIsOpen(false); navigate('/place-order'); }} className="bg-accent text-white px-8 py-3 rounded-xl w-[85%] font-bold">Order Now</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;