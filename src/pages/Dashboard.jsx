import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Pie, Cell, Sector, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  Plus, LogOut, Calendar, TrendingUp, TrendingDown,
  Search, ShieldCheck, Activity, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight, Info, PiggyBank,
  FileText, CreditCard, FolderOpen, Building2,
  AlertTriangle, Shield, Sparkles, Lightbulb, Zap,
  Users, UserPlus, Copy, Check, X, Mail, Link,
  Eye, EyeOff, Sun, Moon,
  MessageSquare, Send, Bot, ChevronDown, Landmark,
  SlidersHorizontal, ArrowUp, ArrowDown, Upload,
  CheckCircle, Archive, Clock
} from 'lucide-react';
import { useApp, maskBRL } from '../contexts/AppContext.jsx';
import { useSEO } from '../hooks/useSEO';
import { useSubscription } from '../hooks/useSubscription';
import FeatureGate from '../components/FeatureGate';
import { PluggyConnect } from 'react-pluggy-connect';

import * as pdfjsLib from 'pdfjs-dist';
// Carrega worker via CDN para evitar erro de MIME type do nginx com .mjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const CATEGORY_COLORS = {
  'Alimentação':           '#f97316', // laranja
  'Transporte':            '#3b82f6', // azul
  'Saúde':                 '#ec4899', // rosa
  'Moradia':               '#f59e0b', // âmbar
  'Lazer':                 '#84cc16', // verde-limão
  'Lazer & Entretenimento':'#84cc16', // verde-limão
  'Educação':              '#8b5cf6', // violeta
  'Transferência Interna': '#64748b', // cinza-ardósia
  'Investimentos':         '#06b6d4', // ciano
  'Telecomunicações':      '#6366f1', // índigo
  'Cartão de Crédito':     '#a855f7', // roxo
  'Impostos & Encargos':   '#ef4444', // vermelho
  'Viagem & Hospedagem':   '#14b8a6', // teal
  'Vestuário':             '#f472b6', // rosa-claro
  'Pet':                   '#10b981', // esmeralda
  'Assinaturas':           '#eab308', // amarelo
  'Serviços Financeiros':  '#0ea5e9', // azul-céu
  'Poupança':              '#22d3ee', // ciano-claro
  'Casa & Utilidades':     '#a78bfa', // violeta-claro
  'Seguros':               '#fb923c', // laranja-claro
  'Salário & Receitas':    '#34d399', // esmeralda
  'Assinaturas & SaaS':    '#fbbf24', // âmbar
  'Outros':                '#94a3b8', // cinza
};

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const CHAT_URL = import.meta.env.VITE_N8N_CHAT_URL;

// === SMART AUTO-CATEGORIZATION ===
const CATEGORY_RULES = [
  { cat: 'Investimentos',        keywords: ['cdb', 'tesouro', 'fundo', 'aplicação', 'aplicacao', 'poupança', 'poupanca', 'resgate', 'rendimento', 'remuner', 'renda fixa', 'lci', 'lca', 'debenture', 'debênture', 'ações', 'acoes', 'btc', 'cripto', 'xp invest', 'rico invest', 'clear invest', 'modal invest', 'inter invest', 'nuinvest'] },
  { cat: 'Moradia',              keywords: ['condomin', 'aluguel', 'iptu', 'água', 'agua', 'gás', 'gas', 'enel', 'cemig', 'copel', 'sabesp', 'sanepar', 'luz ', 'energia', 'mediterran', 'administradora', 'taxa condominial', 'neoenergia', 'equatorial', 'celpe', 'coelba', 'cosern'] },
  { cat: 'Telecomunicações',     keywords: ['telefonica', 'vivo', 'claro', 'tim ', 'oi ', 'net ', 'internet', 'nextel', 'telecom', 'sky ', 'starlink', 'banda larga', 'fibra', 'plano cel', 'recarga'] },
  { cat: 'Cartão de Crédito',    keywords: ['fatura cartao', 'fatura cartão', 'pagamento cartao', 'pagamento cartão', 'lancamento cartao', 'lançamento cartão', 'bce', 'pgto cartao', 'pgto fatura', 'debito fatura', 'pagamento de fatura'] },
  { cat: 'Impostos & Encargos',  keywords: ['e-social', 'esocial', 'daed', 'darf', 'iof', 'imposto', 'inss', 'fgts', 'pgfn', 'simples', 'nf-e', 'nota fiscal', 'irrf', 'irpf', 'cofins', 'pis/', 'csll', 'iss ', 'icms', 'taxa federal', 'receita federal', 'prefeitura', 'municipio', 'multa '] },
  { cat: 'Saúde',                keywords: ['farmacia', 'farmácia', 'drogaria', 'drogasil', 'droga', 'hospital', 'clinica', 'clínica', 'policlinica', 'policlínica', 'médico', 'medico', 'plano saude', 'plano saúde', 'unimed', 'amil', 'bradesco saude', 'hapvida', 'notredame', 'sulamerica saude', 'odonto', 'dentista', 'laboratorio', 'laboratório', 'exame', 'consulta', 'psicolog', 'terapia', 'fisioter', 'aviva'] },
  { cat: 'Educação',             keywords: ['escola', 'faculdade', 'universidade', 'mensalidade', 'colégio', 'colegio', 'colgio', 'educac', 'curso', 'treinamento', 'capacitacao', 'capacitação', 'alura', 'udemy', 'coursera', 'duolingo', 'material escolar', 'livro', 'livraria', 'lyrs'] },
  { cat: 'Viagem & Hospedagem',  keywords: ['hotel', 'hilton', 'marriott', 'airbnb', 'booking', 'passagem', 'aeroporto', 'companhia aerea', 'latam air', 'gol ', 'azul ', 'decolar', 'hurb', 'hostel', 'resort', 'pousada', 'trivago', 'hotels.com', 'localiza', 'movida', 'unidas aluguel', 'daara', 'mar de sonhos', 'dufry'] },
  { cat: 'Alimentação',          keywords: ['ifood', 'rappi', 'uber eats', 'restaurante', 'restaurant', 'padaria', 'mercado', 'supermercado', 'lanchonete', 'delivery', 'açougue', 'acougue', 'acougues', 'hortifruti', 'sacolao', 'sacolão', 'pão de açúcar', 'carrefour', 'extra ', 'walmart', 'atacadão', 'atacadao', 'sams club', 'costco', 'pizza', 'hamburguer', 'burguer', 'sushi', 'churrascaria', 'churr', 'cafe', 'café', 'alimentos', 'gastro', 'gourmet', 'loja onlin', 'mantiqueira', 'spicy', 'marajoara', 'paes e doces', 'pães e doces', 'cbx', 'rodosnack', 'badaue', 'zig mona', 'jim.com', 't bone', 'hikari', 'pumila', 'rancho', 'tadeufelix', 'lanchonete'] },
  { cat: 'Transporte',           keywords: ['uber ', 'cabify', '99 ', 'taxi', 'estacion', 'combustivel', 'combustível', 'posto ', 'pedágio', 'pedagio', 'detran', 'ipva', 'metrô', 'metro ', 'ônibus', 'onibus', 'bilhete unico', 'bilhete único', 'bom bilhete', 'dpvat', 'licenciamento', 'denatran', 'recarga transporte', 'car wash'] },
  { cat: 'Lazer & Entretenimento', keywords: ['cinema', 'teatro', 'show', 'ingresso', 'ticketmaster', 'sympla', 'eventbrite', 'parque', 'museu', 'clube ', 'academia', 'gym', 'smartfit', 'bluefit', 'bodytech', 'jogo', 'steam', 'playstation', 'xbox', 'nintendo', 'inplay', 'iguasport', 'sport', 'operetta'] },
  { cat: 'Seguros',              keywords: ['seguro', 'sulamerica', 'porto seguro', 'bradesco seguro', 'allianz', 'tokio marine', 'mapfre', 'sompo', 'zurich', 'axa ', 'caixa seguro', 'bb seguro', 'seguro vida', 'seguro auto', 'seguro resid'] },
  { cat: 'Serviços Financeiros', keywords: ['itau unibanco', 'itaú unibanco', 'boleto', 'ted enviada', 'doc enviado', 'sicredi', 'sicoob', 'bradesco', 'santander', 'nu pagamentos', 'btg pactual', 'banco inter', 'caixa economica', 'banco do brasil', 'tarifa', 'taxa bancaria', 'iof ', 'spread', 'juros ', 'emprestimo', 'empréstimo', 'financiamento', 'parcela '] },
  { cat: 'Transferência Interna', keywords: ['pix enviado', 'pix recebido', 'transferencia', 'transferência', 'ted ', 'doc ', 'entre contas', 'portabilidade'] },
  { cat: 'Salário & Receitas',   keywords: ['salario', 'salário', 'vencimento', 'remuneracao', 'remuneração', 'prolabore', 'pro-labore', 'honorarios', 'honorários', 'comissao', 'comissão', 'pagamento recebido', 'recebimento', '13o', '13°', 'ferias', 'férias', 'rescisao', 'rescisão'] },
  { cat: 'Assinaturas & SaaS',   keywords: ['netflix', 'spotify', 'amazon prime', 'google one', 'microsoft', 'adobe', 'apple', 'applecombill', 'select plus', 'assinatura', 'hbo', 'disney', 'paramount', 'globoplay', 'deezer', 'youtube premium', 'dropbox', 'icloud', 'red feather', 'kiwify', 'runninghub', 'heygen', 'clube latam', 'latam pass', 'anuidade'] },
  { cat: 'Casa & Utilidades',    keywords: ['casas bahia', 'magazine luiza', 'americanas', 'shoptime', 'leroy merlin', 'tramontina', 'tok&stok', 'mobly', 'moveis', 'móveis', 'magic box', 'eletrodomestico', 'eletrodoméstico', 'reforma', 'decoracao', 'decoração', 'materiais construcao', 'flora', 'flores', 'floricultura', 'mega flora', 'chacara', 'chácaras', 'bucalo', 'estok'] },
];

// User-specific rules loaded from DB — updated by Dashboard on mount
let _userCategoryRules = [];

function smartCategory(item) {
  const desc = (item.description || '').toLowerCase();
  // User rules take priority over everything
  for (const rule of _userCategoryRules) {
    if (desc.includes(rule.keyword.toLowerCase())) return rule.category;
  }
  const stored = (item.category || '').trim();
  if (stored && stored !== 'Outros' && stored !== 'outros') return stored;
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => desc.includes(k))) return rule.cat;
  }
  return stored || 'Outros';
}

// Extrai o mês de faturamento (YYYY-MM) do nome do arquivo de fatura de cartão.
// Ex: "Sicredi_Fatura_01_26.pdf" → "2026-01"
function getBillingMonth(item) {
  if (item.source_type !== 'credit_card') return null;
  const bank = (item.bank || '').replace(/\s/g, '');
  let m = bank.match(/_(\d{2})_(\d{2})\.pdf$/i);
  if (m) return `20${m[2]}-${m[1]}`;
  m = bank.match(/_(\d{2})_(\d{4})\.pdf$/i);
  if (m) return `${m[2]}-${m[1]}`;
  return null;
}

function getEffectiveBillingMonth(item) {
  if (item.billing_month) return item.billing_month;
  if (item.metadata?.billingMonth) return item.metadata.billingMonth;
  return getBillingMonth(item) || item.transaction_date?.substring(0, 7);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Data não registrada';
  // transaction_date vem como "2026-02-05T00:00:00+00:00" — extrai só a parte da data
  const datePart = dateStr.slice(0, 10);
  const [y, m, d] = datePart.split('-');
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

// === CENTRALIZED CLASSIFICATION SYSTEM ===
const SAVINGS_CATEGORIES = ['Investimentos', 'Poupança', 'Aplicação', 'CDB', 'Tesouro', 'Fundo', 'Rendimentos'];

function classifyTransaction(item) {
  // Manual override wins (set when user edits modality)
  if (item.metadata?.modality_override) return item.metadata.modality_override;

  const desc = (item.description || '').toLowerCase();
  const cat = smartCategory(item);

  const isSavings = SAVINGS_CATEGORIES.some(s =>
    cat.toLowerCase().includes(s.toLowerCase()) ||
    desc.includes(s.toLowerCase())
  );
  if (isSavings && item.amount < 0) return 'savings_out'; // aplicação
  if (isSavings && item.amount > 0) return 'savings_in';  // resgate

  return item.amount > 0 ? 'income' : 'expense';
}

const MODALITY_LABELS = {
  income:      'Entrada',
  expense:     'Saída',
  savings_out: 'Aplicação',
  savings_in:  'Resgate',
};
const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS).filter(c => c !== 'Outros');

// Modal para editar modalidade + categoria de uma transação
const EditTransactionModal = ({ item, onClose, onSave }) => {
  const currentModality = classifyTransaction(item);
  const currentCat = smartCategory(item);

  const [modality, setModality] = React.useState(currentModality);
  const [category, setCategory] = React.useState(currentCat);
  const [customCategory, setCustomCategory] = React.useState('');
  const [showCustom, setShowCustom] = React.useState(false);
  const [pinRule, setPinRule] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const finalCategory = showCustom ? customCategory.trim() : category;

  const handleSave = async () => {
    if (!finalCategory) return;
    setSaving(true);
    await onSave({ item, modality, category: finalCategory, pinRule });
    setSaving(false);
    onClose();
  };

  const modalityColor = {
    income:      '#4ade80',
    expense:     '#f87171',
    savings_out: '#22d3ee',
    savings_in:  '#22d3ee',
  }[modality] || '#94a3b8';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative z-10 w-full max-w-sm bg-[#1a1f2e] border border-white/10 rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Editar Transação</p>
            <p className="text-sm font-bold text-white leading-snug line-clamp-2">{item.description}</p>
            <p className="text-xs text-white/40 mt-0.5">{formatDate(item.transaction_date)}</p>
          </div>
          <button onClick={onClose} className="shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Modalidade */}
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Modalidade</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MODALITY_LABELS).map(([key, label]) => {
              const colors = {
                income:      { bg: '#4ade8015', border: '#4ade8040', text: '#4ade80' },
                expense:     { bg: '#f8717115', border: '#f8717140', text: '#f87171' },
                savings_out: { bg: '#22d3ee15', border: '#22d3ee40', text: '#22d3ee' },
                savings_in:  { bg: '#22d3ee10', border: '#22d3ee30', text: '#06b6d4' },
              }[key];
              return (
                <button
                  key={key}
                  onClick={() => setModality(key)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all border"
                  style={modality === key
                    ? { background: colors.bg, borderColor: colors.border, color: colors.text }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categoria */}
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Categoria</p>
          {!showCustom ? (
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all appearance-none"
            >
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c} style={{ background: '#1a1f2e' }}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Nome da categoria personalizada..."
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
            />
          )}
          <button
            onClick={() => { setShowCustom(v => !v); setCustomCategory(''); }}
            className="mt-1.5 text-[11px] text-primary/70 hover:text-primary transition-colors"
          >
            {showCustom ? '← Escolher existente' : '+ Criar categoria personalizada'}
          </button>
        </div>

        {/* Fixar regra */}
        <label className="flex items-start gap-3 cursor-pointer mb-5 group">
          <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${pinRule ? 'bg-primary border-primary' : 'border-white/20 bg-white/5'}`} onClick={() => setPinRule(v => !v)}>
            {pinRule && <Check size={10} className="text-white" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">Fixar para transações com esta descrição</p>
            <p className="text-[10px] text-white/30 mt-0.5">Aplicar automaticamente em futuras importações</p>
          </div>
        </label>

        {/* Botões */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !finalCategory}
            className="flex-1 py-2.5 rounded-xl text-sm font-black bg-primary hover:bg-primary/90 text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: modalityColor, color: '#0f172a' }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Sub-component: Category Donut Chart
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const color = CATEGORY_COLORS[payload.name] || '#8884d8';
  return (
    <g>
      {/* Anel expandido */}
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 5} outerRadius={outerRadius + 10}
        startAngle={startAngle} endAngle={endAngle} fill={color} opacity={1} />
      {/* Anel externo sutil */}
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 14} outerRadius={outerRadius + 17}
        startAngle={startAngle} endAngle={endAngle} fill={color} opacity={0.4} />
      {/* Centro: nome */}
      <text x={cx} y={cy - 22} textAnchor="middle" fill="#f8fafc" fontSize={13} fontWeight={700}>
        {payload.name}
      </text>
      {/* Centro: valor */}
      <text x={cx} y={cy + 2} textAnchor="middle" fill="#f8fafc" fontSize={18} fontWeight={900}>
        {`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
      </text>
      {/* Centro: % */}
      <text x={cx} y={cy + 22} textAnchor="middle" fill={color} fontSize={12} fontWeight={700}>
        {`${(percent * 100).toFixed(1)}% das saídas`}
      </text>
      {/* Centro: qtd */}
      <text x={cx} y={cy + 40} textAnchor="middle" fill="rgba(248,250,252,0.4)" fontSize={11}>
        {`${payload.count} transaç${payload.count === 1 ? 'ão' : 'ões'}`}
      </text>
    </g>
  );
};

const CategoryChart = ({ chartData, onCategoryClick, selectedCategories }) => {
  const [activeIndex, setActiveIndex] = React.useState(null);
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card p-8 rounded-[2.5rem] h-full">
      <div className="flex items-center gap-2 mb-6">
        <PieIcon className="text-primary" size={22} />
        <h3 className="font-black text-xl text-white">Resumo por Categoria</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm">
          Sem despesas neste mês.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Donut */}
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={72} outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(_, i) => onCategoryClick?.(chartData[i]?.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#8884d8'} opacity={activeIndex === null || activeIndex === i ? 1 : 0.35} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centro padrão (sem hover) */}
            {activeIndex === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">Total saídas</p>
                <p className="text-xl font-black text-white">
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          {/* Legenda com barras */}
          <div className="space-y-2">
            {chartData.map((item, i) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              const color = CATEGORY_COLORS[item.name] || '#8884d8';
              return (
                <div
                  key={i}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer select-none"
                  style={{
                    background: selectedCategories?.includes(item.name)
                      ? `${color}22`
                      : activeIndex === i ? `${color}15` : 'rgba(255,255,255,0.03)',
                    boxShadow: selectedCategories?.includes(item.name) ? `inset 0 0 0 1.5px ${color}60` : 'none',
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => onCategoryClick?.(item.name)}
                  title={selectedCategories?.includes(item.name) ? 'Clique para remover filtro' : 'Clique para filtrar'}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[10px] text-slate-500">{item.count} tx</span>
                        <span className="text-xs font-bold text-white">
                          R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold w-10 text-right" style={{ color }}>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Health Gauge — 7 dimensões ponderadas
const HealthIndicator = ({ income, expense, savingsIn, savingsOut, topCategories, comparativeData }) => {
  // D1: Taxa de Gastos (25%)
  const expRatio = income > 0 ? expense / income : (expense > 0 ? 1 : 0);
  const d1 = expRatio <= 0.50 ? 100 : expRatio <= 0.70 ? 80 : expRatio <= 0.85 ? 55 : expRatio <= 1.00 ? 25 : 0;

  // D2: Taxa de Poupança líquida (20%)
  const netApplied = (savingsOut || 0) - (savingsIn || 0);
  const savingsRate = income > 0 ? netApplied / income : 0;
  const d2 = netApplied < 0 ? 10
           : savingsRate >= 0.20 ? 100 : savingsRate >= 0.10 ? 75
           : savingsRate >= 0.05 ? 50  : savingsRate >= 0.01 ? 25 : 0;

  // D3: Saldo do Mês (15%)
  const balance = income - expense;
  const balRatio = income > 0 ? balance / income : (balance > 0 ? 1 : 0);
  const d3 = balRatio > 0.30 ? 100 : balRatio > 0.15 ? 75 : balRatio > 0.05 ? 50 : balRatio >= 0 ? 25 : 0;

  // D4: Tendência mês vs anterior (10%)
  const mChg = comparativeData?.month?.changes;
  const d4 = !mChg ? 50
           : (mChg.expense < 0 && mChg.income > 0) ? 100
           : mChg.expense < 0 ? 70
           : Math.abs(mChg.expense) <= 5 ? 50
           : mChg.expense <= 10 ? 25 : 0;

  // D5: Tendência trimestre vs anterior (15%)
  const qChg = comparativeData?.quarter?.changes;
  const d5 = !qChg ? 50
           : (qChg.expense < 0 && qChg.income > 0) ? 100
           : qChg.expense < 0 ? 70
           : Math.abs(qChg.expense) <= 5 ? 50
           : qChg.expense <= 15 ? 25 : 0;

  // D6: Tendência ano vs ano (10%)
  const yChg = comparativeData?.year?.changes;
  const d6 = !yChg ? 50
           : yChg.balance > 20 ? 100 : yChg.balance > 5 ? 75
           : yChg.balance >= -5 ? 50 : yChg.balance >= -20 ? 25 : 0;

  // D7: Concentração de gastos (5%)
  const topRatio = (topCategories?.[0] && expense > 0) ? topCategories[0][1] / expense : 0;
  const d7 = expense === 0 ? 100
           : topRatio < 0.20 ? 100 : topRatio < 0.35 ? 65 : topRatio < 0.50 ? 35 : 10;

  const score = Math.round(d1*0.25 + d2*0.20 + d3*0.15 + d4*0.10 + d5*0.15 + d6*0.10 + d7*0.05);

  const { color, stroke, msg } =
    score >= 80 ? { color: 'text-success',   stroke: '#10b981', msg: 'Excelente' } :
    score >= 60 ? { color: 'text-cyan-400',  stroke: '#22d3ee', msg: 'Bom'       } :
    score >= 40 ? { color: 'text-yellow-400',stroke: '#facc15', msg: 'Atenção'   } :
    score >= 20 ? { color: 'text-orange-400',stroke: '#fb923c', msg: 'Risco'     } :
                  { color: 'text-error',      stroke: '#ef4444', msg: 'Crítico'   };

  const dims = [
    { label: 'Gastos',       pts: d1, tip: `Taxa de gastos: ${(expRatio*100).toFixed(0)}% da renda virou despesa. Meta: abaixo de 70%. Acima de 100% significa que você gastou mais do que recebeu.` },
    { label: 'Poupança',     pts: d2, tip: `Poupança líquida: ${(savingsRate*100).toFixed(1)}% da renda foi para investimentos (aplicações menos resgates). Meta ideal: 20%+ da renda mensal.` },
    { label: 'Saldo',        pts: d3, tip: `Sobra do mês: ${(balRatio*100).toFixed(1)}% da renda ficou disponível depois das despesas. Acima de 15% é considerado saudável.` },
    { label: 'Mês',          pts: d4, tip: `Tendência mensal: compara despesas e receitas com o mês anterior. Despesas caindo + receitas subindo = pontuação máxima. Sem dados do mês anterior = neutro (50).` },
    { label: 'Trimestre',    pts: d5, tip: `Tendência trimestral: compara o trimestre atual com o anterior. Período mais confiável que um mês isolado — evita distorções pontuais.` },
    { label: 'Ano vs Ano',   pts: d6, tip: `Evolução anual: compara o saldo acumulado deste ano com o mesmo período do ano passado. Saldo crescendo acima de 20% = máximo.` },
    { label: 'Concentração', pts: d7, tip: `Concentração de gastos: maior categoria representa ${(topRatio*100).toFixed(0)}% das despesas. Acima de 50% em uma única categoria indica risco de dependência.` },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full">
      {/* Gauge */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-container" />
          <motion.circle
            cx="64" cy="64" r="58" strokeWidth="8" fill="transparent"
            stroke={stroke}
            strokeDasharray={364}
            initial={{ strokeDashoffset: 364 }}
            animate={{ strokeDashoffset: 364 - (364 * score) / 100 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-2xl font-black ${color}`}>{score}%</span>
          <span className="text-[10px] uppercase font-bold opacity-60">Saúde</span>
        </div>
      </div>
      <p className={`mt-2 font-bold text-sm ${color}`}>{msg}</p>

      {/* Breakdown por dimensão */}
      <div className="w-full mt-4 space-y-1.5">
        {dims.map(({ label, pts, tip }) => {
          const barColor = pts >= 80 ? '#10b981' : pts >= 60 ? '#22d3ee' : pts >= 40 ? '#facc15' : pts >= 20 ? '#fb923c' : '#ef4444';
          return (
            <div key={label} className="flex items-center gap-2 cursor-default">
              {/* Label + ícone — tooltip ativado por hover no grupo inteiro */}
              <div className="relative group/info flex items-center gap-1 w-16 shrink-0 cursor-help">
                <span className="text-[9px] font-bold text-white/40 truncate group-hover/info:text-white/70 transition-colors">{label}</span>
                <Info size={8} className="shrink-0 text-white/20 group-hover/info:text-white/60 transition-colors" />
                <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-50 w-60 opacity-0 group-hover/info:opacity-100 transition-opacity duration-200">
                  <div className="rounded-xl px-3 py-2 shadow-xl" style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{tip}</p>
                  </div>
                  <div className="w-2 h-2 rotate-45 ml-4 -mt-1" style={{ background: '#1e2433', borderBottom: '1px solid rgba(255,255,255,0.12)', borderRight: '1px solid rgba(255,255,255,0.12)' }} />
                </div>
              </div>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pts}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// === AI CHAT DRAWER ===
const SUGGESTED_QUESTIONS = [
  'Onde estou gastando mais este mês?',
  'Como está minha saúde financeira?',
  'Quais categorias posso reduzir?',
  'Compare entradas e saídas',
];

function ChatDrawer({ open, onClose, aggregates, topCategories, selectedMonth, userEmail }) {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: `Olá! Sou o assistente financeiro do Extrato Co. 👋\n\nAnalisei os seus dados de **${selectedMonth || 'este mês'}** e estou pronto para ajudar. O que você gostaria de saber?`,
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const context = {
        month: selectedMonth,
        income: aggregates.income,
        expense: aggregates.expense,
        savings: aggregates.savingsOut,
        savingsIn: aggregates.savingsIn,
        savingsNet: aggregates.savingsNet,
        balance: aggregates.balance,
        top_categories: topCategories.map(([cat, val]) => ({ category: cat, total: val })),
      };
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', message: question, user_email: userEmail, context }),
      });
      const json = await res.json();
      const reply = json.reply || json.message || json.output || 'Não consegui processar sua pergunta no momento.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Erro ao conectar com o assistente. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-[80] max-w-2xl mx-auto"
          >
            <div className="glass-card rounded-t-[2rem] border border-outline-variant shadow-2xl flex flex-col"
              style={{ height: 'min(90vh, 640px)' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Bot size={18} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Assistente Financeiro</p>
                    <p className="text-on-surface-variant text-[11px]">Análise inteligente do seu extrato</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronDown size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                        <Bot size={13} className="text-secondary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-white/[0.06] text-slate-200 rounded-tl-sm border border-white/[0.08]'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center mr-2 flex-shrink-0">
                      <Bot size={13} className="text-secondary" />
                    </div>
                    <div className="bg-white/[0.06] border border-white/[0.08] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggested questions (only if no user messages yet) */}
              {messages.filter(m => m.role === 'user').length === 0 && !loading && (
                <div className="px-5 pb-3 flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-white hover:bg-primary/10 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-5 pb-5 pt-2 border-t border-outline-variant">
                <form
                  onSubmit={(e) => { e.preventDefault(); send(); }}
                  className="flex items-center gap-2 bg-white/[0.05] border border-outline-variant rounded-2xl px-4 py-2 focus-within:border-primary/50 transition-all"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pergunte sobre seus dados financeiros..."
                    className="flex-1 bg-transparent text-white placeholder-on-surface-variant/50 text-sm outline-none"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-8 h-8 rounded-xl bg-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:bg-secondary active:scale-95"
                  >
                    <Send size={14} className="text-white" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Dashboard({ user }) {
  useSEO({ title: 'Painel', description: '', noindex: true });
  const { theme, toggleTheme, hideValues, toggleHideValues } = useApp();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'error'|'success'|'warn' }
  const [effectiveUserId, setEffectiveUserId] = useState(null);
  const categoryChartRef = useRef(null);
  const transactionsRef = useRef(null);
  const navigate = useNavigate();

  const { canAccess, plan: userPlan, isTrial, trialDaysLeft } = useSubscription(user?.id);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showFileBadges, setShowFileBadges] = useState(true);
  const [prophetPredictions, setProphetPredictions] = useState(null);
  const [prophetLoading, setProphetLoading] = useState(false);
  const [pluggyConnecting, setPluggyConnecting] = useState(false);
  const [pluggyToken, setPluggyToken] = useState(null);
  const [showSoraya, setShowSoraya] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editModal, setEditModal] = useState(null); // transaction item being edited

  const isOwner = effectiveUserId === user?.id;

  const authorName = (email) =>
    email === 'chaibub@gmail.com'    ? 'Soraya'
    : email === 'conradobsb@gmail.com' ? 'Conrado'
    : email?.split('@')[0] || 'Usuário';

  const fetchSuggestions = async () => {
    const { data } = await supabase.schema('stich_ai').from('suggestions')
      .select('*').order('created_at', { ascending: false });
    if (data) setSuggestions(data);
  };

  const submitSuggestion = async () => {
    if (!newSuggestion.trim() || !user) return;
    setSuggestionLoading(true);
    await supabase.schema('stich_ai').from('suggestions').insert({
      author_id: user.id,
      author_email: user.email,
      author_name: authorName(user.email),
      content: newSuggestion.trim(),
      status: 'new',
    });
    setNewSuggestion('');
    await fetchSuggestions();
    setSuggestionLoading(false);
  };

  const setSuggestionStatus = async (id, status) => {
    await supabase.schema('stich_ai').from('suggestions').update({ status }).eq('id', id);
    await fetchSuggestions();
  };

  const openSoraya = async () => {
    setShowSoraya(true);
    await fetchSuggestions();
    // Marca como lidas as sugestões de outros usuários
    const unread = suggestions.filter(s => s.status === 'new' && s.author_id !== user?.id);
    await Promise.all(unread.map(s =>
      supabase.schema('stich_ai').from('suggestions').update({ status: 'read' }).eq('id', s.id)
    ));
    if (unread.length > 0) await fetchSuggestions();
  };

  const fetchMembers = async () => {
    if (!effectiveUserId) return;
    const { data: rows } = await supabase
      .schema('stich_ai')
      .from('account_invites')
      .select('invitee_email, accepted_at, created_at, expires_at')
      .eq('inviter_user_id', effectiveUserId)
      .order('created_at', { ascending: false });
    setMembers(rows || []);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setInviteLink('');
    try {
      // Remove convites pendentes anteriores para o mesmo email
      await supabase
        .schema('stich_ai')
        .from('account_invites')
        .delete()
        .eq('inviter_user_id', effectiveUserId)
        .eq('invitee_email', inviteEmail)
        .is('accepted_at', null);

      const { data: inv, error } = await supabase
        .schema('stich_ai')
        .from('account_invites')
        .insert({ inviter_user_id: effectiveUserId, invitee_email: inviteEmail })
        .select('token')
        .single();
      if (error) throw error;
      const link = `${window.location.origin}/invite?token=${inv.token}`;
      setInviteLink(link);

      const emailWebhookUrl = import.meta.env.VITE_N8N_EMAIL_WEBHOOK_URL;
      if (emailWebhookUrl) {
        await fetch(emailWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: inviteEmail,
            subject: 'Convite para o Extrato Co.',
            body: `Olá!\n\nVocê foi convidado para compartilhar uma conta no Extrato Co.\n\nClique no link abaixo para aceitar:\n${link}\n\nO convite expira em 7 dias.`,
          }),
        });
      }

      setInviteEmail('');
      await fetchMembers();
    } catch (err) {
      alert('Erro ao criar convite: ' + err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Resolve effective user id — check if this user is linked to another account
        let resolvedUserId = user.id;
        const { data: link } = await supabase
          .schema('stich_ai')
          .from('account_links')
          .select('linked_to_user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (link?.linked_to_user_id) resolvedUserId = link.linked_to_user_id;
        setEffectiveUserId(resolvedUserId);

        // Phase 1: fetch last 12 months for fast first render
        const PAGE = 1000;
        const TWELVE_MONTHS_AGO = new Date();
        TWELVE_MONTHS_AGO.setMonth(TWELVE_MONTHS_AGO.getMonth() - 12);
        const recentCutoff = TWELVE_MONTHS_AGO.toISOString().substring(0, 10);
        const { data: recentPage, error: recentError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', resolvedUserId)
          .gte('transaction_date', recentCutoff)
          .order('transaction_date', { ascending: false })
          .range(0, PAGE - 1);
        if (recentError) throw recentError;
        const recentRows = recentPage || [];
        if (recentRows.length > 0) {
          setData(recentRows);
          setIsSupabaseConnected(true);
          const latestDate = recentRows.find(h => h.transaction_date)?.transaction_date;
          if (latestDate) setSelectedMonth(latestDate.substring(0, 7));
        }

        // Phase 2: fetch older history (beyond 12 months) in background, up to 5 years
        const FIVE_YEARS_AGO = new Date();
        FIVE_YEARS_AGO.setFullYear(FIVE_YEARS_AGO.getFullYear() - 5);
        const cutoff = FIVE_YEARS_AGO.toISOString().substring(0, 10);
        let olderRows = [];
        let from = 0;
        while (true) {
          const { data: page, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', resolvedUserId)
            .gte('transaction_date', cutoff)
            .lt('transaction_date', recentCutoff)
            .order('transaction_date', { ascending: false })
            .range(from, from + PAGE - 1);
          if (error) break;
          if (page && page.length > 0) olderRows = olderRows.concat(page);
          if (!page || page.length < PAGE) break;
          from += PAGE;
        }
        if (olderRows.length > 0) setData(prev => [...prev, ...olderRows]);

        // Load user category rules
        const { data: rules } = await supabase
          .schema('stich_ai')
          .from('category_rules')
          .select('keyword, category, modality')
          .eq('user_id', resolvedUserId);
        if (rules) _userCategoryRules = rules;
      } catch (err) {
        console.warn("Supabase fetch failed:", err.message);
      }
    };
    if (user?.id) { fetchHistory(); fetchSuggestions(); }
  }, [user]);

  const handleEditSave = async ({ item, modality, category, pinRule }) => {
    try {
      const newMetadata = { ...(item.metadata || {}), modality_override: modality };
      await supabase
        .from('transactions')
        .update({ category, metadata: newMetadata })
        .eq('id', item.id);

      // Update local state immediately
      setData(prev => prev.map(t =>
        t.id === item.id ? { ...t, category, metadata: newMetadata } : t
      ));

      if (pinRule && item.description) {
        const keyword = item.description.trim().toLowerCase().slice(0, 80);
        const userId = effectiveUserId || user?.id;
        await supabase
          .schema('stich_ai')
          .from('category_rules')
          .upsert({ user_id: userId, keyword, category, modality }, { onConflict: 'user_id,keyword' });
        // Update in-memory rules
        _userCategoryRules = _userCategoryRules.filter(r => r.keyword !== keyword);
        _userCategoryRules.push({ keyword, category, modality });
      }

      setToast({ message: 'Transação atualizada.', type: 'success' });
    } catch (err) {
      setToast({ message: 'Erro ao salvar: ' + err.message, type: 'error' });
    }
  };

  const handleFileUpload = async (e, importType) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setLoading(true);

    try {
      // Verificação de duplicata: checar se arquivo já foi importado por este usuário
      const uploadUserId = effectiveUserId || user?.id;
      try {
        const { data: alreadyImported, error: dupError } = await supabase
          .schema('stich_ai')
          .from('imported_files')
          .select('id, imported_at')
          .eq('user_id', uploadUserId)
          .eq('file_name', file.name)
          .maybeSingle();

        if (!dupError && alreadyImported) {
          const date = new Date(alreadyImported.imported_at).toLocaleDateString('pt-BR');
          setToast({ message: `"${file.name}" já foi importado em ${date}. Para reimportar, remova as transações deste arquivo primeiro.`, type: 'warn' });
          setLoading(false);
          return;
        }
      } catch (_) {
        // Se a checagem falhar por qualquer motivo, permite o upload continuar
      }

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
      const sourceType = importType === 'cartao' ? 'credit_card' : importType === 'investimento' ? 'investment' : 'bank';
      const payload = {
        text_data: extractedText,
        user_id: uploadUserId,
        file_name: file.name,
        import_type: importType || 'extrato',
        source_type: sourceType,
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

      const n8nRes = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (n8nRes.status === 409) {
        setToast({ message: 'Este arquivo já foi importado anteriormente.', type: 'error' });
        return;
      }

      let importedCount = 0;
      try {
        const n8nData = await n8nRes.json();
        importedCount = n8nData?.count ?? 0;
      } catch (e) {}

      if (importedCount > 0) {
        setToast({ message: `${importedCount} transações importadas com sucesso!`, type: 'success' });
        window.location.reload();
      } else {
        setToast({ message: 'Nenhuma transação encontrada no arquivo.', type: 'warning' });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setToast({ message: 'Erro ao processar arquivo. Tente novamente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = async () => {
    if (!canAccess('pluggy')) { navigate('/pricing'); return; }
    setPluggyConnecting(true);
    try {
      const pluggyTokenUrl = import.meta.env.VITE_N8N_PLUGGY_TOKEN_URL || 'https://conradobsb.app.n8n.cloud/webhook/pluggy-token';
      const res = await fetch(pluggyTokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const text = await res.text();
      const { connectToken, error } = text ? JSON.parse(text) : {};
      if (!connectToken || error) {
        setToast({ message: 'Erro ao iniciar conexão bancária.', type: 'error' });
        setPluggyConnecting(false);
        return;
      }
      setPluggyToken(connectToken);
    } catch (err) {
      setToast({ message: 'Erro ao conectar banco. Tente novamente.', type: 'error' });
      setPluggyConnecting(false);
    }
  };

  const handlePluggySuccess = async (itemData) => {
    const item = itemData.item || itemData;
    await supabase.schema('stich_ai').from('connected_accounts').upsert({
      user_id: user?.id,
      pluggy_item_id: item.id,
      bank_name: item.institution?.name || 'Banco',
      connected_at: new Date().toISOString(),
      status: 'active',
    }, { onConflict: 'pluggy_item_id' });
    setToast({ message: `${item.institution?.name || 'Banco'} conectado com sucesso!`, type: 'success' });
    setPluggyToken(null);
    setPluggyConnecting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Verifica se há faturas de cartão importadas (source_type = 'credit_card') no dataset.
  // Usado para ativar a anti-duplicação sem depender do campo `bank` (que pode ser NULL).
  const hasAnyCreditCard = useMemo(() =>
    data.some(item => item.source_type === 'credit_card')
  , [data]);

  // Calcula o total das faturas de cartão importadas por emissor detectado via descrição do boleto.
  // Chave: palavra do emissor encontrada na descrição do boleto bancário.
  const creditCardTotalByIssuer = useMemo(() => {
    if (!hasAnyCreditCard) return {};
    // Soma todas as transações credit_card por palavras-chave de emissor na descrição
    const ISSUER_KEYS = ['itau', 'sicredi', 'nubank', 'bradesco', 'santander',
      'c6', 'inter', 'btg', 'caixa', 'next', 'neon', 'pan', 'picpay'];
    const totals = {};
    data.forEach(item => {
      if (item.source_type !== 'credit_card' || item.amount >= 0) return;
      const desc = (item.description || '').toLowerCase();
      const matched = ISSUER_KEYS.find(k => desc.includes(k));
      const key = matched || '__unknown__';
      totals[key] = (totals[key] || 0) + Math.abs(item.amount);
    });
    return totals;
  }, [data, hasAnyCreditCard]);

  const projectedInstallments = useMemo(() => {
    const INST_RE = /\s+(\d{2})\/(\d{2})$/;

    // Pre-build O(n) lookup of real credit card transactions → O(1) alreadyReal check
    const realKeys = new Set();
    data.forEach(item => {
      if (item.source_type !== 'credit_card' || item.metadata?.projetado) return;
      const bm = getEffectiveBillingMonth(item);
      if (!bm) return;
      const baseDesc = (item.description || '').replace(INST_RE, '').trim();
      realKeys.add(`${bm}|${baseDesc}|${Math.round(item.amount * 100)}`);
    });

    const seen = new Set();
    const projections = [];
    data.forEach(item => {
      if (item.source_type !== 'credit_card' || item.metadata?.projetado) return;
      const match = item.description?.match(INST_RE);
      if (!match) return;
      const current = parseInt(match[1]);
      const total   = parseInt(match[2]);
      if (current >= total) return;
      const billingMonth = getEffectiveBillingMonth(item);
      if (!billingMonth) return;
      const [yr, mo] = billingMonth.split('-').map(Number);
      const baseDesc = item.description.replace(INST_RE, '').trim();
      for (let i = current + 1; i <= total; i++) {
        const d = new Date(yr, mo - 1 + (i - current), 1);
        const futureMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (realKeys.has(`${futureMonth}|${baseDesc}|${Math.round(item.amount * 100)}`)) continue;
        const dedupKey = `${futureMonth}|${baseDesc}|${item.amount}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);
        projections.push({
          ...item,
          id: `proj_${item.id}_${i}`,
          description: `${baseDesc} ${String(i).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
          metadata: { ...(item.metadata || {}), projetado: true, billingMonth: futureMonth },
        });
      }
    });
    return projections;
  }, [data]);

  const monthlyData = useMemo(() => {
    if (!selectedMonth) return [];
    let filtered = data.filter(item => {
      const month = getEffectiveBillingMonth(item);
      return month === selectedMonth;
    });
    const projForMonth = projectedInstallments.filter(p => p.metadata.billingMonth === selectedMonth);
    filtered = [...filtered, ...projForMonth];

    // Anti-duplicidade: quando há fatura de cartão importada, remove do extrato bancário
    // o pagamento de boleto correspondente — em qualquer mês.
    // Estratégia em camadas:
    //   1. Categoria 'Cartão de Crédito' → sempre remove
    //   2. Boleto + nome de emissor com fatura importada → remove
    //   3. Boleto + nome de emissor + valor ≈ total da fatura → remove (mais preciso)
    if (hasAnyCreditCard) {
      const BOLETO_PATTERNS = ['pagamento boleto', 'pagamento de boleto', 'pgto boleto', 'boleto bancario',
        'deb aut fatura', 'debito automatico fatura', 'debito fatura', 'pgto fatura',
        'pagamento fatura', 'pagamento de fatura', 'pix fatura', 'pix cartao', 'pix cartão'];
      const CARD_ISSUERS = ['itau', 'sicredi', 'nubank', 'bradesco', 'santander',
        'c6', 'inter', 'btg', 'caixa', 'next', 'neon', 'pan', 'picpay', 'mercado pago'];

      filtered = filtered.filter(item => {
        const isBank = !item.source_type || item.source_type === 'bank';
        if (!isBank) return true;

        // Camada 1: categoria explícita
        if (smartCategory(item) === 'Cartão de Crédito') return false;

        const desc = (item.description || '').toLowerCase();

        // Camada 2: boleto + emissor de cartão conhecido
        const isBoleto = BOLETO_PATTERNS.some(p => desc.includes(p));
        if (!isBoleto) return true;

        const matchedIssuer = CARD_ISSUERS.find(k => desc.includes(k));
        if (!matchedIssuer) return true; // boleto sem emissor de cartão (aluguel, etc.)

        // Se temos fatura importada para esse emissor → remove o boleto
        const hasIssuerData = creditCardTotalByIssuer[matchedIssuer] !== undefined
          || creditCardTotalByIssuer['__unknown__'] !== undefined;
        return !hasIssuerData;
      });
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.description && item.description.toLowerCase().includes(lower)) ||
        (item.category && item.category.toLowerCase().includes(lower)) ||
        (item.bank && item.bank.toLowerCase().includes(lower))
      );
    }
    return filtered;
  }, [data, selectedMonth, searchTerm, hasAnyCreditCard, creditCardTotalByIssuer, projectedInstallments]);

  const availableMonths = useMemo(() => {
    const months = new Set([
      ...data.filter(item => item.transaction_date).map(item => getEffectiveBillingMonth(item)),
      ...projectedInstallments.map(p => p.metadata.billingMonth),
    ].filter(Boolean));
    // Always include the last 12 months so the user can navigate even without imported data
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return Array.from(months).sort().reverse();
  }, [data, projectedInstallments]);

  // Arquivos importados para o mês selecionado
  const monthFiles = useMemo(() => {
    if (!selectedMonth) return [];
    const files = new Map();
    data.filter(item => getEffectiveBillingMonth(item) === selectedMonth && item.bank).forEach(item => {
      if (!files.has(item.bank)) files.set(item.bank, item.source_type || 'bank');
    });
    return Array.from(files.entries()).map(([name, type]) => ({ name, type }));
  }, [data, selectedMonth]);

  // === AGGREGATES ===
  const aggregates = useMemo(() => {
    let income = 0, expense = 0, savingsIn = 0, savingsOut = 0;
    monthlyData.forEach(item => {
      const cls = classifyTransaction(item);
      switch (cls) {
        case 'savings_out': savingsOut += Math.abs(item.amount); break;
        case 'savings_in':  savingsIn  += item.amount; break;
        case 'income':      income     += item.amount; break;
        case 'expense':     expense    += Math.abs(item.amount); break;
      }
    });
    const savingsNet = savingsIn - savingsOut;
    const balance = income - expense;
    // Erosão de patrimônio: resgatou mais do que aplicou E gastou mais do que recebeu
    const patrimonioErosion = savingsIn > savingsOut && expense > income;
    return { income, expense, savingsIn, savingsOut, savingsNet, balance, patrimonioErosion };
  }, [monthlyData]);

  const topCategories = useMemo(() => {
    const cats = {};
    monthlyData.forEach(item => {
      if (classifyTransaction(item) === 'expense') {
        const cat = smartCategory(item);
        cats[cat] = (cats[cat] || 0) + Math.abs(item.amount);
      }
    });
    return Object.entries(cats).sort((a,b) => b[1] - a[1]).slice(0, 3);
  }, [monthlyData]);

  const chartData = useMemo(() => {
    const agg = {};
    monthlyData.forEach(item => {
      if (classifyTransaction(item) === 'expense') {
        const cat = smartCategory(item);
        if (!agg[cat]) agg[cat] = { value: 0, count: 0, biggest: 0, biggestDesc: '' };
        const abs = Math.abs(item.amount);
        agg[cat].value += abs;
        agg[cat].count += 1;
        if (abs > agg[cat].biggest) {
          agg[cat].biggest = abs;
          agg[cat].biggestDesc = item.description || '';
        }
      }
    });
    return Object.keys(agg)
      .map(name => ({ name, ...agg[name] }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyData]);

  const formatMonth = (m) => {
    if (!m) return '';
    const [y, mm] = m.split('-');
    return new Date(y, mm - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const comparativeData = useMemo(() => {
    if (!selectedMonth || data.length === 0) return null;
    const [year, month] = selectedMonth.split('-').map(Number);

    const getAgg = (months) => {
      let income = 0, expense = 0, savingsIn = 0, savingsOut = 0;
      data.filter(item => months.some(m => item.transaction_date?.startsWith(m))).forEach(item => {
        const cls = classifyTransaction(item);
        if (cls === 'income')      income    += item.amount;
        else if (cls === 'expense')     expense   += Math.abs(item.amount);
        else if (cls === 'savings_out') savingsOut += Math.abs(item.amount);
        else if (cls === 'savings_in')  savingsIn  += item.amount;
      });
      return { income, expense, savingsIn, savingsOut, savingsNet: savingsIn - savingsOut, balance: income - expense };
    };

    const pct = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / Math.abs(prev)) * 100;

    // Mês vs mês anterior
    const prevMonthStr = month === 1
      ? `${year - 1}-12`
      : `${year}-${String(month - 1).padStart(2, '0')}`;
    const currM = getAgg([selectedMonth]);
    const prevM = getAgg([prevMonthStr]);

    // Trimestre vs trimestre anterior
    const q = Math.ceil(month / 3);
    const qMonths = (qi, yi) => [0, 1, 2].map(i => {
      const m = (qi - 1) * 3 + 1 + i;
      return `${yi}-${String(m).padStart(2, '0')}`;
    });
    const prevQ = q === 1 ? 4 : q - 1;
    const prevQYear = q === 1 ? year - 1 : year;
    const currQ = getAgg(qMonths(q, year));
    const prevQAgg = getAgg(qMonths(prevQ, prevQYear));

    // Ano vs ano anterior
    const yearMonths = (y) => Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`);
    const currY = getAgg(yearMonths(year));
    const prevY = getAgg(yearMonths(year - 1));

    return {
      month: {
        curr: currM, prev: prevM,
        labels: [formatMonth(selectedMonth), formatMonth(prevMonthStr)],
        changes: { income: pct(currM.income, prevM.income), expense: pct(currM.expense, prevM.expense), balance: pct(currM.balance, prevM.balance) }
      },
      quarter: {
        curr: currQ, prev: prevQAgg,
        labels: [`Q${q}/${year}`, `Q${prevQ}/${prevQYear}`],
        changes: { income: pct(currQ.income, prevQAgg.income), expense: pct(currQ.expense, prevQAgg.expense), balance: pct(currQ.balance, prevQAgg.balance) }
      },
      year: {
        curr: currY, prev: prevY,
        labels: [`${year}`, `${year - 1}`],
        changes: { income: pct(currY.income, prevY.income), expense: pct(currY.expense, prevY.expense), balance: pct(currY.balance, prevY.balance) }
      },
    };
  }, [data, selectedMonth]);

  // === MONTHLY HISTORY (base para modelos preditivos) ===
  const monthlyHistory = useMemo(() => {
    const byMonth = {};
    data.forEach(item => {
      const m = (item.transaction_date || '').slice(0, 7);
      if (!m) return;
      if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0, savingsOut: 0, savingsIn: 0 };
      const cls = classifyTransaction(item);
      if (cls === 'income')      byMonth[m].income    += item.amount;
      else if (cls === 'expense')     byMonth[m].expense   += Math.abs(item.amount);
      else if (cls === 'savings_out') byMonth[m].savingsOut += Math.abs(item.amount);
      else if (cls === 'savings_in')  byMonth[m].savingsIn  += item.amount;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v, balance: v.income - v.expense }));
  }, [data]);

  // === PREDICTIVE ENGINE ===
  const predictions = useMemo(() => {
    const n = monthlyHistory.length;
    if (n < 3) return null;

    const expenses = monthlyHistory.map(m => m.expense);
    const incomes  = monthlyHistory.map(m => m.income);

    // --- Holt's Double Exponential Smoothing ---
    const holt = (series, alpha = 0.4, beta = 0.3, horizon = 12) => {
      let L = series[0], T = series[1] - series[0];
      for (let i = 1; i < series.length; i++) {
        const prevL = L;
        L = alpha * series[i] + (1 - alpha) * (L + T);
        T = beta * (L - prevL) + (1 - beta) * T;
      }
      return Array.from({ length: horizon }, (_, h) => Math.max(0, L + (h + 1) * T));
    };

    const expProj12 = holt(expenses);
    const incProj12 = holt(incomes);

    // --- Índice Sazonal por mês calendário ---
    const seasonalIndex = {};
    if (n >= 6) {
      const globalAvg = expenses.reduce((a, b) => a + b, 0) / n;
      const groups = {};
      monthlyHistory.forEach(({ month, expense }) => {
        const m = parseInt(month.slice(5, 7));
        if (!groups[m]) groups[m] = [];
        groups[m].push(expense);
      });
      Object.entries(groups).forEach(([m, vals]) => {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        seasonalIndex[parseInt(m)] = globalAvg > 0 ? avg / globalAvg : 1;
      });
    }

    const [selY, selM] = (selectedMonth || new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const nextMonths = Array.from({ length: 12 }, (_, h) => {
      const d = new Date(selY, selM - 1 + h + 1, 1);
      return d.getMonth() + 1; // 1-12
    });

    const seasonalExpProj = expProj12.map((v, i) => v * (seasonalIndex[nextMonths[i]] || 1));

    // --- Desvio padrão histórico ---
    const std = (arr) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return Math.sqrt(arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length);
    };
    const expStd = std(expenses);
    const incStd = std(incomes);

    // --- Monte Carlo (1.000 simulações × 12 meses) ---
    const randn = () => {
      let u, v;
      do { u = Math.random(); v = Math.random(); } while (u === 0);
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    const SIMS = 1000;
    const annualBalances = Array.from({ length: SIMS }, () => {
      let bal = 0;
      for (let m = 0; m < 12; m++) {
        const si = seasonalIndex[nextMonths[m]] || 1;
        const simExp = Math.max(0, expProj12[m] * si + randn() * expStd);
        const simInc = Math.max(0, incProj12[m] + randn() * incStd);
        bal += simInc - simExp;
      }
      return bal;
    }).sort((a, b) => a - b);

    const p10 = annualBalances[Math.floor(SIMS * 0.10)];
    const p50 = annualBalances[Math.floor(SIMS * 0.50)];
    const p90 = annualBalances[Math.floor(SIMS * 0.90)];

    // --- Construção das previsões ---
    const fmt = (v) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
    const monthNames = ['', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    // P1 — Curto prazo (Holt + sazonalidade, 1 mês à frente)
    const p1Exp = seasonalExpProj[0];
    const p1Inc = incProj12[0];
    const p1Bal = p1Inc - p1Exp;
    const p1 = p1Bal < 0
      ? { text: `Próximo mês: déficit projetado de ${fmt(p1Bal)} (Holt + sazonalidade). Gastos devem superar renda.`, level: 'error' }
      : { text: `Próximo mês: saldo projetado de +${fmt(p1Bal)}. Renda supera despesas previstas com sazonalidade.`, level: 'success' };

    // P2 — Médio prazo (sazonalidade + concentração)
    let p2;
    if (n >= 6) {
      const peakEntry = Object.entries(seasonalIndex).sort(([, a], [, b]) => b - a)[0];
      const peakM = peakEntry ? parseInt(peakEntry[0]) : null;
      const peakSI = peakEntry ? peakEntry[1] : 1;
      const q3Bal = [0, 1, 2].reduce((s, i) => s + incProj12[i] - seasonalExpProj[i], 0);
      if (peakSI > 1.15 && peakM) {
        p2 = { text: `${monthNames[peakM].toUpperCase()} historicamente ${((peakSI - 1) * 100).toFixed(0)}% acima da média de gastos. Próximo trimestre: ${q3Bal >= 0 ? '+' : ''}${fmt(q3Bal)} projetado.`, level: peakSI > 1.3 ? 'warning' : 'neutral' };
      } else {
        const q3Sign = q3Bal >= 0 ? '+' : '-';
        p2 = { text: `Sazonalidade estável. Próximo trimestre projetado: ${q3Sign}${fmt(q3Bal)} (média ${fmt(Math.abs(q3Bal) / 3)}/mês).`, level: q3Bal >= 0 ? 'success' : 'error' };
      }
    } else {
      p2 = { text: `${n} meses de histórico. Com 6+ meses, sazonalidade e projeção trimestral ficam precisas.`, level: 'neutral' };
    }

    // P3 — Longo prazo (Monte Carlo 12 meses)
    const p3 = {
      text: `12 meses (1.000 simulações): base ${p50 >= 0 ? '+' : ''}${fmt(p50)} · otimista ${p10 >= 0 ? '+' : '-'}${fmt(p10)} · pessimista ${p90 >= 0 ? '+' : '-'}${fmt(p90)}.`,
      level: p50 >= 0 ? 'primary' : 'error'
    };

    // P4 — Concentração de Risco (HHI)
    const totalExp = chartData.reduce((s, c) => s + c.value, 0);
    const hhi = totalExp > 0
      ? chartData.reduce((s, c) => { const share = c.value / totalExp; return s + share * share; }, 0)
      : 0;
    const topCat = chartData[0];
    const topShare = totalExp > 0 && topCat ? ((topCat.value / totalExp) * 100).toFixed(0) : 0;
    let p4;
    if (hhi > 0.35) {
      p4 = { text: `Risco de concentração elevado (HHI ${hhi.toFixed(2)}): ${topCat?.name} representa ${topShare}% das despesas. Um choque nessa categoria desequilibra o orçamento.`, level: 'error' };
    } else if (hhi > 0.20) {
      p4 = { text: `Concentração moderada (HHI ${hhi.toFixed(2)}): ${topCat?.name} lidera com ${topShare}%. Monitorar se superar 40%.`, level: 'warning' };
    } else if (topCat) {
      p4 = { text: `Gastos bem distribuídos (HHI ${hhi.toFixed(2)}). ${topCat.name} representa ${topShare}% — baixo risco de concentração setorial.`, level: 'success' };
    } else {
      p4 = { text: `Sem dados de categoria suficientes para análise de concentração.`, level: 'neutral' };
    }

    // P5 — Ponto de Equilíbrio / Reserva de Emergência
    const avgMonthlyExpense = expenses.reduce((a, b) => a + b, 0) / n;
    const emergencyFund = avgMonthlyExpense * 6; // padrão CFP®: 6× despesa média
    const currentBalance = aggregates.balance;
    let p5;
    if (currentBalance > 0) {
      const months = Math.ceil(emergencyFund / currentBalance);
      p5 = {
        text: `Reserva de emergência ideal: ${fmt(emergencyFund)} (6× despesa média). Superávit atual de ${fmt(currentBalance)}/mês → atingível em ~${months} mês${months === 1 ? '' : 'es'}.`,
        level: months <= 12 ? 'success' : 'primary'
      };
    } else if (currentBalance < 0) {
      p5 = {
        text: `Déficit de ${fmt(currentBalance)}/mês inviabiliza reserva de emergência (meta: ${fmt(emergencyFund)}). Reduzir despesas ou aumentar renda é prioritário.`,
        level: 'error'
      };
    } else {
      p5 = {
        text: `Saldo neutro. Reserva de emergência ideal: ${fmt(emergencyFund)} (6× despesa média de ${fmt(avgMonthlyExpense)}/mês).`,
        level: 'neutral'
      };
    }

    return { p1, p2, p3, p4, p5, hasSeasonality: n >= 6 };
  }, [monthlyHistory, selectedMonth, chartData, aggregates]);

  // === PROPHET API CALL ===
  useEffect(() => {
    const PROPHET_URL = import.meta.env.VITE_PROPHET_URL;
    if (!PROPHET_URL || monthlyHistory.length < 3) return;

    const controller = new AbortController();

    const callProphet = async () => {
      setProphetLoading(true);
      try {
        const toSeries = (field) =>
          monthlyHistory.map(m => ({ ds: `${m.month}-01`, y: m[field] }));

        const res = await fetch(`${PROPHET_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expense_series: toSeries('expense'),
            income_series:  toSeries('income'),
            horizon: 12,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Prophet service: ${res.status}`);
        const data = await res.json();
        setProphetPredictions(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Prophet service unavailable, using local models.', err.message);
          setProphetPredictions(null);
        }
      } finally {
        setProphetLoading(false);
      }
    };

    callProphet();
    return () => controller.abort();
  }, [monthlyHistory]);

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

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, maxWidth: 480, width: '90vw',
          background: toast.type === 'error' ? '#450a0a' : toast.type === 'warn' ? '#422006' : '#052e16',
          border: `1px solid ${toast.type === 'error' ? '#f87171' : toast.type === 'warn' ? '#fb923c' : '#4ade80'}`,
          color: toast.type === 'error' ? '#fca5a5' : toast.type === 'warn' ? '#fdba74' : '#86efac',
          borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>
            {toast.type === 'error' ? '✕' : toast.type === 'warn' ? '⚠' : '✓'}
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.5, flex: 1 }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'inherit', opacity: 0.6, fontSize: 16, flexShrink: 0, padding: 0,
          }}>✕</button>
        </div>
      )}

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
            {isTrial && trialDaysLeft !== null ? (
              <button onClick={() => navigate('/pricing')} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-all hover:opacity-80"
                style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                Trial · {trialDaysLeft}d restantes
              </button>
            ) : (
              <button onClick={() => navigate('/pricing')} className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hover:text-white transition-colors">
                {userPlan === 'free' ? 'Plano Gratuito' : userPlan === 'essencial' ? 'Essencial' : userPlan === 'private' ? 'Private' : userPlan === 'family_office' ? 'Family Office' : 'Ver Planos'}
              </button>
            )}
            <span className="text-xs font-medium text-white/80">{user?.email}</span>
          </div>
          <button
            onClick={() => { setShowMembersModal(true); fetchMembers(); }}
            className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-all text-on-surface-variant hover:text-white"
            title="Membros da conta"
          >
            <Users size={20} />
          </button>
          {/* Ocultar valores */}
          <button
            onClick={toggleHideValues}
            className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-all text-on-surface-variant hover:text-white"
            title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {hideValues ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

          {/* Tema claro / escuro */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-all text-on-surface-variant hover:text-white"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Soraya IA */}
          <button
            onClick={() => canAccess('soraya') ? openSoraya() : navigate('/pricing')}
            className="relative p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-all text-on-surface-variant hover:text-yellow-400"
            title={canAccess('soraya') ? 'Soraya IA — Sugestões' : 'Soraya IA — Plano Family Office'}
          >
            <Lightbulb size={20} />
            {suggestions.filter(s => s.status === 'new' && s.author_id !== user?.id).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full text-[9px] font-black text-black flex items-center justify-center">
                {suggestions.filter(s => s.status === 'new' && s.author_id !== user?.id).length}
              </span>
            )}
          </button>

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
          
          <div className="flex flex-col items-end gap-2">
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
            {monthFiles.length > 0 && (
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => setShowFileBadges(v => !v)}
                  className="flex items-center gap-1 text-[9px] font-bold text-white/30 hover:text-white/60 transition-colors"
                >
                  {showFileBadges ? <EyeOff size={10} /> : <Eye size={10} />}
                  {showFileBadges ? 'Ocultar arquivos' : `${monthFiles.length} arquivo${monthFiles.length > 1 ? 's' : ''}`}
                </button>
                {showFileBadges && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {monthFiles.map(({ name, type }) => (
                      <span key={name} className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border"
                        style={{
                          background: type === 'credit_card' ? 'rgba(139,92,246,0.15)' : type === 'investment' ? 'rgba(0,210,255,0.15)' : 'rgba(16,185,129,0.15)',
                          borderColor: type === 'credit_card' ? 'rgba(139,92,246,0.4)' : type === 'investment' ? 'rgba(0,210,255,0.4)' : 'rgba(16,185,129,0.4)',
                          color: type === 'credit_card' ? '#a78bfa' : type === 'investment' ? '#00d2ff' : '#6ee7b7',
                        }}>
                        <FileText size={8} />
                        {name.length > 30 ? name.slice(0, 27) + '...' : name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          <motion.div variants={itemVariants} className="md:col-span-8 glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10 flex flex-col gap-6">

              {/* Header: label + period + erosion badge */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className={`flex items-center gap-2 font-bold tracking-[0.2em] text-[10px] uppercase ${aggregates.patrimonioErosion ? 'text-error' : 'text-primary'}`}>
                  <Activity size={12} /> Saldo Líquido do Mês
                </div>
                <div className="flex items-center gap-2">
                  {aggregates.patrimonioErosion && (
                    <span className="flex items-center gap-1 bg-error/15 border border-error/30 text-error px-2 py-0.5 rounded-full text-[9px] font-black">
                      ⚠ Erosão de patrimônio
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    {selectedMonth ? new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>

              {/* Big number */}
              <div className={`text-[4rem] md:text-[5rem] leading-none font-black tracking-tighter text-glow ${
                aggregates.patrimonioErosion ? 'text-error'
                : aggregates.balance >= 0    ? 'text-success'
                : 'text-error'
              }`}>
                {maskBRL(aggregates.balance, hideValues)}
              </div>

              {/* Expense ratio bar */}
              {aggregates.income > 0 && (() => {
                const pct = Math.min(100, Math.round((aggregates.expense / aggregates.income) * 100));
                const barColor = pct <= 60 ? '#4ade80' : pct <= 85 ? '#facc15' : '#f87171';
                return (
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-white/30 mb-1.5 uppercase tracking-widest">
                      <span>Comprometimento da renda</span>
                      <span style={{ color: barColor }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Sub-cards: Entradas / Saídas / Cofrinho */}
              <div className="grid grid-cols-3 gap-3">

                {/* Entradas */}
                <button
                  onClick={() => {
                    setTypeFilter('receitas');
                    setCategoryFilter([]);
                    setTimeout(() => transactionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  }}
                  className="group/card text-left glass p-4 rounded-2xl border border-transparent hover:border-success/40 hover:bg-success/5 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-success font-bold text-[9px] uppercase tracking-widest mb-2">
                    <ArrowUpRight size={11} /> Entradas
                  </div>
                  <p className="text-lg font-black text-white leading-none">{maskBRL(aggregates.income, hideValues)}</p>
                  <p className="text-[8px] text-white/20 mt-1 font-medium">ver transações →</p>
                </button>

                {/* Saídas */}
                <button
                  onClick={() => {
                    setTypeFilter('despesas');
                    setCategoryFilter([]);
                    setTimeout(() => categoryChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  }}
                  className="group/card text-left glass p-4 rounded-2xl border border-transparent hover:border-error/40 hover:bg-error/5 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-error font-bold text-[9px] uppercase tracking-widest mb-2">
                    <ArrowDownRight size={11} /> Saídas
                  </div>
                  <p className="text-lg font-black text-white leading-none">{maskBRL(aggregates.expense, hideValues)}</p>
                  <p className="text-[8px] text-white/20 mt-1 font-medium">ver por categoria →</p>
                </button>

                {/* Cofrinho */}
                <button
                  onClick={() => {
                    setTypeFilter('investimentos');
                    setCategoryFilter([]);
                    setTimeout(() => transactionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  }}
                  className="group/card text-left glass p-4 rounded-2xl border border-transparent hover:border-cyan-400/40 hover:bg-cyan-400/5 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-widest mb-2" style={{ color: '#00d2ff' }}>
                    <PiggyBank size={11} /> Cofrinho
                  </div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold" style={{ color: '#f8717180' }}>Resgates</span>
                    <span className="text-xs font-black text-white">{maskBRL(aggregates.savingsIn, hideValues)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-bold" style={{ color: '#4ade8080' }}>Aplicações</span>
                    <span className="text-xs font-black text-white">{maskBRL(aggregates.savingsOut, hideValues)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-1.5 flex items-center justify-between">
                    <span className="text-[8px] font-bold" style={{ color: '#00d2ff80' }}>Saldo</span>
                    <span className="text-sm font-black" style={{
                      color: aggregates.savingsNet <= 0 ? '#4ade80' : '#f87171'
                    }}>
                      {maskBRL(Math.abs(aggregates.savingsNet), hideValues)}
                      <span className="text-[8px] ml-0.5">{aggregates.savingsNet <= 0 ? '▲' : '▼'}</span>
                    </span>
                  </div>
                  {aggregates.patrimonioErosion && (
                    <p className="text-[7px] text-error/60 font-bold mt-1 leading-tight">Resgate cobriu déficit</p>
                  )}
                </button>

              </div>

              {/* Previsões preditivas — Prophet (preferencial) ou modelos locais */}
              {(prophetPredictions || predictions) && (canAccess('prophet') ? (() => {
                const fmt = (v) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
                const sign = (v) => v >= 0 ? '+' : '−';

                // Fonte: Prophet se disponível, senão modelos locais
                const usingProphet = !!prophetPredictions;
                const source = usingProphet
                  ? 'Prophet · Meta AI · feriados BR'
                  : 'Holt · Sazonalidade · Monte Carlo';

                let items;

                if (usingProphet) {
                  const { balance } = prophetPredictions;
                  const levels = [
                    { data: balance.short,  label: 'Curto prazo',  horizon: balance.short.label },
                    { data: balance.medium, label: 'Médio prazo',  horizon: balance.medium.label },
                    { data: balance.long,   label: 'Longo prazo',  horizon: '12 meses' },
                  ];
                  items = [
                    ...levels.map(({ data, label, horizon }) => {
                      const level = data.base >= 0 ? 'success' : 'error';
                      const text = `Saldo projetado: ${sign(data.base)}${fmt(data.base)} `
                        + `(conservador ${sign(data.low)}${fmt(data.low)} · `
                        + `otimista ${sign(data.high)}${fmt(data.high)}).`;
                      return { label, horizon, text, level };
                    }),
                    // P4 e P5 sempre vêm dos modelos locais (não dependem do Prophet)
                    ...(predictions ? [
                      { label: 'Concentração', horizon: 'HHI',        ...predictions.p4 },
                      { label: 'Equilíbrio',   horizon: 'Reserva 6×', ...predictions.p5 },
                    ] : []),
                  ];
                } else {
                  items = [
                    { label: 'Curto prazo',   horizon: '1–3 meses',  ...predictions.p1 },
                    { label: 'Médio prazo',   horizon: '3–6 meses',  ...predictions.p2 },
                    { label: 'Longo prazo',   horizon: '12 meses',   ...predictions.p3 },
                    { label: 'Concentração',  horizon: 'HHI',        ...predictions.p4 },
                    { label: 'Equilíbrio',    horizon: 'Reserva 6×', ...predictions.p5 },
                  ];
                }

                // Cor de status (ponto indicador)
                const statusDot = {
                  success: '#4ade80',
                  error:   '#f87171',
                  warning: '#facc15',
                  primary: '#818cf8',
                  neutral: '#64748b',
                };

                // Cor de acento distinta por slot (P1→P5), independente do status
                const slotAccents = [
                  { color: '#22d3ee', bg: 'rgba(34,211,238,0.06)',  border: 'rgba(34,211,238,0.22)'  }, // cyan   — Curto prazo
                  { color: '#a78bfa', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.22)' }, // violet — Médio prazo
                  { color: '#6366f1', bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.22)'  }, // indigo — Longo prazo
                  { color: '#fb923c', bg: 'rgba(251,146,60,0.06)',  border: 'rgba(251,146,60,0.22)'  }, // orange — Concentração
                  { color: '#34d399', bg: 'rgba(52,211,153,0.06)',  border: 'rgba(52,211,153,0.22)'  }, // emerald — Equilíbrio
                ];

                // Tooltips explicativos por slot
                const slotTips = [
                  'Holt Double Exponential Smoothing com índice sazonal por mês calendário. Projeta o saldo do próximo mês ajustando tendência e padrões históricos de gastos.',
                  'Índice sazonal calculado com 6+ meses de histórico. Identifica o mês de pico de gastos e projeta o saldo acumulado dos próximos 3 meses.',
                  'Monte Carlo: 1.000 simulações × 12 meses com distribuição Normal. P50 = cenário base · P10 = pessimista · P90 = otimista. Quanto mais histórico, mais preciso.',
                  'Índice Herfindahl-Hirschman (HHI). Mede diversificação: HHI < 0,20 = bem distribuído · 0,20–0,35 = moderado · > 0,35 = risco de concentração setorial.',
                  'Padrão CFP®: reserva de emergência ideal = 6× despesa mensal média. Calcula em quantos meses o superávit atual cobre essa meta de segurança.',
                ];

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 flex items-center gap-1.5">
                        <Zap size={9} /> Projeções
                      </p>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                        usingProphet
                          ? 'text-violet-400 border-violet-400/30 bg-violet-400/10'
                          : 'text-white/20 border-white/10 bg-transparent'
                      }`}>
                        {prophetLoading ? '⟳ calculando...' : source}
                      </span>
                    </div>

                    {prophetLoading ? (
                      <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-3 h-3 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
                        <p className="text-[10px] text-white/40">Prophet calculando projeções...</p>
                      </div>
                    ) : items.map((item, i) => {
                      const accent = slotAccents[i] || slotAccents[4];
                      const dot    = statusDot[item.level] || statusDot.neutral;
                      const tip    = slotTips[i] || '';
                      return (
                        <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border" style={{ background: accent.bg, borderColor: accent.border }}>
                          {/* Status dot */}
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: accent.color }}>{item.label}</span>
                              <span className="text-[8px] text-white/20">{item.horizon}</span>
                            </div>
                            <p className="text-[10px] text-white/70 leading-snug">{item.text}</p>
                          </div>
                          {/* Info icon com tooltip de metodologia */}
                          <div className="relative group/ptip shrink-0 mt-0.5">
                            <Info size={10} className="transition-colors cursor-help" style={{ color: `${accent.color}60` }}
                              onMouseEnter={e => e.currentTarget.style.color = accent.color}
                              onMouseLeave={e => e.currentTarget.style.color = `${accent.color}60`}
                            />
                            <div className="pointer-events-none absolute bottom-full right-0 mb-2 z-50 w-64 opacity-0 group-hover/ptip:opacity-100 transition-opacity duration-200">
                              <div className="rounded-xl px-3 py-2.5 shadow-xl" style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.12)' }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: accent.color }}>{item.label}</p>
                                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{tip}</p>
                              </div>
                              <div className="w-2 h-2 rotate-45 ml-auto mr-1 -mt-1" style={{ background: '#1e2433', borderBottom: '1px solid rgba(255,255,255,0.12)', borderRight: '1px solid rgba(255,255,255,0.12)' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <FeatureGate canAccess={false} requiredPlan="private" label="Projeções Preditivas — Prophet · Monte Carlo · HHI" />
              ))}

            </div>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none group-hover:from-primary/20 transition-all"></div>
          </motion.div>

          {/* New Component: Health Gauge */}
          <motion.div variants={itemVariants} className="md:col-span-4 glass-card rounded-[2.5rem] p-8 flex flex-col border-t border-t-white/10 shadow-2xl">
            <div className="flex flex-col items-center justify-center mb-4">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">Saúde Financeira</h3>
              <HealthIndicator
                income={aggregates.income}
                expense={aggregates.expense}
                savingsIn={aggregates.savingsIn}
                savingsOut={aggregates.savingsOut}
                topCategories={topCategories}
                comparativeData={comparativeData}
              />
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-white/10 my-3"></div>

            {/* Resumo */}
            <div className="mt-2">
              <h3 className="text-xs font-black text-nubank-light flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
                <Sparkles size={14} /> Resumo
              </h3>
              <div className="space-y-3">
                {(() => {
                  const items = [];
                  const { income, expense } = aggregates;

                  // 1. Este mês
                  const topCat = topCategories[0]?.[0];
                  const topCatPct = income > 0 && topCategories[0]?.[1]
                    ? ((topCategories[0][1] / income) * 100).toFixed(0)
                    : null;
                  if (expense > income && income > 0) {
                    items.push({ icon: AlertTriangle, level: 'error',
                      text: `Este mês: gastos superaram a renda em R$ ${(expense - income).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Principal categoria: ${topCat || '—'}.` });
                  } else if (income > 0) {
                    items.push({ icon: Shield, level: 'success',
                      text: `Este mês: ${((expense / income) * 100).toFixed(0)}% da renda comprometida. ${topCat ? `Maior gasto: ${topCat}${topCatPct ? ` (${topCatPct}% da renda)` : ''}.` : ''}` });
                  }

                  // 2. Trimestre
                  if (comparativeData?.quarter) {
                    const { changes, curr } = comparativeData.quarter;
                    const expDelta = changes.expense;
                    const trend = expDelta > 5 ? 'subiram' : expDelta < -5 ? 'caíram' : 'estáveis';
                    const trendLevel = expDelta > 10 ? 'error' : expDelta > 5 ? 'warning' : 'success';
                    items.push({ icon: TrendingUp, level: trendLevel,
                      text: `Trimestre: despesas ${trend} ${Math.abs(expDelta).toFixed(0)}% vs trimestre anterior. Saldo acumulado: R$ ${curr.balance.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.` });
                  }

                  // 3. Ano
                  if (comparativeData?.year) {
                    const { changes, curr } = comparativeData.year;
                    const savingsRate = curr.income > 0 ? ((curr.savingsOut / curr.income) * 100).toFixed(1) : '0';
                    const yoyExp = changes.expense;
                    items.push({ icon: Activity, level: yoyExp > changes.income ? 'warning' : 'primary',
                      text: `Ano: gastos ${yoyExp > 0 ? '+' : ''}${yoyExp.toFixed(0)}% vs ano anterior${changes.income !== 0 ? `, renda ${changes.income > 0 ? '+' : ''}${changes.income.toFixed(0)}%` : ''}. Taxa de poupança: ${savingsRate}% da renda.` });
                  }

                  return items.map((ins, i) => {
                    const Icon = ins.icon;
                    const colorMap = {
                      success: 'border-l-success bg-success/5 text-success',
                      error:   'border-l-error bg-error/5 text-error',
                      warning: 'border-l-yellow-500 bg-yellow-500/5 text-yellow-400',
                      primary: 'border-l-primary bg-primary/5 text-primary',
                    };
                    const cls = colorMap[ins.level] || colorMap.primary;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-l-[3px] bg-white/[0.03] transition-all hover:bg-white/[0.05] shadow-sm ${cls}`}>
                        <div className={`p-1.5 rounded-lg opacity-80 ${cls}`}><Icon size={14} /></div>
                        <p className="text-[11px] font-bold leading-snug text-white/90">{ins.text}</p>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* Comparative Analysis */}
        {comparativeData && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Análise Comparativa</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Mês', key: 'month', data: comparativeData.month },
                { label: 'Trimestre', key: 'quarter', data: comparativeData.quarter },
                { label: 'Ano', key: 'year', data: comparativeData.year },
              ].map(({ label, data: d }) => {
                const balChange = d.changes.balance;
                const incChange = d.changes.income;
                const expChange = d.changes.expense;
                const fmt = (v) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                const badge = (v) => (
                  <span className={`flex items-center gap-0.5 text-[10px] font-black ${v >= 0 ? 'text-success' : 'text-error'}`}>
                    {v >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(v).toFixed(1)}%
                  </span>
                );
                return (
                  <div key={label} className="glass-card rounded-[2rem] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{label}</span>
                      <div className="text-right">
                        <p className="text-[9px] text-white/70">{d.labels[0]}</p>
                        <p className="text-[9px] text-white/50">vs {d.labels[1]}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/70">Saldo</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{fmt(d.curr.balance)}</span>
                          {badge(balChange)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-success/80">Entradas</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{fmt(d.curr.income)}</span>
                          {badge(incChange)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-error/80">Saídas</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{fmt(d.curr.expense)}</span>
                          <span className={`flex items-center gap-0.5 text-[10px] font-black ${expChange <= 0 ? 'text-success' : 'text-error'}`}>
                            {expChange <= 0 ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                            {Math.abs(expChange).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, d.curr.expense > 0 && d.curr.income > 0 ? (d.curr.expense / d.curr.income) * 100 : 0)}%`,
                            background: d.curr.expense / d.curr.income > 0.9 ? '#ef4444' : d.curr.expense / d.curr.income > 0.7 ? '#facc15' : '#10b981'
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-white/50 text-right">
                        {d.curr.income > 0 ? ((d.curr.expense / d.curr.income) * 100).toFixed(0) : 0}% das entradas comprometidas
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Secondary Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          
          {/* Charts Card */}
          <motion.div ref={categoryChartRef} variants={itemVariants} className="lg:col-span-7">
            <CategoryChart
              chartData={chartData}
              selectedCategories={categoryFilter}
              onCategoryClick={name => {
                setCategoryFilter(prev =>
                  prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
                );
                setTypeFilter('despesas');
                setTimeout(() => transactionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
            />
          </motion.div>

          {/* Transactions List with Search + Filter */}
          <motion.div ref={transactionsRef} variants={itemVariants} className="lg:col-span-5 glass-card p-8 rounded-[2.5rem] flex flex-col">
            {/* Header: Title + Search + Filter toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="font-black text-xl text-white">Transações</h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-primary/50 transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
                    showFilters
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal size={12} />
                  Filtros
                </button>
              </div>
            </div>

            {/* Type Filter Pills + Sort controls */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex gap-2">
                {[
                  { key: 'todos',    label: 'Todos' },
                  { key: 'receitas', label: 'Entradas' },
                  { key: 'despesas', label: 'Saídas' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setTypeFilter(key); setCategoryFilter([]); }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
                      key === 'receitas'
                        ? typeFilter === key
                          ? 'bg-success/20 border-success text-success shadow-sm shadow-success/20'
                          : 'bg-success/5 border-success/30 text-success/60 hover:bg-success/10 hover:text-success hover:border-success/60'
                        : key === 'despesas'
                          ? typeFilter === key
                            ? 'bg-error/20 border-error text-error shadow-sm shadow-error/20'
                            : 'bg-error/5 border-error/30 text-error/60 hover:bg-error/10 hover:text-error hover:border-error/60'
                          : typeFilter === key
                            ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/20'
                            : 'bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Sort controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSortField(f => f === 'date' ? 'amount' : 'date')}
                  className="px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white transition-all"
                >
                  {sortField === 'date' ? 'Data' : 'Valor'}
                </button>
                <button
                  onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white transition-all"
                >
                  {sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                </button>
              </div>
            </div>

            {/* Expandable Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3">
                    {/* Value Range */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Faixa de Valor</p>
                      <div className="flex items-center gap-2 w-full overflow-hidden">
                        {/* Mínimo */}
                        <div className="relative flex-1 min-w-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40 pointer-events-none select-none">R$</span>
                          <input
                            type="number"
                            placeholder="Mínimo"
                            value={minAmount}
                            onChange={e => setMinAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-2 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                        <span className="text-white/30 text-xs shrink-0">—</span>
                        {/* Máximo */}
                        <div className="relative flex-1 min-w-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40 pointer-events-none select-none">R$</span>
                          <input
                            type="number"
                            placeholder="Máximo"
                            value={maxAmount}
                            onChange={e => setMaxAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-2 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                        {(minAmount !== '' || maxAmount !== '') && (
                          <button
                            onClick={() => { setMinAmount(''); setMaxAmount(''); }}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all shrink-0"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Categorias</p>
                        {categoryFilter.length > 0 && (
                          <button onClick={() => setCategoryFilter([])} className="text-[10px] text-primary hover:text-primary/70 transition-colors">
                            Limpar
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                        {[...new Set(monthlyData.map(item => smartCategory(item)))].sort().map(cat => {
                          const color = CATEGORY_COLORS[cat] || '#94a3b8';
                          const active = categoryFilter.includes(cat);
                          return (
                            <button
                              key={cat}
                              onClick={() => setCategoryFilter(prev =>
                                active ? prev.filter(c => c !== cat) : [...prev, cat]
                              )}
                              className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border transition-all ${
                                active ? '' : 'text-on-surface-variant border-outline-variant bg-transparent hover:text-white/70'
                              }`}
                              style={active ? { color, borderColor: color, background: `${color}25` } : undefined}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar max-h-[400px]">
              <AnimatePresence>
                {(() => {
                  let visibleItems = monthlyData.filter(item => {
                    const cls = classifyTransaction(item);
                    if (typeFilter === 'receitas' && cls !== 'income') return false;
                    if (typeFilter === 'despesas' && cls !== 'expense') return false;
                    if (typeFilter === 'investimentos' && cls !== 'savings_in' && cls !== 'savings_out') return false;
                    const abs = Math.abs(item.amount);
                    if (minAmount !== '' && !isNaN(parseFloat(minAmount)) && abs < parseFloat(minAmount)) return false;
                    if (maxAmount !== '' && !isNaN(parseFloat(maxAmount)) && abs > parseFloat(maxAmount)) return false;
                    if (categoryFilter.length > 0 && !categoryFilter.includes(smartCategory(item))) return false;
                    return true;
                  });
                  visibleItems = [...visibleItems].sort((a, b) => {
                    const cmp = sortField === 'amount'
                      ? Math.abs(a.amount) - Math.abs(b.amount)
                      : (a.transaction_date || '').localeCompare(b.transaction_date || '');
                    return sortDir === 'asc' ? cmp : -cmp;
                  });

                  if (visibleItems.length === 0) return (
                    <p className="text-on-surface-variant italic text-sm">Nenhuma transação encontrada.</p>
                  );

                  return visibleItems.map((item, i) => {
                    const cls = classifyTransaction(item);
                    const isPos = item.amount > 0;
                    const cat = smartCategory(item);

                    const catColor = CATEGORY_COLORS[cat] || '#94a3b8';
                    const bank = item.bank || (item.metadata?.banco) || null;

                    const styles = {
                      savings_out: { icon: <PiggyBank size={18} />, amountColor: 'text-cyan-400' },
                      savings_in:  { icon: <PiggyBank size={18} />, amountColor: 'text-cyan-400' },
                      income:      { icon: <ArrowUpRight size={18} />, amountColor: 'text-success' },
                      expense:     { icon: <TrendingDown size={18} />, amountColor: 'text-error' },
                    }[cls] || { icon: <TrendingDown size={18} />, amountColor: 'text-error' };

                    // Despesas usam cor da categoria; entradas/investimentos mantêm cor semântica
                    const iconColor   = cls === 'expense' ? catColor : cls === 'income' ? '#4ade80' : '#22d3ee';
                    const borderColor = cls === 'expense' ? `${catColor}25` : cls === 'income' ? 'rgba(74,222,128,0.15)' : 'rgba(34,211,238,0.15)';
                    const bgColor     = cls === 'expense' ? `${catColor}08` : cls === 'income' ? 'rgba(74,222,128,0.06)' : 'rgba(34,211,238,0.06)';

                    const isProjected = item.metadata?.projetado === true;
                    return (
                      <motion.div
                        key={item.id || i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        layout
                        onClick={() => !isProjected && setEditModal(item)}
                        className={`group flex items-start gap-3 p-4 rounded-2xl transition-all border ${isProjected ? 'opacity-60 cursor-default border-dashed' : 'hover:brightness-110 cursor-pointer'}`}
                        style={{ background: bgColor, borderColor }}
                      >
                        {/* Ícone */}
                        <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${iconColor}18`, color: iconColor }}>
                          {styles.icon}
                        </div>

                        {/* Descrição + categoria + banco */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span
                              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                              style={{ color: catColor, borderColor: `${catColor}40`, background: `${catColor}15` }}
                            >
                              {cat}
                            </span>
                            {isProjected && (
                              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-dashed border-white/30 text-white/40">
                                projeção
                              </span>
                            )}
                            {bank && !isProjected && (
                              <span className="text-[9px] font-semibold text-white/30">
                                {bank}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Valor + data + edit hint */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                          <p className={`font-black text-sm whitespace-nowrap ${styles.amountColor}`}>
                            {hideValues ? 'R$ •••••' : `${isPos ? '+' : '−'} R$ ${Math.abs(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </p>
                          <p className="text-[10px] font-medium text-white/40">
                            {formatDate(item.transaction_date)}
                          </p>
                          {!isProjected && <span className="text-[9px] text-white/20 group-hover:text-white/50 transition-colors mt-0.5">editar</span>}
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

      {/* Members Modal */}
      <AnimatePresence>
        {showMembersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => { setShowMembersModal(false); setInviteLink(''); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              className="glass-card rounded-[2rem] p-8 w-full max-w-md relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => { setShowMembersModal(false); setInviteLink(''); }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-on-surface-variant transition-all"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Users size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-black text-white text-lg leading-none">Membros da Conta</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {isOwner ? 'Gerencie quem acessa sua conta' : 'Você está em uma conta compartilhada'}
                  </p>
                </div>
              </div>

              {/* Invite form — owner only */}
              {isOwner && (
                <form onSubmit={handleInvite} className="mb-6">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2 block">
                    Convidar por e-mail
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/30"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="px-4 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {inviteLoading
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><UserPlus size={14} /> Convidar</>}
                    </button>
                  </div>

                  {/* Generated link */}
                  {inviteLink && (
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1.5">
                        Link de convite gerado
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-white/70 flex-1 truncate font-mono">{inviteLink}</p>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-white transition-all"
                        >
                          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 mt-1.5">
                        O e-mail foi enviado automaticamente. Se não chegou, copie o link acima.
                      </p>
                    </div>
                  )}
                </form>
              )}

              {/* Members list */}
              <div>
                <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-3">
                  {isOwner ? 'Convites' : 'Conta'}
                </p>
                {!isOwner && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
                    Você está acessando uma conta compartilhada.
                  </div>
                )}
                {isOwner && members.length === 0 && (
                  <p className="text-sm text-on-surface-variant italic">Nenhum convite enviado ainda.</p>
                )}
                {isOwner && members.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-2">
                    <Link size={14} className={m.accepted_at ? 'text-success' : 'text-on-surface-variant'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{m.invitee_email}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {m.accepted_at
                          ? `Aceito em ${new Date(m.accepted_at).toLocaleDateString('pt-BR')}`
                          : `Pendente — expira ${new Date(m.expires_at).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      m.accepted_at ? 'bg-success/20 text-success' : 'bg-yellow-400/20 text-yellow-400'
                    }`}>
                      {m.accepted_at ? 'Ativo' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat Drawer */}
      <ChatDrawer
        open={showChat}
        onClose={() => setShowChat(false)}
        aggregates={aggregates}
        topCategories={topCategories}
        selectedMonth={selectedMonth}
        userEmail={user?.email}
      />

      {/* ── Soraya IA Drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSoraya && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[70] backdrop-blur-sm"
              onClick={() => setShowSoraya(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 h-full w-full max-w-md z-[80] glass border-l border-white/10 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                    <Lightbulb size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-base">Soraya IA</h2>
                    <p className="text-[10px] text-white/40 font-medium">Sugestões para a plataforma</p>
                  </div>
                </div>
                <button onClick={() => setShowSoraya(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Lista de sugestões */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                {suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3 text-white/30">
                    <Lightbulb size={32} />
                    <p className="text-sm font-medium">Nenhuma sugestão ainda.</p>
                  </div>
                ) : suggestions.map(s => {
                  const isMine = s.author_id === user?.id;
                  const statusStyles = {
                    new:         { label: 'Nova',         cls: `bg-yellow-400/20 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'} border-yellow-500/40`,  icon: <Clock size={10} /> },
                    read:        { label: 'Lida',         cls: 'bg-white/10 text-white/40 border-white/10',              icon: <Clock size={10} /> },
                    implemented: { label: 'Implementada', cls: 'bg-success/15 text-success border-success/30',           icon: <CheckCircle size={10} /> },
                    archived:    { label: 'Arquivada',    cls: 'bg-white/5 text-white/25 border-white/10',               icon: <Archive size={10} /> },
                  }[s.status] || { label: s.status, cls: 'bg-white/10 text-white/40 border-white/10', icon: null };

                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl border transition-all ${isMine ? 'bg-primary/5 border-primary/20' : 'bg-white/[0.04] border-white/10'}`}
                    >
                      {/* Meta */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isMine ? 'bg-primary/20 text-primary' : 'bg-yellow-400/20 text-yellow-400'}`}>
                            {s.author_name}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${statusStyles.cls}`}>
                          {statusStyles.icon} {statusStyles.label}
                        </span>
                      </div>
                      {/* Conteúdo */}
                      <p className="text-sm text-white/80 leading-relaxed">{s.content}</p>
                      {/* Ações (só quem não escreveu pode mudar status) */}
                      {!isMine && s.status !== 'archived' && (
                        <div className="flex gap-2 mt-3">
                          {s.status !== 'implemented' && (
                            <button
                              onClick={() => setSuggestionStatus(s.id, 'implemented')}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-success/10 border border-success/20 text-success hover:bg-success/20 transition-all"
                            >
                              <CheckCircle size={10} /> Implementar
                            </button>
                          )}
                          <button
                            onClick={() => setSuggestionStatus(s.id, 'archived')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-all"
                          >
                            <Archive size={10} /> Arquivar
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Input nova sugestão */}
              <div className="px-6 py-4 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                  Nova sugestão — {authorName(user?.email)}
                </p>
                <textarea
                  value={newSuggestion}
                  onChange={e => setNewSuggestion(e.target.value)}
                  placeholder="Descreva sua sugestão para a plataforma..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50 transition-all placeholder:text-white/20 resize-none"
                />
                <button
                  onClick={submitSuggestion}
                  disabled={!newSuggestion.trim() || suggestionLoading}
                  className="mt-2 w-full py-2.5 rounded-xl font-black text-sm bg-yellow-400 hover:bg-yellow-300 text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {suggestionLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Lightbulb size={14} /> Enviar Sugestão</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pluggy Connect Widget */}
      {pluggyToken && (
        <PluggyConnect
          connectToken={pluggyToken}
          includeSandbox={false}
          onSuccess={handlePluggySuccess}
          onError={() => {
            setToast({ message: 'Erro ao conectar banco.', type: 'error' });
            setPluggyToken(null);
            setPluggyConnecting(false);
          }}
          onClose={() => {
            setPluggyToken(null);
            setPluggyConnecting(false);
          }}
        />
      )}

      {/* Hidden file inputs */}
      <input id="fileInputExtrato"     type="file" accept=".csv,.pdf,.ofx,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFileUpload(e, 'extrato')} />
      <input id="fileInputCartao"      type="file" accept=".csv,.pdf,.ofx,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFileUpload(e, 'cartao')} />
      <input id="fileInputInvestimento" type="file" accept=".csv,.pdf,.ofx,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFileUpload(e, 'investimento')} />

      {/* QuickActionsBar (Fixed Bottom Glass) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="glass p-2 rounded-2xl border border-white/10 shadow-3xl flex items-center gap-1.5"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-5 py-3 text-white text-sm font-bold">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processando...
            </div>
          ) : (
            <>
              {/* Extrato — azul */}
              <label htmlFor="fileInputExtrato" className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-500/30">
                <Upload size={13} />
                <FileText size={13} />
                <span className="hidden sm:inline">Extrato</span>
              </label>

              {/* Cartão — roxo */}
              <label htmlFor="fileInputCartao" className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-violet-500/30">
                <Upload size={13} />
                <CreditCard size={13} />
                <span className="hidden sm:inline">Cartão</span>
              </label>

              {/* Investimentos — ciano */}
              <label htmlFor="fileInputInvestimento" className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/30">
                <Upload size={13} />
                <Landmark size={13} />
                <span className="hidden sm:inline">Investimentos</span>
              </label>

              {/* Separador */}
              <div className="w-px h-6 bg-white/10 mx-1" />

              {/* Conectar banco — verde */}
              <button
                onClick={handleConnectBank}
                disabled={pluggyConnecting}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/30"
                title={canAccess('pluggy') ? 'Conectar banco automaticamente' : 'Disponível no plano Private'}
              >
                <Link size={13} />
                <span className="hidden sm:inline">{pluggyConnecting ? 'Conectando...' : 'Conectar banco'}</span>
              </button>
            </>
          )}
        </motion.div>
      </div>

      {/* Ajuda IA — FAB flutuante canto inferior direito */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={() => canAccess('chat_ia') ? setShowChat(true) : navigate('/pricing')}
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-xl shadow-secondary/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        title={canAccess('chat_ia') ? 'Ajuda IA' : 'Chat IA — Plano Private'}

      >
        <MessageSquare size={22} />
        <span className="absolute right-16 bg-surface border border-outline-variant text-on-surface text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Ajuda IA
        </span>
      </motion.button>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editModal && (
          <EditTransactionModal
            item={editModal}
            onClose={() => setEditModal(null)}
            onSave={handleEditSave}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
