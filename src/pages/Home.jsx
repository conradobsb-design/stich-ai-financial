import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export default function Home() {
  useSEO({
    title: 'Extrato Co. — Painel Financeiro Corporativo',
    description: 'Importe extratos bancários e visualize tudo em um painel limpo, compartilhável e seguro. Sem planilhas.',
    canonical: 'https://stich-ai-financial.vercel.app',
  });
  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16 }}>Extrato Co.</h1>
      <p style={{ fontSize: 20, opacity: 0.6, marginBottom: 32 }}>Painel financeiro corporativo.</p>
      <Link to="/login" style={{ background: 'white', color: '#020617', padding: '12px 28px', borderRadius: 9999, fontWeight: 700, textDecoration: 'none' }}>
        Entrar
      </Link>
    </div>
  );
}
