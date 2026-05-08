import React from 'react';
import { branding } from '../config/branding';

const Footer = () => {
  return (
    <footer className="w-full bg-bg-secondary border-t border-border-custom mt-auto">
      <div className="max-w-[1126px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-sm">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-extrabold text-text-heading tracking-tight">
              {branding.logoText}<span className="text-accent">{branding.logoAccent}</span>
            </h2>
            <p className="text-text-main leading-relaxed max-w-xs">
              {branding.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-heading mb-6">Quick Links</h3>
            <ul className="space-y-4 font-medium">
              {branding.links.map((link, idx) => (
                <li key={idx}><a href={link.path} className="hover:text-accent transition-colors">{link.name}</a></li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-heading mb-6">Services</h3>
            <ul className="space-y-4 font-medium">
              <li><a href="#" className="hover:text-accent transition-colors">Visiting Cards</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Banners & Posters</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Brochures</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Custom Printing</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-heading mb-6">Contact</h3>
            <ul className="space-y-4 font-medium">
              <li className="flex items-start gap-3">
                <span className="text-accent">📍</span>
                <span>{branding.contact.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-accent">📞</span>
                <span>{branding.contact.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-accent">✉️</span>
                <span>{branding.contact.email}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-border-custom mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold text-text-main/60 uppercase tracking-widest">
          <p>© 2026 {branding.name}. All rights reserved. | Design & Development by <span className="text-accent underline">Artifypix</span></p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-accent">Privacy Policy</a>
            <a href="#" className="hover:text-accent">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;