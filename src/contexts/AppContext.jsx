import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('ec_theme') || 'dark');
  const [hideValues, setHideValues] = useState(() => localStorage.getItem('ec_hide') === 'true');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ec_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ec_hide', hideValues);
  }, [hideValues]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const toggleHideValues = () => setHideValues(v => !v);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, hideValues, toggleHideValues }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

/** Mascara um valor monetário quando hideValues está ativo */
export function maskBRL(value, hide) {
  if (hide) return 'R$ •••••';
  if (typeof value === 'number') {
    return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
  return value;
}
