import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  ArrowLeft, ArrowRight, Check, Zap, Shield, Star,
  TrendingUp, MinusCircle, PiggyBank, Users, Clock,
  BarChart2, Eye, EyeOff, ChevronRight, Sparkles,
} from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAN_META = {
  essencial: {
    name: 'Essencial', color: '#22d3ee', icon: Shield,
    price: 'R$ 49/mês', tagline: 'Organize. Categorize. Evolua.',
    trial: false,
  },
  private: {
    name: 'Private', color: '#a78bfa', icon: Zap,
    price: 'R$ 197/mês', tagline: 'Inteligência preditiva real.',
    trial: true, trialDays: 14,
  },
  family_office: {
    name: 'Family Office', color: '#f59e0b', icon: Star,
    price: 'R$ 497/mês', tagline: 'Gestão patrimonial familiar.',
    trial: false,
  },
};

const INCOME_RANGES = [
  { id: 'ate_5k',    label: 'Até R$ 5.000',           sub: 'por mês' },
  { id: '5k_15k',   label: 'R$ 5.000 – R$ 15.000',   sub: 'por mês' },
  { id: '15k_50k',  label: 'R$ 15.000 – R$ 50.000',  sub: 'por mês' },
  { id: 'acima_50k',label: 'Acima de R$ 50.000',      sub: 'por mês' },
];

const BANKS = [
  'Itaú', 'Bradesco', 'Nubank', 'Santander', 'Banco do Brasil',
  'Caixa', 'Inter', 'BTG Pactual', 'XP', 'C6 Bank',
  'Sicredi', 'Sicoob', 'Safra', 'Outro',
];

const GOALS = [
  { id: 'organizar',    icon: BarChart2,   label: 'Organizar finanças',        sub: 'Ter visão clara de entradas e saídas' },
  { id: 'dividas',      icon: MinusCircle, label: 'Reduzir dívidas',           sub: 'Controlar e eliminar compromissos' },
  { id: 'reserva',      icon: PiggyBank,   label: 'Reserva de emergência',     sub: 'Construir colchão financeiro de 6×' },
  { id: 'investir',     icon: TrendingUp,  label: 'Investir mais',             sub: 'Aumentar aplicações mensais' },
  { id: 'familia',      icon: Users,       label: 'Controle familiar',         sub: 'Gestão do patrimônio familiar' },
  { id: 'aposentadoria',icon: Clock,       label: 'Aposentadoria',             sub: 'Planejar independência financeira' },
];

const STRIPE_LINKS = {
  essencial:    import.meta.env.VITE_STRIPE_LINK_ESSENCIAL_MONTHLY || '#',
  family_office:import.meta.env.VITE_STRIPE_LINK_FAMILY_MONTHLY   || '#',
};

// ── Animação de slide ─────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'private';
  const plan = PLAN_META[planId] || PLAN_META.private;
  const PlanIcon = plan.icon;

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    incomeRange: '', banks: [], goals: [],
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TOTAL_STEPS = 5;

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setError('');
    setStep(next);
  };

  const toggleArr = (field, val) =>
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
    }));

  // ── Ativar conta ────────────────────────────────────────────────────────────
  const activate = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Criar conta Supabase
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } },
      });
      if (signUpErr) throw signUpErr;

      const userId = data.user?.id;
      if (!userId) throw new Error('Não foi possível criar o usuário. Tente novamente.');

      // 2. Salvar perfil
      await supabase.schema('stich_ai').from('profiles').upsert({
        user_id: userId,
        full_name: form.name,
        income_range: form.incomeRange,
        banks: form.banks,
        goals: form.goals,
      });

      // 3a. Trial (Private) → cria subscription e vai pro dashboard
      if (plan.trial) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        await supabase.schema('stich_ai').from('subscriptions').insert({
          user_id: userId,
          plan: planId,
          status: 'trialing',
          billing: 'monthly',
          trial_ends_at: trialEnd.toISOString(),
        });
        navigate('/dashboard');
        return;
      }

      // 3b. Plano pago → Stripe com email pré-preenchido
      const stripeBase = STRIPE_LINKS[planId];
      if (stripeBase && stripeBase !== '#') {
        window.location.href = `${stripeBase}?prefilled_email=${encodeURIComponent(form.email)}`;
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── Validação por step ──────────────────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6;
    if (step === 2) return !!form.incomeRange;
    if (step === 3) return form.goals.length > 0;
    return true;
  };

  // ── Render steps ────────────────────────────────────────────────────────────
  const steps = [
    // STEP 0 — Plano
    <div key="plano" className="flex flex-col items-center gap-8 max-w-sm mx-auto text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: `${plan.color}15`, border: `1.5px solid ${plan.color}35` }}>
        <PlanIcon size={36} style={{ color: plan.color }} />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: plan.color }}>Plano selecionado</p>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-2">{plan.name}</h2>
        <p className="text-white/40 text-base">{plan.tagline}</p>
      </div>
      <div className="w-full p-5 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Preço</span>
          <span className="font-black text-white">{plan.price}</span>
        </div>
        {plan.trial && (
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Trial</span>
            <span className="font-black" style={{ color: plan.color }}>{plan.trialDays} dias grátis · sem cartão</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Cancela</span>
          <span className="font-black text-white">A qualquer momento</span>
        </div>
      </div>
      <button onClick={() => navigate('/pricing')} className="text-sm text-white/25 hover:text-white/60 transition-colors">
        ← Trocar plano
      </button>
    </div>,

    // STEP 1 — Conta
    <div key="conta" className="flex flex-col gap-5 max-w-sm mx-auto w-full">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-black text-white tracking-tighter">Crie sua conta</h2>
        <p className="text-white/40 mt-1 text-sm">Você terá acesso imediato após o cadastro.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2 block">Nome completo</label>
          <input
            type="text" autoFocus placeholder="Seu nome"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-2xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            onFocus={e => e.target.style.borderColor = plan.color}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2 block">E-mail</label>
          <input
            type="email" placeholder="seu@email.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-2xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            onFocus={e => e.target.style.borderColor = plan.color}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2 block">Senha</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-2xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all pr-12"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              onFocus={e => e.target.style.borderColor = plan.color}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-white/20">
        Já tem conta?{' '}
        <Link to="/login" className="underline hover:text-white/60 transition-colors">Entrar</Link>
      </p>
    </div>,

    // STEP 2 — Perfil financeiro
    <div key="perfil" className="flex flex-col gap-6 max-w-lg mx-auto w-full">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-black text-white tracking-tighter">Seu perfil financeiro</h2>
        <p className="text-white/40 mt-1 text-sm">Personalizamos sua experiência com base nessas respostas.</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Faixa de renda mensal</p>
        <div className="grid grid-cols-2 gap-3">
          {INCOME_RANGES.map(r => (
            <button key={r.id} onClick={() => setForm(f => ({ ...f, incomeRange: r.id }))}
              className="p-4 rounded-2xl text-left transition-all"
              style={{
                background: form.incomeRange === r.id ? `${plan.color}15` : 'rgba(255,255,255,0.03)',
                border: form.incomeRange === r.id ? `1.5px solid ${plan.color}50` : '1px solid rgba(255,255,255,0.07)',
              }}>
              <p className="text-[13px] font-black text-white">{r.label}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{r.sub}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Bancos que usa</p>
        <div className="flex flex-wrap gap-2">
          {BANKS.map(b => (
            <button key={b} onClick={() => toggleArr('banks', b)}
              className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all"
              style={{
                background: form.banks.includes(b) ? `${plan.color}15` : 'rgba(255,255,255,0.04)',
                border: form.banks.includes(b) ? `1px solid ${plan.color}45` : '1px solid rgba(255,255,255,0.07)',
                color: form.banks.includes(b) ? plan.color : 'rgba(255,255,255,0.5)',
              }}>
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // STEP 3 — Objetivos
    <div key="objetivos" className="flex flex-col gap-6 max-w-lg mx-auto w-full">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-black text-white tracking-tighter">Seus objetivos</h2>
        <p className="text-white/40 mt-1 text-sm">Selecione quantos quiser. O assistente IA vai usar isso.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => {
          const GIcon = g.icon;
          const active = form.goals.includes(g.id);
          return (
            <button key={g.id} onClick={() => toggleArr('goals', g.id)}
              className="p-4 rounded-2xl text-left transition-all flex items-start gap-3"
              style={{
                background: active ? `${plan.color}12` : 'rgba(255,255,255,0.03)',
                border: active ? `1.5px solid ${plan.color}45` : '1px solid rgba(255,255,255,0.07)',
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: active ? `${plan.color}20` : 'rgba(255,255,255,0.06)' }}>
                <GIcon size={15} style={{ color: active ? plan.color : 'rgba(255,255,255,0.35)' }} />
              </div>
              <div>
                <p className="text-[12px] font-black text-white leading-snug">{g.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5 leading-snug">{g.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>,

    // STEP 4 — Ativar
    <div key="ativar" className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: `${plan.color}15`, border: `2px solid ${plan.color}40`, boxShadow: `0 0 40px ${plan.color}25` }}>
        <Sparkles size={32} style={{ color: plan.color }} />
      </motion.div>
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Tudo pronto.</h2>
        <p className="text-white/40 text-sm leading-relaxed">
          {plan.trial
            ? `Seu trial de ${plan.trialDays} dias começa agora. Sem cartão de crédito.`
            : `Você será redirecionado para o pagamento seguro via Stripe.`}
        </p>
      </div>
      <div className="w-full p-5 rounded-2xl space-y-2.5 text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          ['Plano', plan.name],
          ['Nome', form.name],
          ['E-mail', form.email],
          ['Renda', INCOME_RANGES.find(r => r.id === form.incomeRange)?.label || '—'],
          ['Objetivos', form.goals.length > 0 ? `${form.goals.length} selecionados` : '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-white/30">{k}</span>
            <span className="font-bold text-white truncate max-w-[60%] text-right">{v}</span>
          </div>
        ))}
      </div>
      {error && <p className="text-red-400 text-[12px] font-medium text-center">{error}</p>}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={activate}
        disabled={loading}
        className="w-full py-4 rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 transition-all"
        style={{
          background: loading ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${plan.color}, ${plan.color}bb)`,
          color: loading ? 'rgba(255,255,255,0.3)' : plan.id === 'private' ? '#fff' : '#000',
          boxShadow: loading ? 'none' : `0 8px 32px ${plan.color}40`,
        }}
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Criando conta...</>
        ) : plan.trial ? (
          <><Sparkles size={16} /> Começar {plan.trialDays} dias grátis</>
        ) : (
          <>Continuar para pagamento <ChevronRight size={16} /></>
        )}
      </motion.button>
    </div>,
  ];

  const stepLabels = ['Plano', 'Conta', 'Perfil', 'Objetivos', 'Ativar'];

  return (
    <div className="min-h-screen flex flex-col text-white" style={{
      background: '#06080f',
      backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, ${plan.color}10 0%, transparent 70%)`,
    }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4 max-w-2xl mx-auto w-full">
        <button onClick={() => step > 0 ? go(step - 1) : navigate('/pricing')}
          className="flex items-center gap-1.5 text-[13px] font-medium text-white/30 hover:text-white/70 transition-colors">
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 6, height: 6,
                background: i < step ? plan.color : i === step ? plan.color : 'rgba(255,255,255,0.12)',
              }} />
          ))}
        </div>
        <span className="text-[11px] font-bold text-white/25 uppercase tracking-widest">
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Step label */}
      <div className="text-center mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: `${plan.color}70` }}>
          {stepLabels[step]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button (steps 0–3) */}
      {step < 4 && (
        <div className="px-6 pb-10 max-w-sm mx-auto w-full">
          <motion.button
            whileHover={canNext() ? { scale: 1.02 } : {}}
            whileTap={canNext() ? { scale: 0.97 } : {}}
            onClick={() => canNext() && go(step + 1)}
            className="w-full py-4 rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 transition-all"
            style={{
              background: canNext() ? `linear-gradient(135deg, ${plan.color}, ${plan.color}bb)` : 'rgba(255,255,255,0.06)',
              color: canNext() ? (planId === 'private' ? '#fff' : '#000') : 'rgba(255,255,255,0.2)',
              boxShadow: canNext() ? `0 8px 28px ${plan.color}35` : 'none',
              cursor: canNext() ? 'pointer' : 'not-allowed',
            }}
          >
            Continuar <ArrowRight size={16} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
