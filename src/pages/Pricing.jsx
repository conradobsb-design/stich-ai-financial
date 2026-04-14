import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Zap, Shield, Star, ArrowLeft, Lock,
  TrendingUp, Bot, Users, FileText, Clock, Plug,
  Sparkles, ChevronRight
} from 'lucide-react';

const STRIPE_LINKS = {
  essencial:    { monthly: import.meta.env.VITE_STRIPE_LINK_ESSENCIAL_MONTHLY || '#', annual: import.meta.env.VITE_STRIPE_LINK_ESSENCIAL_ANNUAL || '#' },
  private:      { monthly: import.meta.env.VITE_STRIPE_LINK_PRIVATE_MONTHLY  || '#', annual: import.meta.env.VITE_STRIPE_LINK_PRIVATE_ANNUAL  || '#' },
  family_office:{ monthly: import.meta.env.VITE_STRIPE_LINK_FAMILY_MONTHLY   || '#', annual: import.meta.env.VITE_STRIPE_LINK_FAMILY_ANNUAL   || '#' },
};

const PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    tagline: 'Organize. Categorize. Evolua.',
    icon: Shield,
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.15)',
    monthlyPrice: 49,
    annualPrice: 490,
    annualMonthly: 40.83,
    highlight: false,
    cta: 'Começar agora',
    features: [
      { icon: Check,      text: 'Importação ilimitada de PDFs' },
      { icon: Check,      text: 'Categorização automática com IA' },
      { icon: Check,      text: 'Dashboard com gráficos e indicadores' },
      { icon: Check,      text: 'Histórico completo de transações' },
      { icon: Check,      text: 'Health Score — 7 dimensões' },
      { icon: Check,      text: 'Exportação de dados' },
    ],
    locked: ['Projeções Prophet (Meta AI)', 'Chat IA', 'Integração bancária automática'],
  },
  {
    id: 'private',
    name: 'Private',
    tagline: 'Inteligência preditiva real.',
    icon: Zap,
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.25)',
    monthlyPrice: 197,
    annualPrice: 1970,
    annualMonthly: 164.17,
    highlight: true,
    cta: 'Começar Trial Grátis',
    trial: '14 dias grátis · sem cartão',
    features: [
      { icon: Check,      text: 'Tudo do Essencial' },
      { icon: TrendingUp, text: 'Prophet (Meta AI) — 5 modelos preditivos' },
      { icon: Bot,        text: 'Chat IA — assistente financeiro pessoal' },
      { icon: Check,      text: 'Histórico 36 meses + análise anual' },
      { icon: Check,      text: 'Monte Carlo · HHI · Reserva de emergência' },
      { icon: Plug,       text: 'Integração bancária automática (Pluggy)' },
    ],
    locked: ['Multi-usuário (até 6 membros)', 'Relatório PDF executivo', 'SLA 4 horas'],
  },
  {
    id: 'family_office',
    name: 'Family Office',
    tagline: 'Gestão patrimonial familiar.',
    icon: Star,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
    monthlyPrice: 497,
    annualPrice: 4970,
    annualMonthly: 414.17,
    highlight: false,
    cta: 'Falar com especialista',
    features: [
      { icon: Check,      text: 'Tudo do Private' },
      { icon: Users,      text: 'Multi-usuário — até 6 membros' },
      { icon: FileText,   text: 'Relatório PDF executivo mensal' },
      { icon: Sparkles,   text: 'Soraya IA — consultora financeira pessoal' },
      { icon: Check,      text: 'Audit log completo de todas as ações' },
      { icon: Clock,      text: 'SLA de suporte prioritário — 4 horas' },
    ],
    locked: [],
  },
];

function PlanCard({ plan, annual, index }) {
  const navigate = useNavigate();
  const Icon = plan.icon;
  const price = annual ? plan.annualMonthly : plan.monthlyPrice;
  const stripeLink = STRIPE_LINKS[plan.id]?.[annual ? 'annual' : 'monthly'] || '#';

  const handleSubscribe = () => {
    if (stripeLink === '#') { alert('Em breve!'); return; }
    window.location.href = stripeLink;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: plan.highlight ? -16 : 0 }}
      transition={{ delay: 0.15 + index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col"
      style={{ zIndex: plan.highlight ? 10 : 1 }}
    >
      {/* Popular ribbon */}
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', boxShadow: '0 4px 24px rgba(167,139,250,0.5)' }}>
            <Sparkles size={10} /> Mais Popular · 14 dias grátis
          </div>
        </div>
      )}

      <div
        className="relative flex flex-col flex-1 rounded-[2rem] overflow-hidden"
        style={{
          background: plan.highlight
            ? 'linear-gradient(160deg, rgba(167,139,250,0.12) 0%, rgba(10,12,24,0.98) 50%)'
            : 'rgba(12,16,28,0.85)',
          border: plan.highlight
            ? '1.5px solid rgba(167,139,250,0.45)'
            : '1px solid rgba(255,255,255,0.07)',
          boxShadow: plan.highlight
            ? `0 0 80px rgba(167,139,250,0.2), 0 0 0 1px rgba(167,139,250,0.1) inset`
            : 'none',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Top accent line */}
        <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />

        <div className="p-8 flex flex-col flex-1 gap-6">

          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}30` }}>
                  <Icon size={18} style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base leading-none">{plan.name}</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: `${plan.color}90` }}>{plan.tagline}</p>
                </div>
              </div>
              {plan.id === 'family_office' && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                  Ultra Premium
                </span>
              )}
            </div>
          </div>

          {/* Preço */}
          <div className="py-4 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-sm font-bold mb-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>R$</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={price}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-[3.5rem] font-black leading-none tracking-tighter text-white"
                >
                  {price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm font-bold mb-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>/mês</span>
            </div>
            {annual ? (
              <p className="text-[11px] font-bold" style={{ color: plan.color }}>
                Cobrado R$ {plan.annualPrice.toLocaleString('pt-BR')}/ano · você economiza R$ {(plan.monthlyPrice * 2).toLocaleString('pt-BR')}
              </p>
            ) : (
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {plan.id !== 'essencial' ? `No anual: R$ ${plan.annualMonthly.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês` : 'Sem contrato · cancele quando quiser'}
              </p>
            )}
          </div>

          {/* Features */}
          <div className="flex-1 space-y-3">
            {plan.features.map((f, i) => {
              const FIcon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ background: `${plan.color}18` }}>
                    <FIcon size={9} style={{ color: plan.color }} />
                  </div>
                  <span className="text-[12.5px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>{f.text}</span>
                </motion.div>
              );
            })}

            {plan.locked.length > 0 && (
              <div className="pt-2 mt-1 space-y-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {plan.locked.map((text, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-25">
                    <div className="w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center bg-white/5">
                      <Lock size={7} className="text-white/40" />
                    </div>
                    <span className="text-[12px] text-white/40 line-through">{text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubscribe}
              className="w-full py-4 rounded-2xl font-black text-[13px] tracking-wide flex items-center justify-center gap-2 transition-all"
              style={plan.highlight ? {
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(167,139,250,0.4)',
              } : {
                background: `${plan.color}12`,
                color: plan.color,
                border: `1px solid ${plan.color}35`,
              }}
            >
              {plan.cta}
              <ChevronRight size={15} />
            </motion.button>
            {plan.trial && (
              <p className="text-center text-[10px] font-medium" style={{ color: 'rgba(167,139,250,0.6)' }}>
                {plan.trial}
              </p>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white overflow-hidden" style={{
      background: '#06080f',
      backgroundImage: `
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(167,139,250,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(34,211,238,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 40% 30% at 10% 90%, rgba(245,158,11,0.05) 0%, transparent 60%)
      `,
    }}>
      {/* Voltar */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-[13px] font-medium transition-colors mb-14"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          <ArrowLeft size={15} /> Voltar ao Dashboard
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[11px] font-black uppercase tracking-[0.15em]"
            style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
            <Zap size={10} /> Planos & Preços
          </div>

          <h1 className="font-black tracking-tighter leading-[0.9] mb-5"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
            Controle financeiro<br />
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>de alto padrão</span>
          </h1>
          <p className="text-lg max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Inteligência preditiva real para quem leva patrimônio a sério.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-5 mb-20"
        >
          <span className="text-sm font-bold transition-colors" style={{ color: !annual ? '#fff' : 'rgba(255,255,255,0.3)' }}>
            Mensal
          </span>
          <button
            onClick={() => setAnnual(v => !v)}
            className="relative w-14 h-7 rounded-full transition-all duration-300"
            style={{ background: annual ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <motion.div
              animate={{ x: annual ? 28 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 rounded-full"
              style={{ background: annual ? '#a78bfa' : 'rgba(255,255,255,0.6)' }}
            />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold transition-colors" style={{ color: annual ? '#fff' : 'rgba(255,255,255,0.3)' }}>
              Anual
            </span>
            <AnimatePresence>
              {annual && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[10px] font-black px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  2 meses grátis
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start pb-8">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} index={i} />
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16 pb-16"
          style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}
        >
          {['Pagamento seguro via Stripe', 'Cancele a qualquer momento', 'Preços em BRL com impostos inclusos', 'Suporte via e-mail'].map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
              <span>{t}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
