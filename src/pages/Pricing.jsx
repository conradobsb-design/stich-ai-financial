import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, Zap, Shield, Star, ArrowLeft,
  TrendingUp, Bot, Users, FileText, Clock, Plug
} from 'lucide-react';

// Links do Stripe Payment Links — configurar no Coolify após criar os produtos no Stripe
const STRIPE_LINKS = {
  essencial: {
    monthly: import.meta.env.VITE_STRIPE_LINK_ESSENCIAL_MONTHLY || '#',
    annual:  import.meta.env.VITE_STRIPE_LINK_ESSENCIAL_ANNUAL  || '#',
  },
  private: {
    monthly: import.meta.env.VITE_STRIPE_LINK_PRIVATE_MONTHLY || '#',
    annual:  import.meta.env.VITE_STRIPE_LINK_PRIVATE_ANNUAL  || '#',
  },
  family_office: {
    monthly: import.meta.env.VITE_STRIPE_LINK_FAMILY_MONTHLY || '#',
    annual:  import.meta.env.VITE_STRIPE_LINK_FAMILY_ANNUAL  || '#',
  },
};

const PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    icon: Shield,
    color: '#22d3ee',
    monthlyPrice: 49,
    annualPrice: 490,
    annualMonthly: 40.83,
    description: 'Para quem está começando a organizar as finanças.',
    highlight: false,
    badge: null,
    features: [
      { icon: Check, text: 'Importação ilimitada de PDFs' },
      { icon: Check, text: 'Categorização automática com IA' },
      { icon: Check, text: 'Dashboard com gráficos e indicadores' },
      { icon: Check, text: 'Histórico completo sem limite de meses' },
      { icon: Check, text: 'Health Score financeiro (7 dimensões)' },
      { icon: Check, text: 'Exportação de dados' },
    ],
    locked: [
      { text: 'Projeções Prophet (Meta AI)' },
      { text: 'Chat IA assistente financeiro' },
      { text: 'Integração bancária automática' },
    ],
  },
  {
    id: 'private',
    name: 'Private',
    icon: Zap,
    color: '#a78bfa',
    monthlyPrice: 197,
    annualPrice: 1970,
    annualMonthly: 164.17,
    description: 'Para quem quer inteligência preditiva real.',
    highlight: true,
    badge: '14 dias grátis',
    features: [
      { icon: Check, text: 'Tudo do plano Essencial' },
      { icon: TrendingUp, text: 'Projeções Prophet (Meta AI) — 5 modelos' },
      { icon: Bot, text: 'Chat IA assistente financeiro' },
      { icon: Check, text: 'Histórico 36 meses com análise anual' },
      { icon: Check, text: 'Monte Carlo + HHI + reserva de emergência' },
      { icon: Plug, text: 'Integração bancária automática (Pluggy)' },
    ],
    locked: [
      { text: 'Multi-usuário (até 6 membros)' },
      { text: 'Relatório PDF executivo' },
      { text: 'SLA de suporte 4 horas' },
    ],
  },
  {
    id: 'family_office',
    name: 'Family Office',
    icon: Star,
    color: '#f59e0b',
    monthlyPrice: 497,
    annualPrice: 4970,
    annualMonthly: 414.17,
    description: 'Para famílias e escritórios de alta renda.',
    highlight: false,
    badge: 'Ultra Premium',
    features: [
      { icon: Check, text: 'Tudo do plano Private' },
      { icon: Users, text: 'Multi-usuário — até 6 membros' },
      { icon: FileText, text: 'Relatório PDF executivo mensal' },
      { icon: Check, text: 'Soraya IA — consultora financeira pessoal' },
      { icon: Check, text: 'Audit log completo de todas as ações' },
      { icon: Clock, text: 'SLA de suporte prioritário 4 horas' },
    ],
    locked: [],
  },
];

function PlanCard({ plan, annual, delay }) {
  const navigate = useNavigate();
  const Icon = plan.icon;
  const price = annual ? plan.annualMonthly : plan.monthlyPrice;
  const stripeLink = STRIPE_LINKS[plan.id]?.[annual ? 'annual' : 'monthly'] || '#';

  const handleSubscribe = () => {
    if (stripeLink === '#') {
      alert('Em breve! Estamos configurando os pagamentos.');
      return;
    }
    window.location.href = stripeLink;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="relative flex flex-col rounded-[2rem] overflow-hidden"
      style={{
        background: plan.highlight
          ? `linear-gradient(135deg, ${plan.color}14 0%, rgba(10,14,26,0.95) 60%)`
          : 'rgba(15,20,35,0.8)',
        border: plan.highlight
          ? `1.5px solid ${plan.color}50`
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: plan.highlight
          ? `0 0 60px ${plan.color}18`
          : 'none',
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{ background: `${plan.color}22`, color: plan.color, border: `1px solid ${plan.color}40` }}
        >
          {plan.badge}
        </div>
      )}

      <div className="p-8 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `${plan.color}20` }}
          >
            <Icon size={20} style={{ color: plan.color }} />
          </div>
          <div>
            <h3 className="font-black text-white text-lg leading-none">{plan.name}</h3>
            <p className="text-[11px] text-white/40 mt-0.5">{plan.description}</p>
          </div>
        </div>

        {/* Preço */}
        <div className="mb-6">
          <div className="flex items-end gap-1">
            <span className="text-[11px] font-bold text-white/40 mb-2">R$</span>
            <span className="text-5xl font-black text-white leading-none">
              {price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[11px] font-bold text-white/40 mb-2">/mês</span>
          </div>
          {annual && (
            <p className="text-[10px] font-bold mt-1" style={{ color: plan.color }}>
              R$ {plan.annualPrice.toLocaleString('pt-BR')}/ano · 2 meses grátis
            </p>
          )}
          {!annual && plan.id === 'private' && (
            <p className="text-[10px] text-white/30 mt-1">No anual: R$ 164/mês</p>
          )}
        </div>

        {/* Features incluídas */}
        <div className="space-y-2.5 flex-1">
          {plan.features.map((f, i) => {
            const FIcon = f.icon;
            return (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                  style={{ background: `${plan.color}20` }}
                >
                  <FIcon size={9} style={{ color: plan.color }} />
                </div>
                <span className="text-[12px] text-white/75">{f.text}</span>
              </div>
            );
          })}

          {/* Features bloqueadas (próximo plano) */}
          {plan.locked.length > 0 && (
            <>
              <div className="border-t border-white/5 pt-2 mt-2" />
              {plan.locked.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 opacity-30">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0 bg-white/5">
                    <Check size={9} className="text-white/30" />
                  </div>
                  <span className="text-[12px] text-white/40 line-through">{f.text}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          className="mt-8 w-full py-3.5 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: plan.highlight
              ? `linear-gradient(135deg, ${plan.color}, ${plan.color}bb)`
              : `${plan.color}18`,
            color: plan.highlight ? '#000' : plan.color,
            border: plan.highlight ? 'none' : `1px solid ${plan.color}40`,
          }}
        >
          {plan.id === 'private' ? 'Começar Trial Grátis' : 'Assinar Agora'}
        </button>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070b18] text-white pb-24" style={{
      backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(167,139,250,0.06) 0%, transparent 60%)',
    }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-10 text-sm"
        >
          <ArrowLeft size={16} /> Voltar ao Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[11px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
            <Zap size={11} /> Planos & Preços
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4">
            Controle financeiro<br />
            <span style={{ color: '#a78bfa' }}>de alto padrão</span>
          </h1>
          <p className="text-white/50 text-lg max-w-lg mx-auto">
            Inteligência preditiva real para quem leva patrimônio a sério.
          </p>
        </motion.div>

        {/* Toggle mensal / anual */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-bold transition-colors ${!annual ? 'text-white' : 'text-white/30'}`}>Mensal</span>
          <button
            onClick={() => setAnnual(v => !v)}
            className="relative w-12 h-6 rounded-full transition-all"
            style={{ background: annual ? '#a78bfa' : 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: annual ? '1.75rem' : '0.25rem' }}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold transition-colors ${annual ? 'text-white' : 'text-white/30'}`}>Anual</span>
            {annual && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                2 meses grátis
              </span>
            )}
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} delay={0.1 + i * 0.1} />
          ))}
        </div>

        {/* Rodapé */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16 space-y-2"
        >
          <p className="text-white/25 text-sm">Pagamento seguro via Stripe · Cancele a qualquer momento</p>
          <p className="text-white/20 text-xs">Os preços são em Reais (BRL) e incluem todos os impostos</p>
        </motion.div>
      </div>
    </div>
  );
}
