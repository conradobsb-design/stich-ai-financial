import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  'Alimentação': '#003366',
  'Transporte': '#001e40',
  'Saúde': '#a7c8ff',
  'Moradia': '#82f5c1',
  'Lazer': '#006c4a',
  'Educação': '#ffb2b9',
  'Transferência Interna': '#737780',
  'Investimentos': '#00d2ff',
  'Outros': '#c3c6d1'
};

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function Dashboard({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const navigate = useNavigate();

  // Mês selecionado no formato "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: history, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false });

        if (error) throw error;
        if (history && history.length > 0) {
          setData(history);
          setIsSupabaseConnected(true);
          
          // Separa o mês mais recente para ser o padrão
          const latestDate = history[0].transaction_date;
          const monthKey = latestDate.substring(0, 7); // YYYY-MM
          setSelectedMonth(monthKey);
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
        const fileUrl = URL.createObjectURL(file);
        let pdf;
        try {
          pdf = await pdfjsLib.getDocument({ url: fileUrl }).promise;
        } catch (err) {
          if (err.name === 'PasswordException') {
             const pwd = window.prompt("Este extrato PDF está protegido por senha (comum em bancos). Digite a senha para desbloquear a leitura:");
             if (!pwd) {
               setLoading(false);
               URL.revokeObjectURL(fileUrl);
               return; 
             }
             pdf = await pdfjsLib.getDocument({ url: fileUrl, password: pwd }).promise;
          } else {
            URL.revokeObjectURL(fileUrl);
            throw err; 
          }
        }

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map(item => item.str).join(' ') + '\n';
        }
        URL.revokeObjectURL(fileUrl);
      } else {
        extractedText = await file.text();
      }

      const formData = new FormData();
      formData.append('text_data', extractedText);
      formData.append('user_id', user.id);

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });
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

  // Calcula os dados do mês atual
  const monthlyData = useMemo(() => {
    if (!selectedMonth) return [];
    let filtered = data.filter(item => item.transaction_date.startsWith(selectedMonth));
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.description && item.description.toLowerCase().includes(lower)) ||
        (item.category && item.category.toLowerCase().includes(lower)) ||
        (item.bank && item.bank.toLowerCase().includes(lower))
      );
    }
    return filtered;
  }, [data, selectedMonth, searchTerm]);

  // Extrai lista de meses disponíveis
  const availableMonths = useMemo(() => {
    const months = new Set(data.map(item => item.transaction_date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [data]);

  // Agregações do mês
  const aggregates = useMemo(() => {
    let income = 0;
    let expense = 0;
    let neutralMovement = 0;

    monthlyData.forEach(item => {
      // Regra visual para ignorar transferencias internas nos totais
      const isNeutral = item.category === 'Transferência Interna' 
        || item.category === 'Investimentos' 
        || item.category === 'Pagamento de Fatura'
        || item.description?.toLowerCase().includes('soraya') 
        || item.description?.toLowerCase().includes('conrado');

      if (isNeutral) {
        neutralMovement += Math.abs(item.amount);
      } else {
        if (item.amount > 0) income += item.amount;
        if (item.amount < 0) expense += Math.abs(item.amount);
      }
    });

    return { income, expense, neutralMovement, balance: income - expense };
  }, [monthlyData]);

  // IA MOCK Insights based on current month math
  const aiInsights = useMemo(() => {
    const insights = [];
    if (aggregates.expense > aggregates.income) {
      insights.push("Alerta: Seus gastos neste mês estão superiores às entradas reais.");
    } else if (aggregates.income > 0) {
      insights.push("Bom trabalho! Você está operando no verde neste mês.");
    }
    
    // Most expensive category
    const cats = {};
    monthlyData.forEach(t => {
      const isNeutral = t.category === 'Transferência Interna' || t.category === 'Investimentos' || t.category === 'Pagamento de Fatura';
      if(t.amount < 0 && !isNeutral) cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
    });
    const biggestCat = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
    
    if (biggestCat) {
      insights.push(`IA Analítica: A categoria que mais consumiu recursos foi '${biggestCat[0]}' (R$ ${biggestCat[1].toFixed(2)}).`);
    }

    if (aggregates.neutralMovement > 0) {
      insights.push(`Otimização: Detectamos R$ ${aggregates.neutralMovement.toFixed(2)} em movimentações isentas (Faturas, Investimentos ou Internas) não deduzidas das métricas brutas.`);
    }

    return insights;
  }, [aggregates, monthlyData]);

  const getChartData = () => {
    const agg = {};
    monthlyData.forEach(item => {
      const isNeutral = item.category === 'Transferência Interna' || item.category === 'Investimentos' || item.category === 'Pagamento de Fatura';
      if (item.amount < 0 && !isNeutral) {
        const category = item.category || 'Outros';
        agg[category] = (agg[category] || 0) + Math.abs(item.amount);
      }
    });
    return Object.keys(agg).map(name => ({ name, value: agg[name] }));
  };

  const formatMonth = (yyyy_mm) => {
    if (!yyyy_mm) return '';
    const [year, month] = yyyy_mm.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-[#001e40] font-['Inter']">Extrato Co.</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-[#e0e3e5] transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined text-[#001e40]" data-icon="logout">logout</span>
          </button>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-5xl mx-auto space-y-8">
        
        {/* Controle Mensal & Boas vindas */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-on-surface-variant font-medium tracking-wide uppercase text-[12px] mb-2">Visão Geral Financeira</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-primary">Olá, {user?.email?.split('@')[0]}</h2>
          </div>
          
          <div className="bg-surface-container-low rounded-2xl p-2 flex items-center shadow-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary ml-2 mr-2" data-icon="calendar_month">calendar_month</span>
            <select 
              className="bg-transparent border-none text-primary font-bold focus:ring-0 cursor-pointer pr-8"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="" disabled>Selecione um mês</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonth(m)}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Upload Button */}
        <section>
          <div 
            onClick={() => document.getElementById('fileInput').click()}
            className="w-full bg-secondary-container/30 hover:bg-secondary-container/50 border-2 border-dashed border-secondary rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 active:scale-[0.98]"
          >
            {loading ? (
               <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-secondary"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-secondary mb-2" data-icon="upload_file">upload_file</span>
                <p className="font-bold text-secondary text-lg">Importar Novo Extrato (PDF/CSV/OFX)</p>
                <p className="text-sm text-secondary/70">Arraste aqui ou clique para atualizar seu banco de dados</p>
              </>
            )}
             <input id="fileInput" type="file" accept=".csv, .pdf, .ofx" style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>
        </section>

        {/* Main Ledger Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Total Balance Card (Bento Large) */}
          <div className="md:col-span-8 bg-gradient-to-br from-primary to-primary-container p-8 rounded-[2rem] text-white flex flex-col justify-between min-h-[320px] relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <span className="label-md uppercase tracking-[0.1em] text-primary-fixed-dim font-semibold">Saldo Líquido do Mês</span>
              <div className="text-[3.5rem] leading-none font-extrabold tracking-tight mt-4">
                R$ {aggregates.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            {/* Simple Geometric Graphic Bleed */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex justify-between items-end mt-8">
              <div className="flex gap-4">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
                  <p className="text-[10px] uppercase opacity-70 mb-1">Receitas</p>
                  <p className="font-bold text-secondary-fixed">+ R$ {aggregates.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
                  <p className="text-[10px] uppercase opacity-70 mb-1">Despesas</p>
                  <p className="font-bold text-tertiary-fixed-dim">- R$ {aggregates.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-5xl opacity-30" data-icon="account_balance_wallet">account_balance_wallet</span>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="md:col-span-4 bg-surface-container-lowest p-6 rounded-[2rem] flex flex-col border border-outline-variant/30 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg tracking-tight text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary" data-icon="auto_awesome">auto_awesome</span>
                Extrato AI Insights
              </h3>
            </div>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {aiInsights.length === 0 ? (
                <p className="text-sm text-outline italic">Importe extratos para obter dados inteligentes.</p>
              ) : (
                aiInsights.map((insight, idx) => (
                  <div key={idx} className="bg-surface p-4 rounded-xl border-l-4 border-secondary text-sm font-medium text-on-surface-variant">
                    {insight}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Charts & Spending Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 bg-surface-container-lowest p-8 rounded-[2rem] shadow-md border border-outline-variant/30">
            <h3 className="font-bold text-xl tracking-tight mb-8">Despesas por Categoria</h3>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getChartData()}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', border: '1px solid #e0e3e5', borderRadius: '1rem', color: '#001e40', fontWeight: 'bold' }} 
                      formatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
            </div>
          </div>

          <div className="md:col-span-6 bg-surface-container-lowest p-8 rounded-[2rem] shadow-md border border-outline-variant/30 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="font-bold text-xl tracking-tight leading-loose w-1/2">Transações de {formatMonth(selectedMonth)}</h3>
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" data-icon="search">search</span>
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-low py-2 pl-9 pr-3 rounded-full text-sm border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-on-surface-variant"
                />
              </div>
            </div>
             <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 max-h-[300px]">
                {monthlyData.length === 0 ? (
                  <p className="text-on-surface-variant italic">Nenhuma transação encontrada neste período.</p>
                ) : (
                  monthlyData.map((item, i) => {
                    const isNeutral = item.category === 'Transferência Interna' 
                      || item.category === 'Investimentos' 
                      || item.category === 'Pagamento de Fatura'
                      || item.description?.toLowerCase().includes('soraya') 
                      || item.description?.toLowerCase().includes('conrado');
                      
                    const isPositive = item.amount > 0;
                    return (
                      <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${isNeutral ? 'bg-surface opacity-70' : 'bg-surface'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isNeutral ? 'bg-surface-dim text-on-surface-variant' : (isPositive ? 'bg-secondary-container text-secondary' : 'bg-primary-fixed text-primary')}`}>
                          <span className="material-symbols-outlined">
                            {isNeutral ? 'sync_alt' : (isPositive ? 'arrow_downward' : 'shopping_bag')}
                          </span>
                        </div>
                        <div className="flex-1 truncate">
                          <p className="font-bold text-sm truncate" title={item.description}>{item.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-on-surface-variant font-medium bg-surface-dim px-2 py-0.5 rounded-md">{isNeutral ? 'Isento' : item.category}</span>
                            <span className="text-[10px] text-primary/70 font-bold uppercase border border-primary/20 bg-primary/5 px-1.5 py-0.5 rounded-sm truncate max-w-[120px]" title={item.bank}>{item.bank || 'Desconhecido'}</span>
                          </div>
                        </div>
                        <p className={`font-bold text-sm whitespace-nowrap ${isNeutral ? 'text-on-surface-variant' : (isPositive ? 'text-secondary' : 'text-error')}`}>
                          {isPositive ? '+' : ''} R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )
                  })
                )}
             </div>
          </div>
        </div>

      </main>

    </div>
  );
}
