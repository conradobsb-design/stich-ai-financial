import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { 
  Upload, PieChart as ChartIcon, TrendingUp, 
  AlertTriangle, CheckCircle, Info, DollarSign, Database, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  'Alimentação': '#9d50bb',
  'Transporte': '#6e48aa',
  'Saúde': '#00f2fe',
  'Moradia': '#00d2ff',
  'Lazer': '#ffab00',
  'Educação': '#ff4757',
  'Investimentos': '#05ffa1',
  'Outros': '#6b7280'
};

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const BUDGET_LIMIT = 25000;

import * as pdfjsLib from 'pdfjs-dist';

// Configurando o worker do PDF.js resolvido pela URL graças ao Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function Dashboard({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch data from Supabase on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // RLS will automatically filter by user_id, but we add an explicit .eq just in case
        const { data: history, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false });

        if (error) throw error;
        if (history) {
          setData(history);
          setIsSupabaseConnected(true);
          const total = history.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
          setTotalSpent(total);
        }
      } catch (err) {
        console.warn("Supabase fetch failed:", err.message);
      }
    };
    if (user?.id) fetchHistory();
  }, [user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    try {
      let extractedText = "";

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map(item => item.str).join(' ') + '\n';
        }
      } else {
        // Ler OFX ou CSV maravilhosamente
        extractedText = await file.text();
      }

      // Envia o TEXTO escancarado para o N8N, e não um arquivo binário pesado
      const formData = new FormData();
      formData.append('text_data', extractedText);
      formData.append('user_id', user.id);

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });
      // Refresh after Webhook is fully processed
      window.location.reload(); 
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Erro ao processar extrato. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getAggregatedData = () => {
    const agg = {};
    data.forEach(item => {
      const category = item.category || 'Outros';
      agg[category] = (agg[category] || 0) + Math.abs(item.amount);
    });
    return Object.keys(agg).map(name => ({ name, value: agg[name] }));
  };

  const budgetUsage = (totalSpent / BUDGET_LIMIT) * 100;

  return (
    <div className="stich-container">
      <header style={{ marginBottom: '3rem', textAlign: 'center', position: 'relative' }}>
        <button 
          onClick={handleLogout}
          style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <LogOut size={16} /> Sair
        </button>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}
        >
          STICH AI
        </motion.h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
          Gestão Financeira Inteligente ({user?.email})
        </p>
        {isSupabaseConnected && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 15px', borderRadius: '20px', background: 'rgba(5, 255, 161, 0.1)', color: '#05ffa1', fontSize: '0.8rem', marginTop: '1rem' }}>
            <Database size={14} /> Dados Privados & Seguros via RLS
          </div>
        )}
      </header>

      {/* Upload Zone */}
      <motion.div 
        className="glass-card"
        style={{ maxWidth: '600px', margin: '0 auto 3rem auto', textAlign: 'center' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="upload-zone" onClick={() => document.getElementById('fileInput').click()}>
          {loading ? (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }}
            />
          ) : (
            <Upload size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          )}
          <h2>{loading ? 'Processando...' : 'Novo Upload Gradual'}</h2>
          <p>Selecione um arquivo CSV, PDF ou OFX para adicionar ao seu histórico de 5 anos.</p>
          <input 
            id="fileInput" 
            type="file" 
            accept=".csv, .pdf, .ofx" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
          />
        </div>
      </motion.div>

      {data.length > 0 && !loading && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="dashboard-content"
          >
            <div className="dashboard-grid">
              {/* Resumo Card */}
              <div className="glass-card">
                <h3>Gastos Totais (Histórico Pessoal)</h3>
                <div className="stat-value">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem' }}>Meta Geral: R$ {BUDGET_LIMIT.toLocaleString()}</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetUsage / 12, 100)}%` }} // Simplified for annual comparison
                      style={{ 
                        height: '100%', 
                        background: 'linear-gradient(to right, var(--accent), var(--primary))' 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="glass-card">
                <h3>Tamanho da sua Base</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <Database size={40} color="#05ffa1" />
                  <div>
                    <h4 style={{ margin: 0 }}>Histórico Consolidado</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Você possui {data.length} transações na sua conta.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.5fr)' }}>
              {/* Categories Chart */}
              <div className="glass-card">
                <h3>Insights por Categoria</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getAggregatedData()}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getAggregatedData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} 
                        formatter={(val) => `R$ ${val.toLocaleString()}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Insights Card */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <TrendingUp size={24} style={{ color: 'var(--accent)' }} />
                  <h3>Visão Geral Estratégica (Privada)</h3>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ lineHeight: '1.6', fontSize: '1.1rem', fontStyle: 'italic' }}>
                    O Stich AI Agent está analisando seu histórico privado, isolado via RLS, para identificar padrões únicos do seu comportamento financeiro!
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="glass-card" style={{ marginTop: '2rem' }}>
              <h3>Todas as Suas Transações</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '1rem' }}>Data</th>
                      <th style={{ padding: '1rem' }}>Descrição</th>
                      <th style={{ padding: '1rem' }}>Categoria</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 50).map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.6)' }}>{new Date(item.transaction_date).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.description}</td>
                        <td style={{ padding: '1rem' }}>
                          <span className="badge" style={{ background: `${CATEGORY_COLORS[item.category] || '#333'}33`, color: CATEGORY_COLORS[item.category] || '#999' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: item.amount < 0 ? '#ff4757' : '#00f2fe' }}>
                          R$ {Math.abs(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
