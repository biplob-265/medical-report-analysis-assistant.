
import React from 'react';
import { Language } from '../types';
import { UI_STRINGS } from '../constants';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
}

const Header: React.FC<HeaderProps> = ({ lang, onToggleLang }) => {
  const s = UI_STRINGS[lang];
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{s.title}</h1>
          <p className="text-sm text-slate-500 font-medium">{s.subtitle}</p>
        </div>
      </div>
      <button 
        onClick={onToggleLang}
        className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors border border-blue-100"
      >
        {s.language}
      </button>
    </header>
  );
};

export default Header;
