import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../contexts/AppContext.jsx';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useApp();
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      className={`p-2 rounded-xl border transition-all duration-200 ${
        theme === 'dark'
          ? 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          : 'border-black/10 bg-black/5 text-slate-500 hover:text-slate-900 hover:bg-black/10'
      } ${className}`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
