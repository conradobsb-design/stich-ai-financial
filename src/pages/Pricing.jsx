import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Zap, Shield, Star, ArrowLeft, Lock,
  TrendingUp, Bot, Users, FileText, Clock, Plug,
  Sparkles, ChevronRight, CreditCard, ShieldCheck, HeadphonesIcon,
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
    color: '#7c4a2d',
    colorDark: '#d4845a',
    glow: 'rgba(212,132,90,0.15)',
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
    color: '#b8730a',
    colorDark: '#e8a020',
    glow: 'rgba(232,160,32,0.25)',
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
    color: '#8b6914',
    colorDark: '#f0c040',
    glow: 'rgba(240,192,64,0.15)',
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

function PlanCard({ plan, annual, index, isLight }) {
  const navigate = useNavigate();
  const Icon = plan.icon;
  const price = annual ? plan.annualMonthly : plan.monthlyPrice;
  const accentColor = isLight ? plan.color : plan.colorDark;

  // Warm-palette card surfaces
  const cardBg = isLight
    ? plan.highlight
      ? 'rgba(255,255,255,1)'
      : 'rgba(255,250,242,0.95)'
    : plan.highlight
      ? 'linear-gradient(160deg, rgba(232,160,32,0.08) 0%, rgba(26,16,8,0.97) 60%)'
      : 'rgba(35,26,18,0.9)';

  const cardBorder = isLight
    ? plan.highlight
      ? '2px solid rgba(184,115,10,0.3)'
      : '1px solid rgba(124,74,45,0.1)'
    : plan.highlight
      ? '1.5px solid rgba(232,160,32,0.35)'
      : '1px solid rgba(250,245,236,0.06)';

  const cardShadow = isLight
    ? plan.highlight
      ? '0 20px 60px rgba(184,115,10,0.15), 0 4px 16px rgba(0,0,0,0.06)'
      : '0 4px 24px rgba(0,0,0,0.05)'
    : plan.highlight
      ? '0 0 80px rgba(232,160,32,0.15), 0 0 0 1px rgba(232,160,32,0.06) inset'
      : 'none';

  const textPrimary   = isLight ? '#3d1e0a' : '#faf5ec';
  const textSecondary = isLight ? 'rgba(61,30,10,0.45)' : 'rgba(250,245,236,0.28)';
  const textBody      = isLight ? 'rgba(61,30,10,0.72)' : 'rgba(250,245,236,0.72)';
  const dividerColor  = isLight ? 'rgba(124,74,45,0.08)' : 'rgba(250,245,236,0.06)';
  const lockedOpacity = isLight ? 0.3 : 0.2;

  // Warm highlight gradient
  const highlightGrad = isLight
    ? 'linear-gradient(135deg, #b8730a, #7c4a2d)'
    : 'linear-gradient(135deg, #e8a020, #c06820)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: plan.highlight ? -20 : 0 }}
      transition={{ delay: 0.15 + index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col"
      style={{ zIndex: plan.highlight ? 10 : 1 }}
    >
      {/* Popular pill */}
      {plan.highlight && (
        <div className="absolute -top-5 inset-x-0 flex justify-center z-20">
          <div
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
            style={{
              background: highlightGrad,
              color: '#fff',
              boxShadow: '0 4px 24px rgba(184,115,10,0.4)',
            }}
          >
            <Sparkles size={10} /> Mais Popular · 14 dias grátis
          </div>
        </div>
      )}

      <div
        className="relative flex flex-col flex-1 overflow-hidden"
        style={{
          borderRadius: '1.5rem',
          background: cardBg,
          border: cardBorder,
          boxShadow: cardShadow,
          backdropFilter: isLight ? 'none' : 'blur(16px)',
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[2px] w-full shrink-0"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />

        <div className="p-7 flex flex-col flex-1 gap-5 pt-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}28`,
                }}
              >
                <Icon size={19} style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className="font-black text-[15px] leading-tight" style={{ color: textPrimary }}>{plan.name}</h3>
                <p className="text-[10px] mt-0.5 leading-none" style={{ color: `${accentColor}${isLight ? 'cc' : '99'}` }}>
                  {plan.tagline}
                </p>
              </div>
            </div>
            {plan.id === 'family_office' && (
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shrink-0"
                style={{
                  background: `${accentColor}10`,
                  color: accentColor,
                  border: `1px solid ${accentColor}30`,
                }}
              >
                Ultra Premium
              </span>
            )}
          </div>

          {/* Price */}
          <div className="py-4" style={{ borderTop: `1px solid ${dividerColor}`, borderBottom: `1px solid ${dividerColor}` }}>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-sm font-bold mb-2" style={{ color: textSecondary }}>R$</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={price}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="font-black leading-none tracking-tighter"
                  style={{
                    fontSize: '3.2rem',
                    ...(plan.highlight
                      ? {
                          background: highlightGrad,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : { color: textPrimary }),
                  }}
                >
                  {price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm font-bold mb-2" style={{ color: textSecondary }}>/mês</span>
            </div>
            {annual ? (
              <p className="text-[11px] font-bold" style={{ color: accentColor }}>
                Cobrado R$ {plan.annualPrice.toLocaleString('pt-BR')}/ano · você economiza R$ {(plan.monthlyPrice * 2).toLocaleString('pt-BR')}
              </p>
            ) : (
              <p className="text-[11px]" style={{ color: textSecondary }}>
                {plan.id !== 'essencial'
                  ? `No anual: R$ ${plan.annualMonthly.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês`
                  : 'Sem contrato · cancele quando quiser'}
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
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ background: `${accentColor}18` }}
                  >
                    <FIcon size={9} style={{ color: accentColor }} />
                  </div>
                  <span className="text-[12.5px] leading-snug" style={{ color: textBody }}>{f.text}</span>
                </motion.div>
              );
            })}

            {plan.locked.length > 0 && (
              <div className="space-y-2.5 pt-2 mt-1" style={{ borderTop: `1px solid ${dividerColor}` }}>
                {plan.locked.map((text, i) => (
                  <div key={i} className="flex items-start gap-3" style={{ opacity: lockedOpacity }}>
                    <div
                      className="w-[18px] h-[18px] rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                      style={{ background: isLight ? 'rgba(61,30,10,0.05)' : 'rgba(250,245,236,0.05)' }}
                    >
                      <Lock size={7} style={{ color: isLight ? '#a08060' : 'rgba(250,245,236,0.4)' }} />
                    </div>
                    <span className="text-[12px] line-through" style={{ color: isLight ? '#a08060' : 'rgba(250,245,236,0.4)' }}>{text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-2 pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/onboarding?plan=${plan.id}`)}
              className="w-full py-3.5 rounded-2xl font-black text-[13px] tracking-wide flex items-center justify-center gap-2 transition-all"
              style={plan.highlight
                ? {
                    background: highlightGrad,
                    color: '#fff',
                    boxShadow: isLight
                      ? '0 8px 24px rgba(184,115,10,0.3)'
                      : '0 8px 32px rgba(232,160,32,0.35)',
                  }
                : {
                    background: `${accentColor}10`,
                    color: accentColor,
                    border: `1px solid ${accentColor}30`,
                  }
              }
            >
              {plan.cta}
              <ChevronRight size={14} />
            </motion.button>
            {plan.trial && (
              <p className="text-center text-[10px] font-medium" style={{ color: isLight ? 'rgba(184,115,10,0.6)' : 'rgba(232,160,32,0.55)' }}>
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
  const { user, theme } = useApp();
  const isLight = theme === 'light';

  // Warm palette tokens
  const pageBg        = isLight ? '#faf5ec' : '#120e0a';
  const textPrimary   = isLight ? '#3d1e0a' : '#faf5ec';
  const textSecondary = isLight ? 'rgba(61,30,10,0.45)' : 'rgba(250,245,236,0.38)';
  const textMuted     = isLight ? 'rgba(61,30,10,0.3)' : 'rgba(250,245,236,0.2)';
  const dividerColor  = isLight ? 'rgba(124,74,45,0.08)' : 'rgba(250,245,236,0.05)';

  const toggleTrack = isLight
    ? annual ? 'rgba(184,115,10,0.2)' : 'rgba(61,30,10,0.08)'
    : annual ? 'rgba(232,160,32,0.35)' : 'rgba(250,245,236,0.07)';
  const toggleThumb = isLight
    ? annual ? '#b8730a' : 'rgba(61,30,10,0.3)'
    : annual ? '#e8a020' : 'rgba(250,245,236,0.55)';

  const badgeBg     = isLight ? 'rgba(184,115,10,0.08)' : 'rgba(232,160,32,0.07)';
  const badgeColor  = isLight ? '#7c4a2d' : '#e8a020';
  const badgeBorder = isLight ? 'rgba(124,74,45,0.2)' : 'rgba(232,160,32,0.18)';

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ background: pageBg }}>

      {/* Ambient glows — warm tones */}
      <div className="fixed pointer-events-none" style={{
        top: '-200px', left: '50%', transform: 'translateX(-50%)',
        width: '900px', height: '900px',
        background: isLight
          ? 'radial-gradient(circle, rgba(184,115,10,0.08) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(232,160,32,0.09) 0%, transparent 65%)',
        zIndex: 0,
      }} />
      <div className="fixed pointer-events-none" style={{
        bottom: '-100px', right: '-100px',
        width: '600px', height: '600px',
        background: isLight
          ? 'radial-gradient(circle, rgba(124,74,45,0.06) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(212,132,90,0.06) 0%, transparent 65%)',
        zIndex: 0,
      }} />
      <div className="fixed pointer-events-none" style={{
        bottom: '10%', left: '-100px',
        width: '500px', height: '500px',
        background: isLight
          ? 'radial-gradient(circle, rgba(139,105,20,0.05) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(240,192,64,0.04) 0%, transparent 65%)',
        zIndex: 0,
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-24">

        {/* Back button */}
        <button
          onClick={() => navigate(user ? '/dashboard' : '/')}
          className="flex items-center gap-2 text-[13px] font-medium transition-colors mb-16"
          style={{ color: textMuted }}
          onMouseEnter={e => e.currentTarget.style.color = isLight ? 'rgba(61,30,10,0.7)' : 'rgba(250,245,236,0.75)'}
          onMouseLeave={e => e.currentTarget.style.color = textMuted}
        >
          <ArrowLeft size={15} /> {user ? 'Voltar ao Dashboard' : 'Voltar à Home'}
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[11px] font-black uppercase tracking-[0.15em]"
            style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}
          >
            <Zap size={10} /> Planos & Preços
          </div>

          <h1
            className="font-black tracking-tighter leading-[0.9] mb-5"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontFamily: 'Manrope, sans-serif', color: textPrimary }}
          >
            Controle financeiro<br />
            <span style={{
              background: isLight
                ? 'linear-gradient(135deg, #7c4a2d 0%, #b8730a 100%)'
                : 'linear-gradient(135deg, #e8a020 0%, #d4845a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              de alto padrão
            </span>
          </h1>

          <p className="text-lg max-w-md mx-auto mb-10" style={{ color: textSecondary }}>
            Inteligência preditiva real para quem leva patrimônio a sério.
          </p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-5"
          >
            <span className="text-sm font-bold" style={{ color: !annual ? textPrimary : textMuted }}>Mensal</span>
            <button
              onClick={() => setAnnual(v => !v)}
              className="relative w-14 h-7 rounded-full transition-all duration-300"
              style={{
                background: toggleTrack,
                border: isLight ? '1px solid rgba(61,30,10,0.1)' : '1px solid rgba(250,245,236,0.09)',
              }}
            >
              <motion.div
                animate={{ x: annual ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full"
                style={{ background: toggleThumb }}
              />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold" style={{ color: annual ? textPrimary : textMuted }}>Anual</span>
              <AnimatePresence>
                {annual && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-[10px] font-black px-2.5 py-1 rounded-full"
                    style={isLight
                      ? { background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }
                      : { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }
                    }
                  >
                    2 meses grátis
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pb-4 pt-6">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} index={i} isLight={isLight} />
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-20 pt-8"
          style={{ borderTop: `1px solid ${dividerColor}` }}
        >
          {[
            { icon: CreditCard,     text: 'Pagamento seguro via Stripe' },
            { icon: ShieldCheck,    text: 'Criptografia bank-grade' },
            { icon: Lock,           text: 'Cancele a qualquer momento' },
            { icon: HeadphonesIcon, text: 'Suporte VIP 24/7' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2" style={{ color: textMuted, fontSize: '12px' }}>
              <Icon size={13} style={{ color: isLight ? 'rgba(61,30,10,0.25)' : 'rgba(250,245,236,0.18)' }} />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
