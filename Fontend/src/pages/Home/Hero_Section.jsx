import React from 'react'
import { branding } from '../../config/branding'

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-bg-site py-24 lg:py-40 bg-gradient-premium">
      {/* Abstract Shapes for Premium Feel */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent opacity-[0.03] rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-48 w-full h-1/2 bg-accent opacity-[0.02] -rotate-12 blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10 text-center">
        <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-accent/5 border border-accent/10 text-accent text-xs font-bold uppercase tracking-widest animate-fade-in">
          Premium Printing Solutions
        </div>

        <h1 className="text-5xl lg:text-8xl font-heading font-extrabold text-text-heading leading-[1.1] mb-8 tracking-tight">
          Crafting Your <br /> 
          <span className="text-accent relative inline-block">
             Brand Identity
             <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent/20" viewBox="0 0 100 10" preserveAspectRatio="none">
               <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
             </svg>
          </span>
        </h1>
        
        <p className="text-lg lg:text-xl text-text-main max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
           {branding.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button className="bg-accent text-white px-10 py-5 rounded-2xl font-bold shadow-premium hover:shadow-hover hover:-translate-y-1 active:scale-95 transition-all text-lg min-w-[200px]">
            Explore Services
          </button>
          <button className="bg-white border-2 border-border-custom text-text-heading px-10 py-5 rounded-2xl font-bold hover:bg-border-custom hover:-translate-y-1 active:scale-95 transition-all text-lg min-w-[200px]">
            Talk to Experts
          </button>
        </div>

        <div className="mt-28">
           <p className="text-xs font-bold text-text-main/40 uppercase tracking-[0.3em] mb-8">Trusted by industry leaders</p>
           <div className="flex flex-wrap justify-center gap-12 lg:gap-20 opacity-30 invert dark:invert-0 grayscale">
              {/* These would be client logos in a real app */}
              <span className="text-xl font-black italic">PROPRINT</span>
              <span className="text-xl font-black italic">ARTIFY</span>
              <span className="text-xl font-black italic">PIXELPRESS</span>
              <span className="text-xl font-black italic">CREATIVE</span>
           </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
