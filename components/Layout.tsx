
import React from 'react';

export const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
    {children}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);
