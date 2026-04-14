import React, { useState, useEffect, useMemo } from 'react';
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
  Lightbulb, CheckCircle, Archive, Clock
} from 'lucide-react';
import { useApp, maskBRL } from '../contexts/AppContext.jsx';
import { useSEO } from '../hooks/useSEO';

import * as pdfjsLib from 'pdfjs-dist';
// Carrega worker via CDN para evitar erro de MIME type do nginx com .mjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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

function smartCategory(item) {
  const stored = (item.category || '').trim();
  if (stored && stored !== 'Outros' && stored !== 'outros') return stored;
  const desc = (item.description || '').toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => desc.includes(k))) return rule.cat;
  }
  return stored || 'Outros';
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
const SAVINGS_CATEGORIES = ['Investimentos', 'Poupança', 'Aplicação', 'CDB', 'Tesouro', 'Fundo'];

function classifyTransaction(item) {
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
            <div key={label} className="relative group flex items-center gap-2 cursor-default">
              <span className="text-[9px] font-bold text-white/40 w-16 shrink-0 truncate group-hover:text-white/70 transition-colors">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pts}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-50 w-56 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-surface-container border border-white/15 rounded-xl px-3 py-2 shadow-xl">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-[11px] text-white/80 leading-relaxed">{tip}</p>
                </div>
                <div className="w-2 h-2 bg-surface-container border-b border-r border-white/15 rotate-45 ml-4 -mt-1" />
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
  const [effectiveUserId, setEffectiveUserId] = useState(null);
  const navigate = useNavigate();

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

        const { data: history, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', resolvedUserId)
          .order('transaction_date', { ascending: false });

        if (error) throw error;
        if (history && history.length > 0) {
          setData(history);
          setIsSupabaseConnected(true);
          const latestDate = history.find(h => h.transaction_date)?.transaction_date;
          if (latestDate) setSelectedMonth(latestDate.substring(0, 7));
        }
      } catch (err) {
        console.warn("Supabase fetch failed:", err.message);
      }
    };
    if (user?.id) { fetchHistory(); fetchSuggestions(); }
  }, [user]);

  const handleFileUpload = async (e, importType) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setLoading(true);

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
      const sourceType = importType === 'cartao' ? 'credit_card' : importType === 'investimento' ? 'investment' : 'bank';
      const payload = {
        text_data: extractedText,
        user_id: effectiveUserId || user.id,
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

  const monthlyData = useMemo(() => {
    if (!selectedMonth) return [];
    let filtered = data.filter(item => item.transaction_date?.startsWith(selectedMonth));

    // Anti-duplicidade: quando há fatura de cartão importada, remove do extrato bancário
    // o pagamento de boleto correspondente — em qualquer mês.
    // Estratégia em camadas:
    //   1. Categoria 'Cartão de Crédito' → sempre remove
    //   2. Boleto + nome de emissor com fatura importada → remove
    //   3. Boleto + nome de emissor + valor ≈ total da fatura → remove (mais preciso)
    if (hasAnyCreditCard) {
      const BOLETO_PATTERNS = ['pagamento boleto', 'pgto boleto', 'boleto bancario',
        'deb aut fatura', 'debito automatico fatura', 'debito fatura', 'pgto fatura',
        'pagamento fatura'];
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
  }, [data, selectedMonth, searchTerm, hasAnyCreditCard, creditCardTotalByIssuer]);

  const availableMonths = useMemo(() => {
    const months = new Set(data.filter(item => item.transaction_date).map(item => item.transaction_date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [data]);

  // Arquivos importados para o mês selecionado
  const monthFiles = useMemo(() => {
    if (!selectedMonth) return [];
    const files = new Map();
    data.filter(item => item.transaction_date?.startsWith(selectedMonth) && item.bank).forEach(item => {
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
            onClick={openSoraya}
            className="relative p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-all text-on-surface-variant hover:text-yellow-400"
            title="Soraya IA — Sugestões"
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
          <motion.div variants={itemVariants} className="md:col-span-8 glass-card p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className={`flex items-center gap-2 mb-2 font-bold tracking-[0.2em] text-[10px] uppercase ${aggregates.patrimonioErosion ? 'text-error' : 'text-primary'}`}>
                  <Activity size={12} /> Saldo Líquido do Mês
                  {aggregates.patrimonioErosion && (
                    <span className="ml-1 flex items-center gap-1 bg-error/15 border border-error/30 text-error px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal normal-case">
                      ⚠ Erosão de patrimônio
                    </span>
                  )}
                </div>
                <div className={`text-[4rem] md:text-[5rem] leading-none font-black tracking-tighter text-glow ${aggregates.patrimonioErosion ? 'text-error' : 'text-white'}`}>
                  {maskBRL(aggregates.balance, hideValues)}
                </div>
              </div>

              <div className="flex gap-3 mt-12 flex-wrap">
                <div className="flex-1 min-w-[120px] glass p-5 rounded-3xl border-l-4" style={{ borderLeftColor: '#10b981' }}>
                  <div className="flex items-center gap-2 text-success font-bold text-[10px] uppercase mb-1">
                    <ArrowUpRight size={12} /> Entradas
                  </div>
                  <p className="text-xl font-black text-white">{maskBRL(aggregates.income, hideValues)}</p>
                </div>
                <div className="flex-1 min-w-[120px] glass p-5 rounded-3xl border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                  <div className="flex items-center gap-2 text-error font-bold text-[10px] uppercase mb-1">
                    <ArrowDownRight size={12} /> Saídas
                  </div>
                  <p className="text-xl font-black text-white">{maskBRL(aggregates.expense, hideValues)}</p>
                </div>
                <div className="flex-1 min-w-[140px] glass p-5 rounded-3xl border-l-4" style={{ borderLeftColor: '#00d2ff' }}>
                  <div className="flex items-center gap-2 font-bold text-[10px] uppercase mb-2" style={{ color: '#00d2ff' }}>
                    <PiggyBank size={12} /> Cofrinho
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <ArrowUpRight size={10} style={{ color: '#f87171' }} />
                    <span className="text-[9px] font-bold" style={{ color: '#f8717199' }}>Resgates</span>
                    <span className="text-xs font-black text-white ml-auto">{maskBRL(aggregates.savingsIn, hideValues)}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <ArrowDownRight size={10} style={{ color: '#4ade80' }} />
                    <span className="text-[9px] font-bold" style={{ color: '#4ade8099' }}>Aplicações</span>
                    <span className="text-xs font-black text-white ml-auto">{maskBRL(aggregates.savingsOut, hideValues)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2">
                    <p className="text-[9px] font-bold mb-1" style={{ color: '#00d2ff99' }}>Saldo Líquido</p>
                    <p className="text-base font-black" style={{
                      color: aggregates.patrimonioErosion ? '#f87171'
                           : aggregates.savingsNet >= 0   ? '#4ade80'
                           : '#f87171'
                    }}>
                      {maskBRL(Math.abs(aggregates.savingsNet), hideValues)}
                      <span className="text-[9px] ml-1">{aggregates.savingsNet >= 0 ? '▲' : '▼'}</span>
                    </p>
                    {aggregates.patrimonioErosion && (
                      <p className="text-[8px] text-error/70 font-bold mt-0.5 leading-tight">
                        Resgate cobriu déficit mensal
                      </p>
                    )}
                  </div>
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

            {/* AI Insights - Premium Reference Style */}
            <div className="mt-2">
              <h3 className="text-xs font-black text-nubank-light flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
                <Sparkles size={14} /> Extrato AI Insights
              </h3>
              <div className="space-y-3">
                {(() => {
                  const insights = [];
                  const { income, expense, savingsOut, savingsIn } = aggregates;

                  // Insight 1: Spending vs Income
                  if (expense > income && income > 0) {
                    insights.push({
                      icon: AlertTriangle,
                      color: 'border-l-error bg-error/5',
                      textColor: 'text-error',
                      text: `Seus gastos (R$ ${expense.toLocaleString('pt-BR')}) superaram as entradas este mês.`
                    });
                  } else if (income > 0) {
                    insights.push({
                      icon: Shield,
                      color: 'border-l-success bg-success/5',
                      textColor: 'text-success',
                      text: `Saúde financeira estável. Você utilizou ${( (expense/income)*100 ).toFixed(0)}% da sua renda este mês.`
                    });
                  }

                  // Insight 2: Savings
                  if (savingsOut > 0) {
                    insights.push({
                      icon: Zap,
                      color: 'border-l-primary bg-primary/5',
                      textColor: 'text-primary',
                      text: `Você aplicou R$ ${savingsOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em investimentos${savingsIn > 0 ? ` e resgatou R$ ${savingsIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''} este mês.`
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
          <motion.div variants={itemVariants} className="lg:col-span-7">
            <CategoryChart
              chartData={chartData}
              selectedCategories={categoryFilter}
              onCategoryClick={name => {
                setCategoryFilter(prev =>
                  prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
                );
                setTypeFilter('despesas');
              }}
            />
          </motion.div>

          {/* Transactions List with Search + Filter */}
          <motion.div variants={itemVariants} className="lg:col-span-5 glass-card p-8 rounded-[2.5rem] flex flex-col">
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
                    onClick={() => setTypeFilter(key)}
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

                    const styles = {
                      savings_out: { bg: 'bg-cyan-500/10', iconBg: 'text-cyan-400', icon: <PiggyBank size={18} />, color: 'text-cyan-400', border: 'border-cyan-500/20' },
                      savings_in:  { bg: 'bg-cyan-500/10', iconBg: 'text-cyan-400', icon: <PiggyBank size={18} />, color: 'text-cyan-400', border: 'border-cyan-500/20' },
                      income:      { bg: 'bg-success/10',  iconBg: 'text-success',   icon: <ArrowUpRight size={18} />, color: 'text-success', border: 'border-success/20' },
                      expense:     { bg: 'bg-white/[0.03]', iconBg: 'text-primary',  icon: <TrendingDown size={18} />, color: 'text-error',   border: 'border-white/5' },
                    }[cls] || { bg: 'bg-white/[0.03]', iconBg: 'text-primary', icon: <TrendingDown size={18} />, color: 'text-error', border: 'border-white/5' };

                    const catColor = CATEGORY_COLORS[cat] || '#94a3b8';
                    const bank = item.bank || (item.metadata?.banco) || null;

                    return (
                      <motion.div
                        key={item.id || i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        layout
                        className={`group flex items-start gap-3 p-4 rounded-2xl transition-all border ${styles.border} ${styles.bg} hover:bg-white/[0.07] hover:border-white/15`}
                      >
                        {/* Ícone */}
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 bg-white/5 ${styles.iconBg}`}>
                          {styles.icon}
                        </div>

                        {/* Descrição + categoria + banco */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {/* Badge categoria com cor */}
                            <span
                              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                              style={{ color: catColor, borderColor: `${catColor}40`, background: `${catColor}15` }}
                            >
                              {cat}
                            </span>
                            {/* Banco */}
                            {bank && (
                              <span className="text-[9px] font-semibold text-white/30">
                                {bank}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Valor + data */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                          <p className={`font-black text-sm whitespace-nowrap ${styles.color}`}>
                            {hideValues ? 'R$ •••••' : `${isPos ? '+' : '−'} R$ ${Math.abs(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </p>
                          <p className="text-[10px] font-medium text-white/40">
                            {formatDate(item.transaction_date)}
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
                    new:         { label: 'Nova',         cls: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30',  icon: <Clock size={10} /> },
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
            </>
          )}
        </motion.div>
      </div>

      {/* Ajuda IA — FAB flutuante canto inferior direito */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={() => setShowChat(true)}
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-xl shadow-secondary/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        title="Ajuda IA"
      >
        <MessageSquare size={22} />
        <span className="absolute right-16 bg-surface border border-outline-variant text-on-surface text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Ajuda IA
        </span>
      </motion.button>

    </div>
  );
}
