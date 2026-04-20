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
  CheckCircle, Archive, Clock,
  Home, LayoutList, BarChart2, User, Bell, Settings, Lock, HelpCircle,
  Crown, Star, TrendingUp as TrendUpIcon, BrainCircuit,
  Target, Flame, Trophy, Award, Gem
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
  'Refeições':             '#fb923c', // laranja-claro (restaurantes & delivery)
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

/* Family Office — paleta exclusiva marrom/ocre/areia */
const CATEGORY_COLORS_WARM = {
  'Alimentação':           '#f59e0b', // amber
  'Refeições':             '#d4a857', // golden sand (restaurantes & delivery)
  'Transporte':            '#b8730a', // dark ochre
  'Saúde':                 '#c68642', // caramel
  'Moradia':               '#7c4a2d', // brown
  'Lazer':                 '#d4b28c', // sand
  'Lazer & Entretenimento':'#d4b28c', // sand
  'Educação':              '#cd7f32', // bronze
  'Transferência Interna': '#8a6a50', // muted brown
  'Investimentos':         '#e8a020', // ochre
  'Telecomunicações':      '#c49a4a', // caramel-ochre
  'Cartão de Crédito':     '#6b3425', // mahogany
  'Impostos & Encargos':   '#a0522d', // sienna (mantém tom quente no lugar do vermelho)
  'Viagem & Hospedagem':   '#f0c040', // light gold
  'Vestuário':             '#e8c090', // light sand
  'Pet':                   '#b87333', // copper
  'Assinaturas':           '#d2a85a', // warm tan
  'Serviços Financeiros':  '#a0522d', // sienna
  'Poupança':              '#daa520', // goldenrod
  'Casa & Utilidades':     '#8b5e3c', // warm umber
  'Seguros':               '#d4a857', // golden sand
  'Salário & Receitas':    '#c49a4a', // caramel (entradas)
  'Assinaturas & SaaS':    '#b8860b', // dark goldenrod
  'Outros':                '#8a6a50', // muted brown
};

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const CHAT_URL = import.meta.env.VITE_N8N_CHAT_URL;

// ── Hook Model — Milestones de Streak ──
const STREAK_MILESTONES = [
  { days: 3,   icon: '🔍', reward: 'Diagnóstico IA',        desc: 'Análise personalizada dos seus padrões de gasto',    type: 'insight' },
  { days: 7,   icon: '📊', reward: 'Relatório Semanal',      desc: 'Resumo inteligente da sua semana financeira',        type: 'report'  },
  { days: 14,  icon: '🏅', reward: 'Investidor Consistente', desc: 'Badge exclusivo de 2 semanas sem quebrar a série',   type: 'badge'   },
  { days: 30,  icon: '⚡', reward: 'Chat IA Desbloqueado',   desc: '30 perguntas extras no consultor financeiro',        type: 'feature' },
  { days: 60,  icon: '💎', reward: 'Análise de Padrões',      desc: 'Insights de comportamento de 2 meses comparados',   type: 'premium' },
  { days: 100, icon: '🏆', reward: 'Maestro Financeiro',      desc: 'Badge lendário + acesso antecipado a novas funções', type: 'legend'  },
];

// ── Achievements / Badges ──
const BADGES_DEF = [
  { id: 'first_import',  Icon: Upload,    name: 'Primeiro Extrato',   desc: 'Importou o primeiro arquivo financeiro',       rarity: 'common' },
  { id: 'first_mission', Icon: Target,    name: 'Missão Aceita',       desc: 'Criou sua primeira missão financeira',         rarity: 'common' },
  { id: 'streak_3',      Icon: Flame,     name: '3 Dias Seguidos',     desc: 'Manteve a sequência por 3 dias',               rarity: 'common' },
  { id: 'streak_7',      Icon: Zap,       name: 'Uma Semana Inteira',  desc: 'Abriu o app todos os dias por 7 dias',         rarity: 'rare'   },
  { id: 'streak_14',     Icon: Crown,     name: 'Duas Semanas',        desc: 'Sequência de 14 dias sem quebrar',             rarity: 'epic'   },
  { id: 'score_80',      Icon: Gem,       name: 'Score de Elite',      desc: 'Atingiu saúde financeira ≥ 80 pontos',        rarity: 'rare'   },
  { id: 'saver',         Icon: PiggyBank, name: 'Poupador',            desc: 'Aplicações superaram as despesas no mês',     rarity: 'epic'   },
  { id: 'mission_done',  Icon: Trophy,    name: 'Missão Cumprida',     desc: 'Completou uma missão com sucesso',             rarity: 'rare'   },
];

const BADGE_RARITY_COLOR = {
  common: '#64748b',
  rare:   '#38bdf8',
  epic:   '#a855f7',
  legend: '#f59e0b',
};

const useBadges = () => {
  const [unlocked, setUnlocked] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('co_badges') || '{}'); } catch { return {}; }
  });
  const [newBadge, setNewBadge] = React.useState(null);

  const checkAndUnlock = React.useCallback((conditions = {}) => {
    // conditions: { hasImport, hasMission, streak, score, savingsOut, income, missionDone }
    const toUnlock = BADGES_DEF.filter(b => {
      if (unlocked[b.id]) return false;
      if (b.id === 'first_import'  && conditions.hasImport)           return true;
      if (b.id === 'first_mission' && conditions.hasMission)          return true;
      if (b.id === 'streak_3'      && (conditions.streak || 0) >= 3)  return true;
      if (b.id === 'streak_7'      && (conditions.streak || 0) >= 7)  return true;
      if (b.id === 'streak_14'     && (conditions.streak || 0) >= 14) return true;
      if (b.id === 'score_80'      && (conditions.score  || 0) >= 80) return true;
      if (b.id === 'saver'         && conditions.savingsOut > 0 && conditions.savingsOut > (conditions.income || 0)) return true;
      if (b.id === 'mission_done'  && conditions.missionDone)         return true;
      return false;
    });
    if (!toUnlock.length) return;
    const next = toUnlock[0];
    const now  = new Date().toISOString();
    const updated = { ...unlocked, [next.id]: { unlockedAt: now } };
    setUnlocked(updated);
    localStorage.setItem('co_badges', JSON.stringify(updated));
    setNewBadge(next);
    setTimeout(() => setNewBadge(null), 4200);
  }, [unlocked]);

  return { unlocked, newBadge, checkAndUnlock };
};

// Toast de desbloqueio de badge
const BadgeUnlockToast = ({ badge }) => {
  const rarityColor = BADGE_RARITY_COLOR[badge.rarity] || '#64748b';
  const { Icon } = badge;
  return (
    <motion.div
      key={badge.id}
      initial={{ opacity: 0, y: -60, scale: 0.85 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: -40, scale: 0.9  }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="fixed top-20 left-1/2 z-[9999] flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl"
      style={{
        transform: 'translateX(-50%)',
        background: 'rgba(10,14,26,0.97)',
        border: `1.5px solid ${rarityColor}50`,
        backdropFilter: 'blur(24px)',
        minWidth: 280,
      }}
    >
      {/* Ícone em círculo */}
      <motion.div
        className="shrink-0 rounded-2xl flex items-center justify-center"
        initial={{ rotate: -15, scale: 0.5 }}
        animate={{ rotate: 0,   scale: 1   }}
        transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
        style={{ width: 48, height: 48, background: `${rarityColor}20`, border: `1.5px solid ${rarityColor}50` }}
      >
        <Icon size={22} style={{ color: rarityColor }} strokeWidth={1.5} />
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: rarityColor }}>
          Conquista desbloqueada
        </p>
        <p className="text-sm font-black text-white leading-tight">{badge.name}</p>
        <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{badge.desc}</p>
      </div>

      {/* Shimmer */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.8, delay: 0.2 }}
        style={{ background: `radial-gradient(ellipse at 20% 50%, ${rarityColor}20, transparent 65%)` }}
      />
    </motion.div>
  );
};

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
  { cat: 'Refeições',            keywords: ['ifood', 'rappi', 'uber eats', 'restaurante', 'restaurant', 'lanchonete', 'delivery', 'pizza', 'hamburguer', 'burguer', 'sushi', 'churrascaria', 'churr', 'cafe', 'café', 'gastro', 'gourmet', 'spicy', 'marajoara', 'zig mona', 'jim.com', 't bone', 'hikari', 'pumila', 'rancho', 'tadeufelix', 'rodosnack', 'badaue', 'cbx'] },
  { cat: 'Alimentação',          keywords: ['padaria', 'mercado', 'supermercado', 'açougue', 'acougue', 'acougues', 'hortifruti', 'sacolao', 'sacolão', 'pão de açúcar', 'carrefour', 'extra ', 'walmart', 'atacadão', 'atacadao', 'sams club', 'costco', 'alimentos', 'loja onlin', 'mantiqueira', 'paes e doces', 'pães e doces'] },
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
  // Manually-set category always wins — never override with rules
  if (item.metadata?.category_manual && item.category) return item.category;
  const desc = (item.description || '').toLowerCase();
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
const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS).filter(c => c !== 'Outros').sort((a, b) => a.localeCompare(b, 'pt-BR'));

// Modal para editar modalidade + categoria de uma transação
const EditTransactionModal = ({ item, onClose, onSave, userCategories = [], userPlan = 'free' }) => {
  const { theme } = useApp();
  const isLight = theme === 'light';
  const isWarmModal = userPlan === 'family_office';
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

  const savingsHex    = isWarmModal ? '#d4a855' : '#22d3ee';
  const savingsAltHex = isWarmModal ? '#b8730a' : '#06b6d4';
  const modalityColor = {
    income:      '#4ade80',
    expense:     '#f87171',
    savings_out: savingsHex,
    savings_in:  savingsHex,
  }[modality] || '#94a3b8';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className={`relative z-10 w-full max-w-sm border rounded-3xl p-5 sm:p-6 shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#1a1f2e] border-white/10'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0 pr-3">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Editar Transação</p>
            <p className={`text-sm font-bold leading-snug line-clamp-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>{item.description}</p>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{formatDate(item.transaction_date)}</p>
          </div>
          <button onClick={onClose} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'}`}>
            <X size={14} />
          </button>
        </div>

        {/* Modalidade */}
        <div className="mb-4">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Modalidade</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MODALITY_LABELS).map(([key, label]) => {
              const colors = {
                income:      { bg: '#4ade8015', border: '#4ade8040', text: '#4ade80' },
                expense:     { bg: '#f8717115', border: '#f8717140', text: '#f87171' },
                savings_out: { bg: `${savingsHex}15`,    border: `${savingsHex}40`,    text: savingsHex    },
                savings_in:  { bg: `${savingsAltHex}10`, border: `${savingsAltHex}30`, text: savingsAltHex },
              }[key];
              return (
                <button
                  key={key}
                  onClick={() => setModality(key)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all border"
                  style={modality === key
                    ? { background: colors.bg, borderColor: colors.border, color: colors.text }
                    : isLight
                      ? { background: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.12)', color: 'rgba(15,23,42,0.5)' }
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
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Categoria</p>
          {!showCustom ? (
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-all appearance-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'}`}
            >
              {[...new Set([...ALL_CATEGORIES, ...userCategories])]
                .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                .map(c => (
                  <option key={c} value={c} style={{ background: isLight ? '#f8fafc' : '#1a1f2e' }}>{c}</option>
                ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Nome da categoria personalizada..."
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              autoFocus
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-all ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20'}`}
              style={{ WebkitTextFillColor: isLight ? '#1e293b' : '#ffffff', caretColor: isLight ? '#1e293b' : '#ffffff' }}
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
          <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${pinRule ? 'bg-primary border-primary' : isLight ? 'border-slate-300 bg-slate-100' : 'border-white/20 bg-white/5'}`} onClick={() => setPinRule(v => !v)}>
            {pinRule && <Check size={10} className="text-white" />}
          </div>
          <div>
            <p className={`text-xs font-semibold transition-colors ${isLight ? 'text-slate-600 group-hover:text-slate-900' : 'text-white/70 group-hover:text-white'}`}>Fixar para transações com esta descrição</p>
            <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Aplicar automaticamente em futuras importações</p>
          </div>
        </label>

        {/* Botões */}
        <div className="flex gap-2">
          <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}>
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


// Sub-component: Category Ranked Bar List
const CategoryChart = ({ chartData, onCategoryClick, selectedCategories, colorMap = CATEGORY_COLORS }) => {
  const [hovered, setHovered] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);
  const total    = chartData.reduce((s, d) => s + d.value, 0);
  const maxValue = chartData[0]?.value || 1;
  const visible  = showAll ? chartData : chartData.slice(0, 6);

  if (chartData.length === 0) return (
    <div className="glass-card p-6 rounded-[2.5rem] flex items-center justify-center h-40 text-on-surface-variant text-sm">
      Sem despesas neste mês.
    </div>
  );

  return (
    <div className="glass-card p-4 sm:p-6 rounded-[2.5rem]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-black text-lg text-white leading-tight">Categorias</h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Total · R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {chartData.length > 6 && (
          <button onClick={() => setShowAll(v => !v)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            {showAll ? 'Menos' : }
          </button>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        {visible.map((item, i) => {
          const color    = colorMap[item.name] || '#8884d8';
          const pct      = total > 0 ? (item.value / total) * 100 : 0;
          const barPct   = (item.value / maxValue) * 100;
          const isActive = selectedCategories?.includes(item.name);
          const isHov    = hovered === i;
          return (
            <motion.div key={item.name}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, delay: i * 0.04 }}
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer select-none"
              style={{
                background: isActive ?  : isHov ? 'rgba(255,255,255,0.05)' : 'transparent',
                outline: isActive ?  : 'none',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onCategoryClick?.(item.name)}
            >
              <span className="text-[11px] font-black w-4 text-right shrink-0 tabular-nums"
                style={{ color: i === 0 ? color : 'rgba(255,255,255,0.2)' }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold truncate"
                    style={{ color: isHov || isActive ? '#ffffff' : 'rgba(255,255,255,0.75)' }}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    {isHov && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {item.count} tx
                      </motion.span>
                    )}
                    <span className="text-xs font-bold text-white tabular-nums">
                      R$ {item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] font-bold w-9 text-right tabular-nums"
                      style={{ color: isHov || isActive ? color : 'rgba(255,255,255,0.35)' }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width:  }}
                    transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.05 }}
                    style={{ background: isHov || isActive ? color :  }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ── Cálculo do score extraído — usado pelo HealthIndicator e pelo ScoreBanner ──
const calcHealthScore = ({ income, expense, savingsIn, savingsOut, topCategories, comparativeData }) => {
  const expRatio  = income > 0 ? expense / income : (expense > 0 ? 1 : 0);
  const d1 = expRatio <= 0.50 ? 100 : expRatio <= 0.70 ? 80 : expRatio <= 0.85 ? 55 : expRatio <= 1.00 ? 25 : 0;

  const netApplied  = (savingsOut || 0) - (savingsIn || 0);
  const savingsRate = income > 0 ? netApplied / income : 0;
  const d2 = netApplied < 0 ? 10
           : savingsRate >= 0.20 ? 100 : savingsRate >= 0.10 ? 75
           : savingsRate >= 0.05 ? 50  : savingsRate >= 0.01 ? 25 : 0;

  const balance  = income - expense;
  const balRatio = income > 0 ? balance / income : (balance > 0 ? 1 : 0);
  const d3 = balRatio > 0.30 ? 100 : balRatio > 0.15 ? 75 : balRatio > 0.05 ? 50 : balRatio >= 0 ? 25 : 0;

  const mChg = comparativeData?.month?.changes;
  const d4 = !mChg ? 50
           : (mChg.expense < 0 && mChg.income > 0) ? 100
           : mChg.expense < 0 ? 70
           : Math.abs(mChg.expense) <= 5 ? 50
           : mChg.expense <= 10 ? 25 : 0;

  const qChg = comparativeData?.quarter?.changes;
  const d5 = !qChg ? 50
           : (qChg.expense < 0 && qChg.income > 0) ? 100
           : qChg.expense < 0 ? 70
           : Math.abs(qChg.expense) <= 5 ? 50
           : qChg.expense <= 15 ? 25 : 0;

  const yChg = comparativeData?.year?.changes;
  const d6 = !yChg ? 50
           : yChg.balance > 20 ? 100 : yChg.balance > 5 ? 75
           : yChg.balance >= -5 ? 50 : yChg.balance >= -20 ? 25 : 0;

  const topRatio = (topCategories?.[0] && expense > 0) ? topCategories[0][1] / expense : 0;
  const d7 = expense === 0 ? 100
           : topRatio < 0.20 ? 100 : topRatio < 0.35 ? 65 : topRatio < 0.50 ? 35 : 10;

  const score = Math.round(d1*0.25 + d2*0.20 + d3*0.15 + d4*0.10 + d5*0.15 + d6*0.10 + d7*0.05);
  return { score, d1, d2, d3, d4, d5, d6, d7, expRatio, savingsRate, balRatio, topRatio };
};

// ── Hook de Streak — localStorage MVP ──
const useStreak = () => {
  const [streak, setStreak] = React.useState(0);
  const [isNew, setIsNew]   = React.useState(false);

  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yday = yesterday.toISOString().split('T')[0];
    const raw  = localStorage.getItem('co_streak');
    const saved = raw ? JSON.parse(raw) : { streak: 0, lastDate: '' };

    let next = saved.streak;
    if (saved.lastDate === today) {
      // já contou hoje — só exibe
    } else if (saved.lastDate === yday) {
      next = saved.streak + 1;
      setIsNew(true);
      localStorage.setItem('co_streak', JSON.stringify({ streak: next, lastDate: today }));
    } else {
      next = 1;
      setIsNew(saved.lastDate !== '');
      localStorage.setItem('co_streak', JSON.stringify({ streak: 1, lastDate: today }));
    }
    setStreak(next);
  }, []);

  return { streak, isNew };
};

// ── Hook de Metas — Supabase ──
const useGoals = (userId) => {
  const [goals, setGoals] = React.useState([]);

  const fetchGoals = React.useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.schema('stich_ai').from('goals')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'done'])
      .order('created_at', { ascending: true });
    if (data) setGoals(data);
  }, [userId]);

  React.useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = async (goal) => {
    if (!userId) return { success: false, error: 'Usuário não autenticado' };
    const { data, error } = await supabase.schema('stich_ai').from('goals')
      .insert({ ...goal, user_id: userId, status: 'active' })
      .select().single();
    if (error) {
      console.error('addGoal error:', error);
      return { success: false, error: error.message };
    }
    if (data) setGoals(prev => [...prev, data]);
    return { success: true };
  };

  const updateGoalProgress = async (id, current_amount, status) => {
    const updates = { current_amount };
    if (status) updates.status = status;
    await supabase.schema('stich_ai').from('goals').update(updates).eq('id', id);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  return { goals, addGoal, updateGoalProgress, refetch: fetchGoals };
};

// ── Modal para criar/editar metas ──
const GoalAddModal = ({ onClose, onSave, userPlan = 'free' }) => {
  const { theme } = useApp();
  const isLight = theme === 'light';
  const isWarm  = userPlan === 'family_office';
  const accent  = isWarm ? '#e8a020' : '#0ea5e9';

  // Cores adaptadas ao tema
  const bg       = isLight ? (isWarm ? '#faf5ec' : '#ffffff')         : 'rgba(15,23,42,0.98)';
  const textMain = isLight ? (isWarm ? '#3d2008' : '#0f172a')         : '#ffffff';
  const textSub  = isLight ? (isWarm ? '#7c4a2d' : '#475569')         : 'rgba(255,255,255,0.65)';
  const inputBg  = isLight ? (isWarm ? 'rgba(232,160,32,0.06)' : 'rgba(14,165,233,0.05)') : 'rgba(255,255,255,0.06)';
  const inputBdr = isLight ? (isWarm ? 'rgba(124,74,45,0.25)' : 'rgba(14,165,233,0.2)') : 'rgba(255,255,255,0.12)';

  // Emoji → sugestão de título + tipo
  const EMOJI_PRESETS = {
    '🎯': { title: 'Meta personalizada',        type: 'custom'          },
    '💰': { title: 'Guardar dinheiro',           type: 'save_amount'     },
    '✂️': { title: 'Reduzir gastos',             type: 'reduce_category' },
    '💳': { title: 'Quitar dívida',              type: 'pay_debt'        },
    '🏦': { title: 'Construir reserva',          type: 'build_reserve'   },
    '🏡': { title: 'Comprar imóvel',             type: 'save_amount'     },
    '✈️': { title: 'Viagem dos sonhos',          type: 'save_amount'     },
    '📚': { title: 'Investir em educação',       type: 'save_amount'     },
    '💪': { title: 'Academia e saúde',           type: 'reduce_category' },
    '🌟': { title: 'Objetivo especial',          type: 'custom'          },
  };

  const GOAL_TYPES = [
    { value: 'save_amount',     label: '💰 Guardar valor'      },
    { value: 'reduce_category', label: '✂️ Reduzir categoria'  },
    { value: 'pay_debt',        label: '💳 Quitar dívida'      },
    { value: 'build_reserve',   label: '🏦 Construir reserva'  },
    { value: 'custom',          label: '🎯 Meta personalizada' },
  ];

  const [form, setForm] = React.useState({
    emoji: '🎯', title: 'Meta personalizada', type: 'custom', target_amount: '', category: '', deadline: ''
  });
  const [saving, setSaving]   = React.useState(false);
  const [errMsg, setErrMsg]   = React.useState('');

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pickEmoji = (e) => {
    const preset = EMOJI_PRESETS[e] || {};
    setForm(f => ({
      ...f,
      emoji: e,
      title: preset.title || f.title,
      type:  preset.type  || f.type,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErrMsg('Dê um nome para a meta.'); return; }
    if (!form.target_amount || isNaN(parseFloat(form.target_amount))) { setErrMsg('Informe o valor alvo.'); return; }
    if (form.type === 'reduce_category' && !form.category) { setErrMsg('Selecione a categoria a reduzir.'); return; }
    setErrMsg('');
    setSaving(true);
    const result = await onSave({
      emoji: form.emoji,
      title: form.title.trim(),
      type: form.type,
      target_amount: parseFloat(form.target_amount),
      current_amount: 0,
      category: form.type === 'reduce_category' ? form.category : null,
      deadline: form.deadline || null,
    });
    setSaving(false);
    if (result?.success === false) {
      setErrMsg(`Erro ao salvar: ${result.error}`);
    } else {
      onClose();
    }
  };

  const inputStyle = {
    width: '100%',
    background: inputBg,
    border: `1px solid ${inputBdr}`,
    borderRadius: '0.75rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    color: textMain,
    WebkitTextFillColor: textMain,
    caretColor: textMain,
    outline: 'none',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md rounded-[1.75rem] p-6 flex flex-col gap-4 shadow-2xl"
        style={{ background: bg, border: `1px solid ${accent}30` }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg" style={{ color: textMain }}>Nova Missão</h3>
          <button onClick={onClose} style={{ color: textSub }}><X size={20} /></button>
        </div>

        {/* Emoji picker — cada um preenche título + tipo */}
        <div className="flex gap-2 flex-wrap">
          {Object.keys(EMOJI_PRESETS).map(e => (
            <button key={e} onClick={() => pickEmoji(e)}
              className="text-xl p-1.5 rounded-xl transition-all active:scale-90"
              style={{
                background: form.emoji === e ? `${accent}22` : 'transparent',
                border: `1.5px solid ${form.emoji === e ? accent : 'transparent'}`,
              }}>
              {e}
            </button>
          ))}
        </div>

        {/* Tipo */}
        <select value={form.type} onChange={e => setF('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          {GOAL_TYPES.map(t => <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>)}
        </select>

        {/* Título */}
        <input value={form.title} onChange={e => setF('title', e.target.value)}
          placeholder="Nome da meta" style={inputStyle} />

        {/* Valor alvo */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: textSub }}>R$</span>
          <input type="number" value={form.target_amount} onChange={e => setF('target_amount', e.target.value)}
            placeholder="0,00" style={{ ...inputStyle, paddingLeft: '2rem' }} />
        </div>

        {/* Categoria (só se reduce_category) */}
        {form.type === 'reduce_category' && (
          <select value={form.category} onChange={e => setF('category', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Selecione a categoria</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Prazo */}
        <input type="date" value={form.deadline} onChange={e => setF('deadline', e.target.value)}
          style={{ ...inputStyle, colorScheme: isLight ? 'light' : 'dark' }} />

        {errMsg && (
          <p className="text-xs font-bold text-center rounded-xl px-3 py-2"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            {errMsg}
          </p>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
          style={{ background: accent, color: '#ffffff' }}>
          {saving ? 'Salvando…' : 'Criar Missão'}
        </button>
      </motion.div>
    </div>
  );
};

// Sub-component: Health Gauge — 7 dimensões ponderadas
const HealthIndicator = ({ income, expense, savingsIn, savingsOut, topCategories, comparativeData, userPlan = 'free' }) => {
  const isWarmHealth = userPlan === 'family_office';
  const { score, d1, d2, d3, d4, d5, d6, d7, expRatio, savingsRate, balRatio, topRatio } =
    calcHealthScore({ income, expense, savingsIn, savingsOut, topCategories, comparativeData });

  const { color, stroke, msg } = isWarmHealth
    ? (score >= 80 ? { color: 'text-primary',       stroke: '#e8a020', msg: 'Excelente' } :
       score >= 60 ? { color: 'text-primary/70',    stroke: '#c49a4a', msg: 'Bom'       } :
       score >= 40 ? { color: 'text-yellow-400',    stroke: '#facc15', msg: 'Atenção'   } :
       score >= 20 ? { color: 'text-orange-400',    stroke: '#fb923c', msg: 'Risco'     } :
                     { color: 'text-error',          stroke: '#ef4444', msg: 'Crítico'   })
    : (score >= 80 ? { color: 'text-success',        stroke: '#10b981', msg: 'Excelente' } :
       score >= 60 ? { color: 'text-cyan-400',       stroke: '#22d3ee', msg: 'Bom'       } :
       score >= 40 ? { color: 'text-yellow-400',     stroke: '#facc15', msg: 'Atenção'   } :
       score >= 20 ? { color: 'text-orange-400',     stroke: '#fb923c', msg: 'Risco'     } :
                     { color: 'text-error',           stroke: '#ef4444', msg: 'Crítico'   });

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
                    style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
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

// ── Plan themes ────────────────────────────────────────────
const PLAN_THEMES = {
  free:          { color: '#64748b', colorLight: '#94a3b8', Icon: null,       label: 'Gratuito',      glow: 'rgba(100,116,139,0.4)' },
  essencial:     { color: '#0ea5e9', colorLight: '#38bdf8', Icon: Zap,        label: 'Essencial',     glow: 'rgba(14,165,233,0.5)'  },
  private:       { color: '#820AD1', colorLight: '#a855f7', Icon: Shield,     label: 'Private',       glow: 'rgba(130,10,209,0.55)' },
  family_office: { color: '#e8a020', colorLight: '#f0c040', Icon: Crown,      label: 'Family Office', glow: 'rgba(232,160,32,0.55)' },
};

// Small badge shown next to premium feature headers
function PlanBadge({ requiredPlan, currentPlan }) {
  const theme = PLAN_THEMES[requiredPlan];
  if (!theme?.Icon) return null;
  const Icon = theme.Icon;
  const hasAccess = (PLAN_THEMES[currentPlan] ? Object.keys(PLAN_THEMES).indexOf(currentPlan) : 0)
    >= Object.keys(PLAN_THEMES).indexOf(requiredPlan);
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0"
      style={{
        background: `${theme.color}18`,
        border: `1px solid ${theme.color}50`,
        color: theme.color,
        boxShadow: hasAccess ? `0 0 8px ${theme.color}30` : 'none',
        opacity: hasAccess ? 1 : 0.7,
      }}
    >
      <Icon size={8} />
      {theme.label}
    </span>
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
  const isWarm = userPlan === 'family_office';
  const categoryColors = isWarm ? CATEGORY_COLORS_WARM : CATEGORY_COLORS;
  // Inline style color tokens for this plan
  const pc = {
    savings:    isWarm ? '#d4a855' : '#22d3ee',
    savingsAlt: isWarm ? '#b8730a' : '#06b6d4',
    success:    isWarm ? '#c49a4a' : '#10b981',
    accent:     isWarm ? '#e8a020' : '#00d2ff',
  };
  // Streak (hook — deve ficar no corpo do componente)
  const { streak, isNew: streakIsNew } = useStreak();

  // Streak tooltip — dados calculados no nível do componente para o portal fixed
  const streakTooltipData = useMemo(() => {
    const nextM = STREAK_MILESTONES.find(m => m.days > streak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
    const prevM = [...STREAK_MILESTONES].reverse().find(m => m.days <= streak);
    const base   = prevM ? prevM.days : 0;
    const segLen = nextM.days - base;
    const segPct = Math.min(100, Math.round(((streak - base) / segLen) * 100));
    const daysLeft = nextM.days - streak;
    return { nextM, segPct, daysLeft };
  }, [streak]);

  // Apply plan-based palette to CSS custom properties
  useEffect(() => {
    if (userPlan) document.documentElement.dataset.plan = userPlan;
    return () => { delete document.documentElement.dataset.plan; };
  }, [userPlan]);

  const [activeTab, setActiveTab] = useState('inicio');

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
  const [userCategories, setUserCategories] = useState([]);
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
  const [showGoalModal, setShowGoalModal] = useState(false);
  const { goals, addGoal, updateGoalProgress } = useGoals(effectiveUserId);
  const { unlocked: unlockedBadges, newBadge, checkAndUnlock } = useBadges();
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [streakTooltipRect, setStreakTooltipRect] = useState(null);
  const streakRef = useRef(null);

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

        // Load user custom categories
        const { data: cats } = await supabase
          .schema('stich_ai')
          .from('user_categories')
          .select('name')
          .eq('user_id', resolvedUserId);
        if (cats) setUserCategories(cats.map(c => c.name).sort((a, b) => a.localeCompare(b, 'pt-BR')));
      } catch (err) {
        console.warn("Supabase fetch failed:", err.message);
      }
    };
    if (user?.id) { fetchHistory(); fetchSuggestions(); }
  }, [user]);

  const handleEditSave = async ({ item, modality, category, pinRule }) => {
    try {
      const newMetadata = { ...(item.metadata || {}), modality_override: modality, category_manual: true };
      await supabase
        .from('transactions')
        .update({ category, metadata: newMetadata })
        .eq('id', item.id);

      // Update local state immediately
      setData(prev => prev.map(t =>
        t.id === item.id ? { ...t, category, metadata: newMetadata } : t
      ));

      // Persist new custom category to DB
      if (!ALL_CATEGORIES.includes(category) && category !== 'Outros') {
        const userId = effectiveUserId || user?.id;
        await supabase
          .schema('stich_ai')
          .from('user_categories')
          .upsert({ user_id: userId, name: category }, { onConflict: 'user_id,name' });
        setUserCategories(prev =>
          prev.includes(category) ? prev : [...prev, category].sort((a, b) => a.localeCompare(b, 'pt-BR'))
        );
      }

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

  // Auto-sync metas com dados do mês atual
  useEffect(() => {
    if (!goals.length) return;
    goals.forEach(goal => {
      if (goal.status !== 'active') return;
      if (goal.type === 'reduce_category' && goal.category) {
        const spent = monthlyData
          .filter(item => classifyTransaction(item) === 'expense' && smartCategory(item) === goal.category)
          .reduce((s, item) => s + Math.abs(item.amount), 0);
        updateGoalProgress(goal.id, spent, spent >= goal.target_amount ? 'done' : undefined);
      } else if (goal.type === 'save_amount') {
        const saved = aggregates.savingsOut - aggregates.savingsIn;
        if (saved > 0) updateGoalProgress(goal.id, saved, saved >= goal.target_amount ? 'done' : undefined);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyData, aggregates]);

  // Auto-check badges
  useEffect(() => {
    if (!data.length || !aggregates.income) return;
    const { score } = calcHealthScore({
      income: aggregates.income, expense: aggregates.expense,
      savingsIn: aggregates.savingsIn, savingsOut: aggregates.savingsOut,
      topCategories, comparativeData: comparativeData || null,
    });
    checkAndUnlock({
      hasImport:   data.length > 0,
      hasMission:  goals.length > 0,
      streak,
      score,
      savingsOut:  aggregates.savingsOut,
      income:      aggregates.income,
      missionDone: goals.some(g => g.status === 'done'),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, aggregates, streak, goals]);

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

  const formatMonthShort = (m) => {
    if (!m) return '';
    const [y, mm] = m.split('-');
    const abbr = new Date(y, mm - 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
    return `${abbr} ${y.slice(2)}`;
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
    <div className="bg-background text-on-surface min-h-screen pb-48 md:pb-32 mesh-bg">

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

      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass border-b border-outline-variant pt-[max(1rem,env(safe-area-inset-top,1rem))] pb-3 px-4 sm:px-6 flex justify-between items-center transition-all">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.div whileHover={{ scale: 1.1 }} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 shrink-0">
            E
          </motion.div>
          <h1 className="text-base sm:text-lg font-black tracking-tighter text-white whitespace-nowrap">
            {activeTab === 'inicio' ? 'Extrato Co.' : activeTab === 'extrato' ? 'Extrato' : activeTab === 'analise' ? 'Análise' : 'Perfil'}
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Month picker — only on Início, Extrato, Análise */}
          {activeTab !== 'perfil' && (
            <div className="glass px-2 py-1 rounded-xl flex items-center border border-outline-variant gap-1 shrink-0">
              <Calendar className="text-primary shrink-0" size={13} />
              <select
                className="bg-transparent border-none text-white font-black text-[11px] focus:ring-0 cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', width: '4.2rem' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {availableMonths.map(m => <option key={m} value={m} className="bg-surface">{formatMonthShort(m)}</option>)}
              </select>
            </div>
          )}

          {/* Soraya IA — lâmpada de sugestões */}
          <button
            onClick={() => canAccess('soraya') ? openSoraya() : navigate('/pricing')}
            className="relative p-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-all text-on-surface-variant hover:text-yellow-400"
            title={canAccess('soraya') ? 'Soraya IA — Sugestões' : 'Upgrade para Family Office'}
          >
            <Lightbulb size={17} />
            {suggestions.filter(s => s.status === 'new' && s.author_id !== user?.id).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-400 rounded-full text-[8px] font-black text-black flex items-center justify-center">
                {suggestions.filter(s => s.status === 'new' && s.author_id !== user?.id).length}
              </span>
            )}
          </button>

          {/* Avatar — vai para Perfil */}
          <button
            onClick={() => setActiveTab('perfil')}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/60 to-accent/60 border border-white/20 flex items-center justify-center text-white font-black text-xs transition-all hover:scale-105"
            title="Perfil"
          >
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      <main className="pt-20 px-4 sm:px-6 max-w-6xl mx-auto pb-32 space-y-6">

        {/* ── TAB: INÍCIO ────────────────────────────────── */}
        {activeTab === 'inicio' && <>

        {/* Month badges */}
        {monthFiles.length > 0 && showFileBadges && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {monthFiles.map(({ name, type }) => (
              <span key={name} className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border"
                style={{
                  background: type === 'credit_card' ? 'rgba(139,92,246,0.15)' : type === 'investment' ? 'rgba(0,210,255,0.15)' : 'rgba(16,185,129,0.15)',
                  borderColor: type === 'credit_card' ? 'rgba(139,92,246,0.4)' : type === 'investment' ? 'rgba(0,210,255,0.4)' : 'rgba(16,185,129,0.4)',
                  color: type === 'credit_card' ? '#a78bfa' : type === 'investment' ? '#00d2ff' : '#6ee7b7',
                }}>
                <FileText size={8} />
                {name.length > 28 ? name.slice(0, 25) + '...' : name}
              </span>
            ))}
          </div>
        )}

        {/* ── Score Banner — destaque diário ── */}
        {comparativeData && (() => {
          const { score } = calcHealthScore({
            income: aggregates.income, expense: aggregates.expense,
            savingsIn: aggregates.savingsIn, savingsOut: aggregates.savingsOut,
            topCategories, comparativeData,
          });
          const strokeColor = isWarm
            ? (score >= 80 ? '#e8a020' : score >= 60 ? '#c49a4a' : score >= 40 ? '#facc15' : score >= 20 ? '#fb923c' : '#ef4444')
            : (score >= 80 ? '#10b981' : score >= 60 ? '#22d3ee' : score >= 40 ? '#facc15' : score >= 20 ? '#fb923c' : '#ef4444');
          const label = score >= 80 ? 'Ótimo dia financeiro!' : score >= 60 ? 'Dia regular' : score >= 40 ? 'Atenção nas finanças' : score >= 20 ? 'Situação de risco' : 'Situação crítica';
          const R = 28; const circ = 2 * Math.PI * R;
          return (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-card rounded-[1.75rem] p-4 flex items-center gap-4"
            >
              {/* Círculo animado */}
              <div className="relative shrink-0 w-[68px] h-[68px] flex items-center justify-center">
                <svg width="68" height="68" className="-rotate-90 absolute inset-0">
                  <circle cx="34" cy="34" r={R} strokeWidth="5" fill="none" className="text-surface-container" stroke="currentColor" />
                  <motion.circle
                    cx="34" cy="34" r={R} strokeWidth="5" fill="none"
                    stroke={strokeColor} strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                  />
                </svg>
                <div className="relative flex flex-col items-center leading-none">
                  <span className="text-xl font-black" style={{ color: strokeColor }}>{score}</span>
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider">score</span>
                </div>
              </div>

              {/* Label + descrição */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-white leading-tight">{label}</p>
                <p className="text-[10px] text-white/40 mt-0.5">Saúde financeira do mês · {score}/100</p>
                <p className="text-[10px] text-white/30 mt-1 hidden sm:block">
                  Baseado em gastos, poupança, saldo e tendências comparativas.
                </p>
              </div>

              {/* Streak — Hook Model widget */}
              {(() => {
                return (
                  <div className="relative shrink-0" ref={streakRef}
                    onMouseEnter={() => {
                      const r = streakRef.current?.getBoundingClientRect();
                      if (r) setStreakTooltipRect(r);
                    }}
                    onMouseLeave={() => setStreakTooltipRect(null)}
                    onClick={() => {
                      if (streakTooltipRect) { setStreakTooltipRect(null); return; }
                      const r = streakRef.current?.getBoundingClientRect();
                      if (r) setStreakTooltipRect(r);
                    }}
                  >
                    {/* Badge principal */}
                    <motion.div
                      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl cursor-pointer select-none"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ background: `${strokeColor}12`, border: `1px solid ${strokeColor}30` }}
                    >
                      <motion.span
                        className="text-2xl leading-none"
                        initial={{ scale: streakIsNew ? 0.5 : 1 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
                      >🔥</motion.span>
                      <span className="text-lg font-black leading-none" style={{ color: strokeColor }}>{streak}</span>
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider">
                        {streak === 1 ? 'dia' : 'dias'}
                      </span>
                    </motion.div>

                    {/* tooltip rendered via portal at root — see below */}
                  </div>
                );
              })()}
            </motion.div>
          );
        })()}

        {/* ── Metas ── */}
        {goals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card rounded-[1.75rem] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-white">Missões</h3>
              <button onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
                style={{ background: `${isWarm ? '#e8a020' : '#0ea5e9'}18`, color: isWarm ? '#e8a020' : '#0ea5e9', border: `1px solid ${isWarm ? '#e8a020' : '#0ea5e9'}30` }}>
                <Plus size={12} /> Missão
              </button>
            </div>
            {goals.filter(g => g.status === 'active' || g.status === 'done').map(goal => {
              const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
              const barColor = goal.status === 'done'
                ? (isWarm ? '#e8a020' : '#10b981')
                : pct >= 80 ? (isWarm ? '#c49a4a' : '#22d3ee')
                : pct >= 50 ? (isWarm ? '#b8730a' : '#0ea5e9')
                : (isWarm ? '#7c4a2d' : '#6366f1');
              return (
                <div key={goal.id} className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{goal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[60%]">{goal.title}</span>
                      <span className="text-[10px] font-bold shrink-0 ml-1" style={{ color: barColor }}>
                        {goal.status === 'done' ? '✓ Concluída' : `${pct}%`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ background: barColor }} />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[9px] text-white/30">{maskBRL(goal.current_amount)}</span>
                      <span className="text-[9px] text-white/30">meta {maskBRL(goal.target_amount)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Botão adicionar meta quando não há metas */}
        {goals.length === 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onClick={() => setShowGoalModal(true)}
            className="glass-card rounded-[1.75rem] p-4 flex items-center gap-3 w-full text-left transition-all hover:opacity-80 active:scale-[0.98]">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${isWarm ? '#e8a020' : '#0ea5e9'}15` }}>
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Crie sua primeira missão</p>
              <p className="text-[11px] text-white/40">Defina objetivos e acompanhe em tempo real</p>
            </div>
            <Plus size={16} className="ml-auto shrink-0 text-white/40" />
          </motion.button>
        )}

        {/* ── Conquistas ── */}
        {(() => {
          const earnedCount = BADGES_DEF.filter(b => unlockedBadges[b.id]).length;
          const visibleBadges = showAllBadges ? BADGES_DEF : BADGES_DEF.slice(0, 4);
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card rounded-[1.75rem] p-4 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white">Conquistas</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${isWarm ? '#e8a020' : '#0ea5e9'}20`, color: isWarm ? '#e8a020' : '#0ea5e9' }}>
                    {earnedCount}/{BADGES_DEF.length}
                  </span>
                </div>
                <button onClick={() => setShowAllBadges(v => !v)}
                  className="text-[10px] font-bold transition-colors"
                  style={{ color: isWarm ? '#e8a020' : '#0ea5e9' }}>
                  {showAllBadges ? 'Menos' : 'Ver todas'}
                </button>
              </div>

              {/* Grid de badges */}
              <div className="grid grid-cols-4 gap-2">
                {visibleBadges.map(badge => {
                  const earned = !!unlockedBadges[badge.id];
                  const rarityColor = BADGE_RARITY_COLOR[badge.rarity];
                  const { Icon } = badge;
                  return (
                    <motion.div key={badge.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl relative overflow-hidden cursor-default"
                      style={{
                        background: earned ? `${rarityColor}12` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${earned ? rarityColor + '35' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      {earned && (
                        <div className="absolute inset-0 pointer-events-none"
                          style={{ background: `radial-gradient(ellipse at 50% 0%, ${rarityColor}15, transparent 70%)` }} />
                      )}
                      {/* Ícone */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                          background: earned ? `${rarityColor}20` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${earned ? rarityColor + '40' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                        <Icon size={16} strokeWidth={1.75}
                          style={{ color: earned ? rarityColor : 'rgba(255,255,255,0.2)' }} />
                      </div>
                      <span className="text-[9px] font-semibold text-center leading-tight line-clamp-2 px-0.5"
                        style={{ color: earned ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)' }}>
                        {badge.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Próximo badge a desbloquear */}
              {(() => {
                const next = BADGES_DEF.find(b => !unlockedBadges[b.id]);
                if (!next) return (
                  <p className="text-[10px] text-center font-bold" style={{ color: isWarm ? '#e8a020' : '#10b981' }}>
                    🎉 Todas as conquistas desbloqueadas!
                  </p>
                );
                return (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <next.Icon size={16} strokeWidth={1.75} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white/50 leading-tight">Próxima conquista</p>
                      <p className="text-[11px] font-black text-white leading-tight">{next.name}</p>
                    </div>
                    <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${BADGE_RARITY_COLOR[next.rarity]}20`, color: BADGE_RARITY_COLOR[next.rarity] }}>
                      {next.rarity}
                    </span>
                  </div>
                );
              })()}
            </motion.div>
          );
        })()}

        {/* Intro placeholder — kept to align existing sections below */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden"
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
          <motion.div variants={itemVariants} className="md:col-span-8 glass-card p-4 sm:p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden group">
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
                </div>
              </div>

              {/* Big number */}
              <div className={`text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] leading-none font-black tracking-tighter text-glow ${
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
                  className="group/card text-left glass p-3 rounded-2xl border border-transparent hover:border-cyan-400/40 hover:bg-cyan-400/5 active:scale-95 transition-all cursor-pointer flex flex-col gap-2"
                >
                  <div className="flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-widest" style={{ color: pc.accent }}>
                    <PiggyBank size={11} /> Cofrinho
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold" style={{ color: '#f8717199' }}>Resgates</span>
                      <span className="text-[11px] font-black text-white">{maskBRL(aggregates.savingsIn, hideValues)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold" style={{ color: '#4ade8099' }}>Aplicações</span>
                      <span className="text-[11px] font-black text-white">{maskBRL(aggregates.savingsOut, hideValues)}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-1.5 flex items-center justify-between">
                    <span className="text-[9px] font-bold" style={{ color: `${pc.accent}99` }}>Saldo líquido</span>
                    <span className="text-sm font-black flex items-center gap-0.5" style={{
                      color: aggregates.savingsNet <= 0 ? '#4ade80' : '#f87171'
                    }}>
                      {aggregates.savingsNet <= 0 ? '▲' : '▼'}
                      {maskBRL(Math.abs(aggregates.savingsNet), hideValues)}
                    </span>
                  </div>
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
                  success: isWarm ? '#c49a4a' : '#4ade80',
                  error:   '#f87171',
                  warning: '#facc15',
                  primary: isWarm ? '#e8a020' : '#818cf8',
                  neutral: isWarm ? '#8a6a50' : '#64748b',
                };

                // Cor de acento distinta por slot (P1→P5), independente do status
                const slotAccents = isWarm ? [
                  { color: '#e8a020', bg: 'rgba(232,160,32,0.06)',  border: 'rgba(232,160,32,0.22)'  }, // ochre    — Curto prazo
                  { color: '#b8730a', bg: 'rgba(184,115,10,0.06)',  border: 'rgba(184,115,10,0.22)'  }, // dark ochre — Médio prazo
                  { color: '#7c4a2d', bg: 'rgba(124,74,45,0.06)',   border: 'rgba(124,74,45,0.22)'   }, // brown    — Longo prazo
                  { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.22)'  }, // amber    — Concentração
                  { color: '#c49a4a', bg: 'rgba(196,154,74,0.06)',  border: 'rgba(196,154,74,0.22)'  }, // caramel  — Equilíbrio
                ] : [
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
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const projC = (PLAN_THEMES[userPlan] || PLAN_THEMES.private).color;
                          return (
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${projC}18`, border: `1px solid ${projC}40` }}>
                              <TrendUpIcon size={13} style={{ color: projC }} />
                            </div>
                          );
                        })()}
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70 flex items-center gap-2">
                          Projeções
                          <PlanBadge requiredPlan="private" currentPlan={userPlan} />
                        </p>
                      </div>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        usingProphet && !isWarm
                          ? 'text-violet-400 border-violet-400/30 bg-violet-400/10'
                          : usingProphet && isWarm
                          ? ''
                          : 'text-white/20 border-white/10 bg-transparent'
                      }`} style={usingProphet && isWarm ? { color: pc.accent, borderColor: `${pc.accent}40`, backgroundColor: `${pc.accent}15` } : undefined}>
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
          <motion.div variants={itemVariants} className="md:col-span-4 glass-card rounded-[2.5rem] p-4 sm:p-6 md:p-8 flex flex-col border-t border-t-white/10 shadow-2xl">
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${PLAN_THEMES.family_office.color}18`, border: `1px solid ${PLAN_THEMES.family_office.color}40` }}>
                  <Crown size={13} style={{ color: PLAN_THEMES.family_office.color }} />
                </div>
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  Saúde Financeira
                  <PlanBadge requiredPlan="family_office" currentPlan={userPlan} />
                </h3>
              </div>
              <HealthIndicator
                income={aggregates.income}
                expense={aggregates.expense}
                savingsIn={aggregates.savingsIn}
                savingsOut={aggregates.savingsOut}
                topCategories={topCategories}
                comparativeData={comparativeData}
                userPlan={userPlan}
              />
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-white/10 my-3"></div>

            {/* Resumo */}
            <div className="mt-2">
              <h3 className="text-xs font-black flex items-center gap-2 mb-4 uppercase tracking-[0.2em]" style={{ color: PLAN_THEMES.family_office.color }}>
                <Sparkles size={14} /> Resumo
                <PlanBadge requiredPlan="family_office" currentPlan={userPlan} />
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

        </>} {/* end inicio tab */}

        {/* ── TAB: ANÁLISE ────────────────────────────────── */}
        {activeTab === 'analise' && <>

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
                            background: d.curr.expense / d.curr.income > 0.9 ? '#ef4444' : d.curr.expense / d.curr.income > 0.7 ? '#facc15' : pc.success
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

        </>} {/* end analise tab */}

        {/* ── TAB: EXTRATO ────────────────────────────────── */}
        {activeTab === 'extrato' && <>

        {/* Receitas / Despesas summary */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-success/80 mb-1">Receitas</p>
            <p className="text-xl font-black text-success">{maskBRL(aggregates.income, hideValues)}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-error/80 mb-1">Despesas</p>
            <p className="text-xl font-black text-error">-{maskBRL(aggregates.expense, hideValues)}</p>
          </div>
        </div>

        {/* ── Barra de importação horizontal ── */}
        {loading ? (
          <div className="glass border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-white/70 text-xs font-bold">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processando arquivo...
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <label htmlFor="fileInputExtrato"
              className="flex flex-col items-center justify-center gap-1.5 glass-card border border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary rounded-2xl py-3 px-2 text-[11px] font-black cursor-pointer transition-all active:scale-95 text-center">
              <div className="flex items-center gap-1"><Upload size={13} /><FileText size={13} /></div>
              Extrato
            </label>
            <label htmlFor="fileInputCartao"
              className="flex flex-col items-center justify-center gap-1.5 glass-card border border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary rounded-2xl py-3 px-2 text-[11px] font-black cursor-pointer transition-all active:scale-95 text-center">
              <div className="flex items-center gap-1"><Upload size={13} /><CreditCard size={13} /></div>
              Cartão
            </label>
            <label htmlFor="fileInputInvestimento"
              className="flex flex-col items-center justify-center gap-1.5 glass-card border border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary rounded-2xl py-3 px-2 text-[11px] font-black cursor-pointer transition-all active:scale-95 text-center">
              <div className="flex items-center gap-1"><Upload size={13} /><Landmark size={13} /></div>
              Invest.
            </label>
            <button onClick={handleConnectBank} disabled={pluggyConnecting}
              className="flex flex-col items-center justify-center gap-1.5 glass-card border border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary rounded-2xl py-3 px-2 text-[11px] font-black transition-all active:scale-95 disabled:opacity-50 text-center">
              <Link size={14} />
              {pluggyConnecting ? '...' : 'Banco'}
            </button>
          </div>
        )}

        {/* Resumo por Categoria */}
        <div ref={categoryChartRef}>
          <CategoryChart
            chartData={chartData}
            colorMap={categoryColors}
            selectedCategories={categoryFilter}
            onCategoryClick={name => {
              setCategoryFilter(prev =>
                prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
              );
            }}
          />
        </div>

          {/* Transactions List with Search + Filter */}
          <motion.div ref={transactionsRef} className="glass-card p-4 sm:p-6 rounded-[2rem] flex flex-col">
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
                    style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
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
                            style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
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
                            style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
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
                    const iconColor   = cls === 'expense' ? catColor : cls === 'income' ? '#4ade80' : pc.savings;
                    const borderColor = cls === 'expense' ? `${catColor}25` : cls === 'income' ? 'rgba(74,222,128,0.15)' : `${pc.savings}26`;
                    const bgColor     = cls === 'expense' ? `${catColor}08` : cls === 'income' ? 'rgba(74,222,128,0.06)' : `${pc.savings}0f`;

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

        </>} {/* end extrato tab */}

        {/* ── TAB: PERFIL ────────────────────────────────── */}
        {activeTab === 'perfil' && (
          <div className="space-y-4 pt-2">
            {/* User card */}
            <div className="glass-card rounded-[2rem] p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-primary/30">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-black text-white text-lg">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-white/50">{user?.email}</p>
              </div>
              {(() => {
                const pt = PLAN_THEMES[userPlan] || PLAN_THEMES.free;
                return (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:opacity-80"
                    style={{ background: `${pt.color}22`, color: pt.colorLight, border: `1px solid ${pt.color}50` }}
                  >
                    {pt.label}
                  </button>
                );
              })()}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Transações', value: data.length },
                { label: 'Meses', value: availableMonths.length },
                { label: 'Saúde', value: `${(() => { const { income, expense, savingsOut } = aggregates; const r = income > 0 ? Math.max(0, Math.min(100, Math.round(((income - expense) / income) * 40 + (savingsOut > 0 ? 30 : 0) + 30))) : 0; return r; })()}` },
              ].map(({ label, value }) => (
                <div key={label} className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Conta */}
            <div className="glass-card rounded-[1.5rem] overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-5 pt-4 pb-2">Conta</p>
              {[
                { icon: User, label: 'Plano & assinatura', action: () => navigate('/pricing') },
                { icon: Users, label: 'Membros da conta', action: () => { setShowMembersModal(true); fetchMembers(); } },
                { icon: Sparkles, label: 'Soraya IA', action: () => canAccess('soraya') ? openSoraya() : navigate('/pricing'), badge: suggestions.filter(s => s.status === 'new' && s.author_id !== user?.id).length || null },
              ].map(({ icon: Icon, label, action, badge }) => (
                <button key={label} onClick={action} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-white">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge ? <span className="w-5 h-5 bg-yellow-400 rounded-full text-[9px] font-black text-black flex items-center justify-center">{badge}</span> : null}
                    <ChevronDown size={14} className="text-white/30 -rotate-90" />
                  </div>
                </button>
              ))}
            </div>

            {/* Preferências */}
            <div className="glass-card rounded-[1.5rem] overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-5 pt-4 pb-2">Preferências</p>
              {[
                { icon: theme === 'dark' ? Moon : Sun, label: theme === 'dark' ? 'Modo escuro' : 'Modo claro', toggle: toggleTheme, active: theme === 'dark' },
                { icon: hideValues ? EyeOff : Eye, label: 'Ocultar valores', toggle: toggleHideValues, active: hideValues },
              ].map(({ icon: Icon, label, toggle, active }) => (
                <button key={label} onClick={toggle} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-white/60" />
                    <span className="text-sm font-semibold text-white">{label}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${active ? 'bg-primary' : 'bg-white/20'} relative`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              ))}
            </div>

            {/* Suporte */}
            <div className="glass-card rounded-[1.5rem] overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-5 pt-4 pb-2">Suporte</p>
              {[
                {
                  icon: Mail,
                  label: 'Falar com suporte',
                  sublabel: 'suporte@extratobancario.cortezgroup.com.br',
                  action: () => window.open('mailto:suporte@extratobancario.cortezgroup.com.br?subject=Suporte%20Extrato%20Co.', '_blank'),
                },
                { icon: HelpCircle, label: 'Central de ajuda', action: () => navigate('/faq') },
                { icon: Lock, label: 'Termos de uso', action: () => navigate('/termos') },
              ].map(({ icon: Icon, label, sublabel, action }) => (
                <button key={label} onClick={action} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-white">{label}</span>
                      {sublabel && <span className="text-[10px] text-white/40">{sublabel}</span>}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-white/30 -rotate-90" />
                </button>
              ))}
            </div>

            {/* Sair */}
            <button
              onClick={handleLogout}
              className="w-full glass-card rounded-[1.5rem] px-5 py-4 flex items-center justify-center gap-3 text-error font-black border border-error/20 hover:bg-error/10 transition-colors"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        )} {/* end perfil tab */}

      </main>

      {/* ── Bottom Navigation ────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom,1rem))]">
        <div className="glass border border-white/10 shadow-2xl rounded-2xl flex items-center justify-around px-2 py-2">
          {[
            { id: 'inicio',  Icon: Home,        label: 'Início' },
            { id: 'extrato', Icon: LayoutList,   label: 'Extrato' },
            { id: 'analise', Icon: BarChart2,    label: 'Análise' },
            { id: 'perfil',  Icon: User,         label: 'Perfil' },
          ].map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all ${
                activeTab === id
                  ? 'bg-primary/20 text-primary'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Chat IA FAB — all tabs */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={() => canAccess('chat_ia') ? setShowChat(true) : navigate('/pricing')}
        className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom,1rem)+4.5rem))] left-5 z-[60] w-12 h-12 rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-xl shadow-secondary/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title={canAccess('chat_ia') ? 'Ajuda IA' : 'Chat IA — Plano Private'}
      >
        <BrainCircuit size={20} />
      </motion.button>

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
              className="glass-card rounded-[2rem] p-4 sm:p-8 w-full max-w-md relative"
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
                        style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
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
                  style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
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
          includeSandbox={true}
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

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editModal && (
          <EditTransactionModal
            item={editModal}
            onClose={() => setEditModal(null)}
            onSave={handleEditSave}
            userCategories={userCategories}
            userPlan={userPlan}
          />
        )}
      </AnimatePresence>

      {/* Goal Add Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <GoalAddModal
            onClose={() => setShowGoalModal(false)}
            onSave={addGoal}
            userPlan={userPlan}
          />
        )}
      </AnimatePresence>

      {/* ── Badge Unlock Toast ── */}
      <AnimatePresence>
        {newBadge && <BadgeUnlockToast badge={newBadge} isWarm={isWarm} />}
      </AnimatePresence>

      {/* ── Streak Tooltip Portal — fixed, nunca clipado ── */}
      <AnimatePresence>
        {streakTooltipRect && (() => {
          const { nextM, segPct, daysLeft } = streakTooltipData;
          // cor do stroke reutilizando a lógica do ScoreBanner
          const sColor = isWarm
            ? '#e8a020'
            : '#10b981';
          // posiciona abaixo do badge, alinhado à direita dele
          const top  = streakTooltipRect.bottom + 10;
          const right = window.innerWidth - streakTooltipRect.right;
          return (
            <motion.div
              key="streak-tooltip"
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-64 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl"
              style={{
                position: 'fixed',
                top,
                right,
                zIndex: 9999,
                background: 'rgba(10,14,26,0.97)',
                border: `1px solid ${sColor}40`,
                backdropFilter: 'blur(24px)',
              }}
              onMouseEnter={() => {
                const r = streakRef.current?.getBoundingClientRect();
                if (r) setStreakTooltipRect(r);
              }}
              onMouseLeave={() => setStreakTooltipRect(null)}
            >
              {/* Seta para cima */}
              <div className="absolute right-5 -top-[6px] w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: `6px solid ${sColor}40`,
                }} />

              {/* Título */}
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-sm font-black leading-tight" style={{ color: '#ffffff' }}>
                    {streak} {streak === 1 ? 'dia' : 'dias'} seguidos!
                  </p>
                  <p className="text-[11px] leading-tight" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {streak === 1 ? 'Você começou hoje. Continue amanhã!' : 'Incrível consistência. Não quebre agora.'}
                  </p>
                </div>
              </div>

              {/* Próxima recompensa */}
              <div className="rounded-xl p-3 flex flex-col gap-2"
                style={{ background: `${sColor}18`, border: `1px solid ${sColor}50` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>Próxima recompensa</span>
                  <span className="text-[11px] font-black" style={{ color: sColor }}>
                    {daysLeft === 0 ? 'Hoje!' : `${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{nextM.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-black leading-tight" style={{ color: '#ffffff' }}>{nextM.reward}</p>
                    <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.60)' }}>{nextM.desc}</p>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${segPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    style={{ background: sColor }}
                  />
                </div>
                <p className="text-[10px] text-right" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {streak} / {nextM.days} dias — {segPct}%
                </p>
              </div>

              {/* CTA — Investment */}
              <div className="flex items-center gap-2 rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <span className="text-base shrink-0">📅</span>
                <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Volte amanhã</span> para manter sua série e desbloquear{' '}
                  <span className="font-bold" style={{ color: sColor }}>{nextM.reward}</span>.
                </p>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
