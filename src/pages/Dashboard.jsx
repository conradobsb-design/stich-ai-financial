import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, LogOut, Calendar, TrendingUp, TrendingDown, 
  Search, ShieldCheck, Activity, PieChart as PieIcon, 
  ArrowUpRight, ArrowDownRight, Filter, Info, PiggyBank,
  FileText, CreditCard, X, UploadCloud, FolderOpen, Building2,
  AlertTriangle, Shield, Sparkles, Lightbulb, Zap
} from 'lucide-react';

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const CATEGORY_COLORS = {
  'Alimentação': '#38bdf8',
  'Transporte': '#0ea5e9',
  'Saúde': '#818cf8',
  'Moradia': '#a855f7',
  'Lazer': '#10b981',
  'Educação': '#f472b6',
  'Transferência Interna': '#64748b',
  'Investimentos': '#00d2ff',
  'Outros': '#94a3b8'
};

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// === CENTRALIZED CLASSIFICATION SYSTEM ===
const SAVINGS_CATEGORIES = ['Investimentos', 'Poupança', 'Aplicação', 'CDB', 'Tesouro', 'Fundo'];

// Patterns that identify credit card bill payments (these are NOT real expenses —
// the individual items inside the bill are the real expenses).
// NOTE: Generic boleto patterns removed — they would also match utility bills (water, electricity, rent).
// Only patterns that are unambiguously credit card bill payments are listed here.
const BILL_PAYMENT_PATTERNS = [
  'pagamento de fatura',
  'pag fatura',
  'pgto fatura',
  'fatura paga',
  'pagto cartao',
  'pagamento cartao',
  'pag cartão',
  'pgto cartão',
  'pag. fatura',
  'pagto. fatura',
  'pagamento fatura cartao',
  'debito automatico fatura',
  'boleto fatura',       // "boleto fatura" is specific enough — it's a bill boleto
  'pagto. boleto cartao',
  'efetuado (fatura)',   // Sicredi: "Pagamento efetuado (fatura)"
];

// Patterns for internal/personal transfers (not real income or expense)
const INTERNAL_TRANSFER_PATTERNS = [
  'soraya', 'conrado',
];

/**
 * Classifies a single transaction into one of:
 *   - 'savings'      → money sent to investments/savings
 *   - 'billPayment'  → credit card bill payment
 *   - 'neutral'      → internal transfers
 *   - 'income'       → real income
 *   - 'expense'      → real expense
 * 
 * @param {boolean} hasCardItems - If true, bill payments are treated as 'billPayment' (neutral).
 *                                 If false, they are treated as 'expense' (since they are the only record of the cost).
 */
function classifyTransaction(item, hasCardItems = false) {
  const desc = (item.description || '').toLowerCase();
  const cat = (item.category || '');

  // 1) Savings / Cofrinho
  const isSavings = SAVINGS_CATEGORIES.some(s =>
    cat.toLowerCase().includes(s.toLowerCase()) ||
    desc.includes(s.toLowerCase())
  );
  if (isSavings) return 'savings';

  // 2) Bill payment detection
  const isBillPaymentPattern =
    cat === 'Pagamento de Fatura' ||
    BILL_PAYMENT_PATTERNS.some(p => desc.includes(p));

  if (isBillPaymentPattern) {
    // INTELLIGENCE: Only count as neutral 'billPayment' if we have the detail (fatura)
    // Otherwise, treat as an 'expense' because it's the only proof of spending.
    return hasCardItems ? 'billPayment' : 'expense';
  }

  // 3) Internal transfers
  const isInternal =
    cat === 'Transferência Interna' ||
    INTERNAL_TRANSFER_PATTERNS.some(p => desc.includes(p));
  if (isInternal) return 'neutral';

  // 4) Real income or expense
  return item.amount > 0 ? 'income' : 'expense';
}


// Sub-component: Health Gauge
const HealthIndicator = ({ income, expense }) => {
  const ratio = income > 0 ? (expense / income) : (expense > 0 ? 1 : 0);
  const health = Math.max(0, Math.min(100, (1 - ratio) * 100));
  
  let color = "text-success";
  let msg = "Excelente";
  if (ratio > 0.9) { color = "text-error"; msg = "Crítico"; }
  else if (ratio > 0.7) { color = "text-yellow-400"; msg = "Atenção"; }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-container" />
          <motion.circle 
            cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
            className={color}
            strokeDasharray={364}
            initial={{ strokeDashoffset: 364 }}
            animate={{ strokeDashoffset: 364 - (364 * health) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-black">{Math.round(health)}%</span>
          <span className="text-[10px] uppercase font-bold opacity-60">Saúde</span>
        </div>
      </div>
      <p className={`mt-2 font-bold text-sm ${color}`}>{msg}</p>
    </div>
  );
};

export default function Dashboard({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [importModal, setImportModal] = useState(false); // show import type picker
  const [pendingImportType, setPendingImportType] = useState(null); // 'extrato' | 'fatura'

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
          const latestDate = history[0].transaction_date;
          setSelectedMonth(latestDate.substring(0, 7));
        }
      } catch (err) {
        console.warn("Supabase fetch failed:", err.message);
      }
    };
    if (user?.id) fetchHistory();
  }, [user]);

  const handleFileUpload = async (e, importType) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setLoading(true);
    setImportModal(false);
    setPendingImportType(null);

    try {
      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
      let extractedText = "";

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const masterBuffer = await file.arrayBuffer();
        let pdf;
        try {
          pdf = await pdfjsLib.getDocument({ data: masterBuffer.slice(0) }).promise;
        } catch (err) {
          if (err.name === 'PasswordException') {
            const pwd = window.prompt("Digite a senha do PDF:");
            if (!pwd) { setLoading(false); return; }
            pdf = await pdfjsLib.getDocument({ data: masterBuffer.slice(0), password: pwd }).promise;
          } else throw err;
        }
        // Preserva quebras de linha por item — mantém associação data↔transação
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          // Agrupa items por linha usando a coordenada Y (arredondada ao pixel)
          const lines = {};
          content.items.forEach(it => {
            const y = Math.round(it.transform[5]);
            if (!lines[y]) lines[y] = [];
            lines[y].push(it.str);
          });
          // Ordena de cima para baixo (Y maior = mais alto na página)
          const sorted = Object.keys(lines).map(Number).sort((a, b) => b - a);
          sorted.forEach(y => { extractedText += lines[y].join('\t') + '\n'; });
        }
      } else if (isImage) {
        // Imagem: não tenta file.text() (retorna lixo binário).
        // Envia o arquivo diretamente para o n8n — o GPT-4o usa visão para OCR.
        extractedText = '[IMAGE]';
      } else {
        extractedText = await file.text();
      }

      // Monta payload JSON — n8n lê $json.body corretamente com application/json.
      // multipart/form-data não é parseado automaticamente pelo n8n (body ficaria {}).
      const payload = {
        text_data: extractedText,
        user_id: user.id,
        file_name: file.name,
        import_type: importType || 'extrato',
      };

      // Para imagens: converte para base64 para que o n8n possa passar ao GPT-4o (visão)
      if (isImage) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        payload.image_base64 = base64;
        payload.image_mime = file.type;
      }

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      window.location.reload();
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Erro ao processar arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

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

  const availableMonths = useMemo(() => {
    const months = new Set(data.map(item => item.transaction_date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [data]);

  // === CONTEXT INTELLIGENCE ===
  const hasCardItems = useMemo(() => {
    return monthlyData.some(item => item.metadata?.import_type === 'fatura');
  }, [monthlyData]);

  // === AGGREGATES using centralized classifier ===
  const aggregates = useMemo(() => {
    let income = 0, expense = 0, neutral = 0, savings = 0, billPayments = 0;
    monthlyData.forEach(item => {
      const cls = classifyTransaction(item, hasCardItems);
      switch (cls) {
        case 'savings':     savings += Math.abs(item.amount); break;
        case 'billPayment': billPayments += Math.abs(item.amount); break;
        case 'neutral':     neutral += Math.abs(item.amount); break;
        case 'income':      income += item.amount; break;
        case 'expense':     expense += Math.abs(item.amount); break;
      }
    });
    return { income, expense, neutral, savings, billPayments, balance: income - expense };
  }, [monthlyData, hasCardItems]);

  // === DEDUPLICATION AUDIT ===
  const auditAlerts = useMemo(() => {
    const alerts = [];
    const billItems = monthlyData.filter(i => {
      // Logic: Is it a bill payment pattern?
      const desc = (i.description || '').toLowerCase();
      return (i.category === 'Pagamento de Fatura' || BILL_PAYMENT_PATTERNS.some(p => desc.includes(p)));
    });

    if (billItems.length > 0) {
      const totalBill = billItems.reduce((s, i) => s + Math.abs(i.amount), 0);
      if (hasCardItems) {
        alerts.push({
          type: 'info',
          icon: Shield,
          msg: `${billItems.length} pagamento(s) de fatura R$ ${totalBill.toLocaleString('pt-BR')} ignorados. Detalhamento de cartão detectado para evitar duplicidade.`,
        });
      } else {
        alerts.push({
          type: 'warning',
          icon: AlertTriangle,
          msg: `Pagamento total de R$ ${totalBill.toLocaleString('pt-BR')} incluído nas despesas, pois não encontramos o detalhamento desta fatura.`,
        });
      }
    }
    
    return alerts;
  }, [monthlyData, hasCardItems]);

  const topCategories = useMemo(() => {
    const cats = {};
    monthlyData.forEach(item => {
      if (classifyTransaction(item, hasCardItems) === 'expense') {
        cats[item.category] = (cats[item.category] || 0) + Math.abs(item.amount);
      }
    });
    return Object.entries(cats).sort((a,b) => b[1] - a[1]).slice(0, 3);
  }, [monthlyData, hasCardItems]);

  const chartData = useMemo(() => {
    const agg = {};
    monthlyData.forEach(item => {
      if (classifyTransaction(item, hasCardItems) === 'expense') {
        const cat = item.category || 'Outros';
        agg[cat] = (agg[cat] || 0) + Math.abs(item.amount);
      }
    });
    return Object.keys(agg).map(name => ({ name, value: agg[name] }));
  }, [monthlyData, hasCardItems]);

  const formatMonth = (m) => {
    if (!m) return '';
    const [y, mm] = m.split('-');
    return new Date(y, mm - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-32 mesh-bg">
      
      {/* Header Premium */}
      <header className="fixed top-0 w-full z-50 glass border-b border-outline-variant py-4 px-6 flex justify-between items-center transition-all">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
            E
          </motion.div>
          <h1 className="text-xl font-black tracking-tighter text-white">Extrato Co.</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Usuário Premium</span>
            <span className="text-xs font-medium text-white/80">{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-all text-on-surface-variant hover:text-white">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-6xl mx-auto space-y-8">
        
        {/* Intro Section */}
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-white mb-1">
              Dashboard <span className="text-primary">Global</span>
            </h2>
            <p className="text-on-surface-variant font-medium">Controle total dos seus extratos em tempo real.</p>
          </div>
          
          <div className="glass p-1.5 rounded-2xl flex items-center border border-outline-variant shadow-lg group">
            <Calendar className="text-primary ml-3 mr-2 group-hover:scale-110 transition-transform" size={18} />
            <select 
              className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 cursor-pointer pr-10 appearance-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map(m => <option key={m} value={m} className="bg-surface">{formatMonth(m)}</option>)}
            </select>
          </div>
        </motion.section>

        {/* Top Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          
          {/* Main Balance Card (Bento Large) */}
          <motion.div variants={itemVariants} className="md:col-span-8 glass-card p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-primary font-bold tracking-[0.2em] text-[10px] uppercase">
                  <Activity size={12} /> Saldo Líquido do Mês
                </div>
                <div className="text-[4rem] md:text-[5rem] leading-none font-black text-white tracking-tighter text-glow">
                  R$ {aggregates.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex gap-3 mt-12 flex-wrap">
                <div className="flex-1 min-w-[120px] glass p-5 rounded-3xl border-l-4" style={{ borderLeftColor: '#10b981' }}>
                  <div className="flex items-center gap-2 text-success font-bold text-[10px] uppercase mb-1">
                    <ArrowUpRight size={12} /> Entradas
                  </div>
                  <p className="text-xl font-black text-white">R$ {aggregates.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex-1 min-w-[120px] glass p-5 rounded-3xl border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                  <div className="flex items-center gap-2 text-error font-bold text-[10px] uppercase mb-1">
                    <ArrowDownRight size={12} /> Saídas
                  </div>
                  <p className="text-xl font-black text-white">R$ {aggregates.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex-1 min-w-[120px] glass p-5 rounded-3xl border-l-4" style={{ borderLeftColor: '#00d2ff' }}>
                  <div className="flex items-center gap-2 font-bold text-[10px] uppercase mb-1" style={{ color: '#00d2ff' }}>
                    <PiggyBank size={12} /> Cofrinho
                  </div>
                  <p className="text-xl font-black text-white">R$ {aggregates.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[9px] font-bold mt-1" style={{ color: '#00d2ff99' }}>Invest. &amp; Poupança</p>
                </div>
              </div>
            </div>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none group-hover:from-primary/20 transition-all"></div>
          </motion.div>

          {/* New Component: Health Gauge */}
          <motion.div variants={itemVariants} className="md:col-span-4 glass-card rounded-[2.5rem] p-8 flex flex-col border-t border-t-white/10 shadow-2xl">
            <div className="flex flex-col items-center justify-center mb-4">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">Saúde Financeira</h3>
              <HealthIndicator income={aggregates.income} expense={aggregates.expense} />
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-white/10 my-3"></div>

            {/* AI Insights - Premium Reference Style */}
            <div className="mt-2">
              <h3 className="text-xs font-black text-nubank-light flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
                <Sparkles size={14} /> Extrato AI Insights
              </h3>
              <div className="space-y-3">
                {(() => {
                  const insights = [];
                  const { income, expense, savings, billPayments, balance } = aggregates;
                  
                  // Insight 1: Spending vs Income
                  if (expense > income && income > 0) {
                    insights.push({
                      icon: AlertTriangle,
                      color: 'border-l-error bg-error/5',
                      textColor: 'text-error',
                      text: `Seus gastos reais (R$ ${expense.toLocaleString('pt-BR')}) superaram as entradas este mês.`
                    });
                  } else if (income > 0) {
                    insights.push({
                      icon: Shield,
                      color: 'border-l-success bg-success/5',
                      textColor: 'text-success',
                      text: `Saúde financeira estável. Você utilizou ${( (expense/income)*100 ).toFixed(0)}% da sua receita real.`
                    });
                  }

                  // Insight 2: Contextual Intelligence regarding Bills
                  if (billPayments > 0 && hasCardItems) {
                    insights.push({
                      icon: Zap,
                      color: 'border-l-nubank bg-nubank/5',
                      textColor: 'text-nubank-light',
                      text: `Inteligência Auditiva: Detectamos faturas e o detalhamento do cartão. R$ ${billPayments.toLocaleString('pt-BR')} foram deduzidos para evitar duplicidade.`
                    });
                  } else if ( aggregates.billPayments > 0 && !hasCardItems ) {
                    insights.push({
                        icon: Info,
                        color: 'border-l-yellow-400 bg-yellow-400/5',
                        textColor: 'text-yellow-400',
                        text: `Atenção: Como você não importou a fatura, o valor total do boleto está sendo contado como despesa.`
                    });
                  }

                  // Insight 3: Top Category
                  if (topCategories.length > 0) {
                    insights.push({
                      icon: Lightbulb,
                      color: 'border-l-primary bg-primary/5',
                      textColor: 'text-primary',
                      text: `O maior peso no seu orçamento este mês foi '${topCategories[0][0]}'.`
                    });
                  }

                  return insights.map((ins, i) => {
                    const Icon = ins.icon;
                    return (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-l-[3px] bg-white/[0.03] transition-all hover:bg-white/[0.05] shadow-sm ${ins.color}`}
                      >
                        <div className={`p-1.5 rounded-lg ${ins.color} opacity-80 shadow-inner`}>
                          <Icon size={14} />
                        </div>
                        <p className="text-[11px] font-bold leading-snug text-white/90">{ins.text}</p>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* Secondary Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          
          {/* Charts Card */}
          <motion.div variants={itemVariants} className="lg:col-span-7 glass-card p-8 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black text-xl text-white flex items-center gap-2">
                <PieIcon className="text-primary" size={24} /> Resumo por Categoria
              </h3>
              <div className="flex gap-2">
                 {topCategories.map(([name, val], i) => (
                   <span key={i} className="text-[9px] font-bold px-2 py-1 rounded-md bg-white/5 border border-white/10 text-on-surface-variant truncate max-w-[80px]">
                     {name}
                   </span>
                 ))}
              </div>
            </div>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="4" result="offsetblur" />
                        <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={chartData}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#8884d8'} filter="url(#shadow)" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', color: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} 
                      itemStyle={{ color: '#fff' }}
                      formatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Transactions List with Search + Filter */}
          <motion.div variants={itemVariants} className="lg:col-span-5 glass-card p-8 rounded-[2.5rem] flex flex-col">
            {/* Header: Title + Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="font-black text-xl text-white">Transações</h3>
              <div className="relative w-full sm:w-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-primary/50 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter Pills */}
            <div className="flex gap-2 mb-5">
              {[
                { key: 'todos',    label: 'Todos' },
                { key: 'receitas', label: 'Receitas' },
                { key: 'despesas', label: 'Saídas' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
                    typeFilter === key
                      ? key === 'receitas'
                        ? 'bg-success/20 border-success text-success shadow-sm shadow-success/20'
                        : key === 'despesas'
                          ? 'bg-error/20 border-error text-error shadow-sm shadow-error/20'
                          : 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/20'
                      : 'bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {/* Audit Alerts */}
            {auditAlerts.length > 0 && (
              <div className="space-y-2 mb-4">
                {auditAlerts.map((alert, i) => {
                  const Icon = alert.icon;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl text-xs font-bold leading-snug border ${
                      alert.type === 'warning'
                        ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400'
                        : 'bg-nubank/10 border-nubank/20 text-nubank-light'
                    }`}>
                      <Icon size={16} className="shrink-0 mt-0.5" />
                      <span>{alert.msg}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar max-h-[400px]">
              <AnimatePresence>
                {(() => {
                  const visibleItems = monthlyData.filter(item => {
                    const cls = classifyTransaction(item, hasCardItems);
                    if (typeFilter === 'receitas') return cls === 'income';
                    if (typeFilter === 'despesas') return cls === 'expense';
                    return true;
                  });

                  if (visibleItems.length === 0) return (
                    <p className="text-on-surface-variant italic text-sm">Nenhuma transação encontrada.</p>
                  );

                  return visibleItems.map((item, i) => {
                    const cls = classifyTransaction(item, hasCardItems);
                    const isPos = item.amount > 0;
                    const excluded = cls === 'savings' || cls === 'billPayment' || cls === 'neutral';
                    
                    // Logic to see if the item IS a bill payment, even if classified as expense
                    const isBillPattern = 
                        item.category === 'Pagamento de Fatura' || 
                        BILL_PAYMENT_PATTERNS.some(p => (item.description || '').toLowerCase().includes(p));

                    // Visual config per classification
                    const styles = {
                      savings:     { bg: 'bg-cyan-500/20 text-cyan-400', icon: <PiggyBank size={18} />, label: 'Cofrinho', color: 'text-cyan-400' },
                      billPayment: { bg: 'bg-nubank/20 text-nubank-light', icon: <CreditCard size={18} />, label: 'Fatura (Isento)', color: 'text-nubank-light' },
                      neutral:     { bg: 'bg-surface-container-low text-on-surface-variant', icon: <Filter size={18} />, label: 'Isento', color: 'text-on-surface-variant' },
                      income:      { bg: 'bg-success/20 text-success', icon: <ArrowUpRight size={18} />, label: item.category, color: 'text-success' },
                      expense:     { 
                        bg: isBillPattern ? 'bg-yellow-400/20 text-yellow-400' : 'bg-primary/20 text-primary', 
                        icon: isBillPattern ? <CreditCard size={18} /> : <TrendingDown size={18} />, 
                        label: isBillPattern ? 'Fatura Agregada' : item.category, 
                        color: 'text-error' 
                      },
                    }[cls];

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        layout
                        className={`group flex items-start gap-4 p-4 rounded-3xl transition-all border border-transparent hover:border-white/10 ${excluded ? 'bg-white/2 opacity-60' : 'bg-white/5 hover:bg-white/[0.08]'}`}
                      >
                        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${styles.bg}`}>
                          {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white break-words leading-snug group-hover:text-primary transition-colors">{item.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                              cls === 'billPayment' || (cls === 'expense' && isBillPattern)
                                ? 'bg-white/10 border-white/20 text-white/60'
                                : 'bg-white/5 border-white/5 text-on-surface-variant/80'
                            }`}>
                              {styles.label}
                            </span>
                            <span className="text-[9px] font-bold text-primary/60">
                              {[
                                item.bank || 'Banco não identificado',
                                item.metadata?.import_type === 'fatura' ? 'Fatura' : 'Extrato'
                              ].join(' · ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-black text-sm whitespace-nowrap ${styles.color}`}>
                            {isPos ? '+' : ''} R$ {Math.abs(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] font-semibold text-white/50 mt-0.5">
            {item.transaction_date
              ? new Date(item.transaction_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Data não registrada'}
          </p>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </AnimatePresence>
            </div>
          </motion.div>

        </motion.div>

        {/* Imported Files Panel */}
        {(() => {
          const fileGroups = data.reduce((acc, item) => {
            const bank = item.bank || 'Desconhecido';
            const fname = item.metadata?.file_name || item.metadata?.filename || null;
            const itype = item.metadata?.import_type || 'extrato';
            if (!fname) return acc;
            if (!acc[bank]) acc[bank] = {};
            const key = `${fname}::${itype}`;
            if (!acc[bank][key]) acc[bank][key] = { name: fname, type: itype, count: 0 };
            acc[bank][key].count++;
            return acc;
          }, {});
          const banks = Object.keys(fileGroups);
          if (banks.length === 0) return null;
          return (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="pb-4"
            >
              <h3 className="font-black text-lg text-white flex items-center gap-2 mb-4">
                <FolderOpen className="text-primary" size={20} /> Arquivos Importados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {banks.map(bank => (
                  <div key={bank} className="glass-card p-5 rounded-[1.5rem]">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 size={14} className="text-primary" />
                      <span className="font-black text-sm text-white uppercase tracking-widest">{bank}</span>
                    </div>
                    <div className="space-y-2">
                      {Object.values(fileGroups[bank]).map((f, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                          {f.type === 'fatura'
                            ? <CreditCard size={14} className="text-yellow-400 shrink-0" />
                            : <FileText size={14} className="text-primary shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white break-all leading-snug">{f.name}</p>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              f.type === 'fatura' ? 'text-yellow-400' : 'text-primary'
                            }`}>{f.type === 'fatura' ? 'Fatura' : 'Extrato'}</span>
                          </div>
                          <span className="text-[9px] text-on-surface-variant font-bold shrink-0">{f.count} lançamentos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          );
        })()}

      </main>

      {/* Import Type Modal */}
      <AnimatePresence>
        {importModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setImportModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              className="glass-card rounded-[2rem] p-8 w-full max-w-sm relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setImportModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-on-surface-variant transition-all"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <UploadCloud size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-black text-white text-lg leading-none">Importar Arquivo</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Selecione o tipo de documento</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label
                  htmlFor="fileInputExtrato"
                  className="cursor-pointer group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-white/10 hover:border-primary/60 bg-white/5 hover:bg-primary/10 transition-all"
                >
                  <FileText size={28} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-black text-sm text-white text-center leading-tight">Extrato Bancário</span>
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">CSV / PDF / OFX</span>
                  <input
                    id="fileInputExtrato"
                    type="file"
                    accept=".csv,.pdf,.ofx"
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'extrato')}
                  />
                </label>

                <label
                  htmlFor="fileInputFatura"
                  className="cursor-pointer group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-white/10 hover:border-yellow-400/60 bg-white/5 hover:bg-yellow-400/10 transition-all"
                >
                  <CreditCard size={28} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-sm text-white text-center leading-tight">Fatura de Cartão</span>
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">CSV / PDF / OFX</span>
                  <input
                    id="fileInputFatura"
                    type="file"
                    accept=".csv,.pdf,.ofx"
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'fatura')}
                  />
                </label>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QuickActionsBar (Fixed Bottom Glass) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="glass p-2 rounded-full border border-white/10 shadow-3xl flex items-center gap-2"
        >
          <button 
            onClick={() => setImportModal(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {loading
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processando...</>
              : <><Plus size={18} /> Importar Arquivo</>}
          </button>
          
          <div className="h-8 w-[1px] bg-white/10 mx-1"></div>
          
          <div className="flex gap-1 pr-1">
            <button className="p-3 rounded-full text-on-surface-variant hover:text-white hover:bg-white/5 transition-all text-[12px] font-bold flex items-center gap-2">
               <Info size={16} /> <span className="hidden sm:inline">Ajuda IA</span>
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
