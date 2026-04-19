import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  ArrowLeft, ArrowRight, Check, Zap, Shield, Star,
  TrendingUp, MinusCircle, PiggyBank, Users, Clock,
  BarChart2, Eye, EyeOff, ChevronRight, Sparkles,
  Lock, ShieldCheck, Bot, Plug, FileText,
} from 'lucide-react';

// ── Dados dos planos ──────────────────────────────────────────────────────────

const PLAN_META = {
  essencial: {
    name: 'Essencial', color: '#22d3ee', icon: Shield,
    price: 'R$ 49/mês', tagline: 'Organize. Categorize. Evolua.',
    trial: false,
    highlights: [
      { icon: Check,      text: 'Importação ilimitada de PDFs' },
      { icon: BarChart2,  text: 'Dashboard com gráficos e indicadores' },
      { icon: ShieldCheck,text: 'Health Score — 7 dimensões financeiras' },
      { icon: Check,      text: 'Histórico completo sem limite de meses' },
    ],
  },
  private: {
    name: 'Private', color: '#a78bfa', icon: Zap,
    price: 'R$ 197/mês', tagline: 'Inteligência preditiva real.',
    trial: true, trialDays: 14,
    highlights: [
      { icon: TrendingUp, text: 'Prophet (Meta AI) — 5 modelos preditivos' },
      { icon: Bot,        text: 'Chat IA — assistente financeiro pessoal' },
      { icon: Plug,       text: 'Integração bancária automática (Pluggy)' },
      { icon: Check,      text: 'Monte Carlo · HHI · Reserva de emergência' },
    ],
  },
  family_office: {
    name: 'Family Office', color: '#f59e0b', icon: Star,
    price: 'R$ 497/mês', tagline: 'Gestão patrimonial familiar.',
    trial: false,
    highlights: [
      { icon: Users,      text: 'Multi-usuário — até 6 membros' },
      { icon: FileText,   text: 'Relatório PDF executivo mensal' },
      { icon: Sparkles,   text: 'Soraya IA — consultora financeira pessoal' },
      { icon: Clock,      text: 'SLA de suporte prioritário — 4 horas' },
    ],
  },
};

const INCOME_RANGES = [
  { id: 'ate_5k',    label: 'Até R$ 5.000',          sub: 'por mês' },
  { id: '5k_15k',   label: 'R$ 5.000 – R$ 15.000',  sub: 'por mês' },
  { id: '15k_50k',  label: 'R$ 15.000 – R$ 50.000', sub: 'por mês' },
  { id: 'acima_50k',label: 'Acima de R$ 50.000',     sub: 'por mês' },
];

const BANKS = [
  'Itaú','Bradesco','Nubank','Santander','Banco do Brasil',
  'Caixa','Inter','BTG Pactual','XP','C6 Bank','Sicredi','Sicoob','Safra','Outro',
];

const GOALS = [
  { id: 'organizar',    icon: BarChart2,   label: 'Organizar finanças',       sub: 'Visão clara de entradas e saídas' },
  { id: 'dividas',      icon: MinusCircle, label: 'Reduzir dívidas',          sub: 'Controlar e eliminar compromissos' },
  { id: 'reserva',      icon: PiggyBank,   label: 'Reserva de emergência',    sub: 'Colchão financeiro de 6 meses' },
  { id: 'investir',     icon: TrendingUp,  label: 'Investir mais',            sub: 'Aumentar aplicações mensais' },
  { id: 'familia',      icon: Users,       label: 'Controle familiar',        sub: 'Gestão do patrimônio da família' },
  { id: 'aposentadoria',icon: Clock,       label: 'Aposentadoria',            sub: 'Planejar independência financeira' },
];

const STRIPE_LINKS = {
  essencial:    import.meta.env.VITE_STRIPE_LINK_ESSENCIAL_MONTHLY || '#',
  family_office:import.meta.env.VITE_STRIPE_LINK_FAMILY_MONTHLY   || '#',
};

const STEP_LABELS = ['Plano', 'Conta', 'Perfil', 'Objetivos', 'Ativar'];

const slideVariants = {
  enter:  (d) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit:   (d) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
};

// ── Painel esquerdo ───────────────────────────────────────────────────────────

function LeftPanel({ plan, step }) {
  const PlanIcon = plan.icon;
  return (
    <div className="hidden lg:flex flex-col justify-between h-full px-10 py-10"
      style={{
        background: `linear-gradient(160deg, ${plan.color}10 0%, rgba(6,8,15,0.98) 55%)`,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg"
          style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}80)` }}>
          E
        </div>
        <span className="font-black text-white text-lg tracking-tight">Extrato Co.</span>
      </div>

      {/* Plano em destaque */}
      <div className="flex flex-col gap-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Plano selecionado */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${plan.color}15`, border: `1.5px solid ${plan.color}30` }}>
                <PlanIcon size={22} style={{ color: plan.color }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: `${plan.color}80` }}>Plano selecionado</p>
                <p className="text-xl font-black text-white leading-none">{plan.name}</p>
              </div>
            </div>

            {/* Preço */}
            <div className="mb-8 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-3xl font-black text-white">{plan.price}</p>
              {plan.trial && (
                <p className="text-[11px] font-bold mt-1" style={{ color: plan.color }}>
                  {plan.trialDays} dias grátis · sem cartão de crédito
                </p>
              )}
              <p className="text-[10px] text-white/25 mt-1">Cancele a qualquer momento</p>
            </div>

            {/* Features do plano */}
            <div className="space-y-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-4">O que está incluído</p>
              {plan.highlights.map((h, i) => {
                const HIcon = h.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${plan.color}15` }}>
                      <HIcon size={12} style={{ color: plan.color }} />
                    </div>
                    <span className="text-[13px] text-white/65">{h.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Trust badges */}
        <div className="space-y-2.5">
          {[
            { icon: Lock,       text: 'Dados criptografados com SSL/TLS' },
            { icon: ShieldCheck,text: 'Plataforma em conformidade com a LGPD' },
            { icon: Check,      text: 'Pagamento seguro via Stripe' },
          ].map((t, i) => {
            const TIcon = t.icon;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <TIcon size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <span className="text-[11px] text-white/30">{t.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rodapé legal */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-white/20">Cortez Group · CNPJ 60.994.700/0001-70</p>
        <p className="text-[10px] text-white/15">atendimento@cortezgroup.com.br</p>
        <div className="flex gap-3 mt-2">
          <Link to="/termos-de-uso" className="text-[10px] text-white/20 hover:text-white/50 transition-colors underline">Termos de Uso</Link>
          <Link to="/politica-de-privacidade" className="text-[10px] text-white/20 hover:text-white/50 transition-colors underline">Privacidade</Link>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'private';
  const plan = PLAN_META[planId] || PLAN_META.private;
  const PlanIcon = plan.icon;

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', incomeRange: '', banks: [], goals: [] });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const go = (next) => { setDir(next > step ? 1 : -1); setError(''); setStep(next); };
  const toggleArr = (field, val) => setForm(f => ({
    ...f, [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
  }));

  const canNext = () => {
    if (step === 1) return form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6;
    if (step === 2) return !!form.incomeRange;
    if (step === 3) return form.goals.length > 0;
    return true;
  };

  const activate = async () => {
    setLoading(true); setError('');
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.name } },
      });
      if (err) throw err;
      const userId = data.user?.id;
      if (!userId) throw new Error('Não foi possível criar o usuário. Tente novamente.');

      await supabase.schema('stich_ai').from('profiles').upsert({
        user_id: userId, full_name: form.name,
        income_range: form.incomeRange, banks: form.banks, goals: form.goals,
      });

      if (plan.trial) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        await supabase.schema('stich_ai').from('subscriptions').insert({
          user_id: userId, plan: planId, status: 'trialing',
          billing: 'monthly', trial_ends_at: trialEnd.toISOString(),
        });
        navigate('/dashboard');
      } else {
        const base = STRIPE_LINKS[planId];
        const ref = encodeURIComponent(`${userId}__${planId}`);
        window.location.href = base && base !== '#'
          ? `${base}?prefilled_email=${encodeURIComponent(form.email)}&client_reference_id=${ref}`
          : '/dashboard';
      }
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── Steps ────────────────────────────────────────────────────────────────────
  const steps = [

    // 0 — Plano
    <div key="plano" className="flex flex-col gap-7">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">Você escolheu o melhor plano.</h2>
        <p className="text-white/40 text-sm">Confirme abaixo e siga para criar sua conta.</p>
      </div>
      <div className="p-6 rounded-3xl flex flex-col gap-5"
        style={{ background: `${plan.color}08`, border: `1.5px solid ${plan.color}25` }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}>
            <PlanIcon size={28} style={{ color: plan.color }} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{plan.name}</p>
            <p className="text-sm" style={{ color: plan.color }}>{plan.price}</p>
          </div>
        </div>
        {plan.trial && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: `${plan.color}10`, border: `1px solid ${plan.color}25` }}>
            <Sparkles size={14} style={{ color: plan.color }} />
            <span className="text-sm font-bold" style={{ color: plan.color }}>
              {plan.trialDays} dias grátis · sem cartão de crédito
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 gap-2.5">
          {plan.highlights.map((h, i) => {
            const HIcon = h.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${plan.color}15` }}>
                  <HIcon size={10} style={{ color: plan.color }} />
                </div>
                <span className="text-[13px] text-white/60">{h.text}</span>
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={() => navigate('/pricing')}
        className="text-[12px] text-white/20 hover:text-white/50 transition-colors text-center">
        ← Trocar plano
      </button>
    </div>,

    // 1 — Conta
    <div key="conta" className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">Crie sua conta</h2>
        <p className="text-white/40 text-sm">Você terá acesso imediato após o cadastro.</p>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Nome completo', type: 'text', key: 'name', placeholder: 'Seu nome' },
          { label: 'E-mail',        type: 'email',key: 'email',placeholder: 'seu@email.com' },
        ].map(({ label, type, key, placeholder }) => (
          <div key={key}>
            <label className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-1.5 block">{label}</label>
            <input type={type} placeholder={placeholder} autoComplete={type}
              value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-2xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
              onFocus={e => e.target.style.borderColor = `${plan.color}70`}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          </div>
        ))}
        <div>
          <label className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-1.5 block">Senha</label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-2xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all pr-12"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
              onFocus={e => e.target.style.borderColor = `${plan.color}70`}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-white/20 text-center">
        Já tem conta?{' '}
        <Link to="/login" className="underline hover:text-white/50 transition-colors">Entrar</Link>
      </p>
    </div>,

    // 2 — Perfil financeiro
    <div key="perfil" className="flex flex-col gap-7">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">Seu perfil financeiro</h2>
        <p className="text-white/40 text-sm">Personalizamos a experiência com base nestas respostas.</p>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-3">Faixa de renda mensal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {INCOME_RANGES.map(r => (
            <button key={r.id} onClick={() => setForm(f => ({ ...f, incomeRange: r.id }))}
              className="p-4 rounded-2xl text-left transition-all"
              style={{
                background: form.incomeRange === r.id ? `${plan.color}12` : 'rgba(255,255,255,0.03)',
                border: form.incomeRange === r.id ? `1.5px solid ${plan.color}45` : '1px solid rgba(255,255,255,0.07)',
              }}>
              <p className="text-[13px] font-black text-white">{r.label}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{r.sub}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-3">Bancos que utiliza <span className="normal-case text-white/15 font-normal">(opcional)</span></p>
        <div className="flex flex-wrap gap-2">
          {BANKS.map(b => (
            <button key={b} onClick={() => toggleArr('banks', b)}
              className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all"
              style={{
                background: form.banks.includes(b) ? `${plan.color}12` : 'rgba(255,255,255,0.04)',
                border: form.banks.includes(b) ? `1px solid ${plan.color}40` : '1px solid rgba(255,255,255,0.07)',
                color: form.banks.includes(b) ? plan.color : 'rgba(255,255,255,0.45)',
              }}>
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 3 — Objetivos
    <div key="objetivos" className="flex flex-col gap-7">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">Seus objetivos</h2>
        <p className="text-white/40 text-sm">Selecione quantos quiser — o assistente IA vai usar isso para personalizar sua análise.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {GOALS.map(g => {
          const GIcon = g.icon;
          const active = form.goals.includes(g.id);
          return (
            <button key={g.id} onClick={() => toggleArr('goals', g.id)}
              className="p-4 rounded-2xl text-left transition-all flex items-start gap-3"
              style={{
                background: active ? `${plan.color}10` : 'rgba(255,255,255,0.03)',
                border: active ? `1.5px solid ${plan.color}40` : '1px solid rgba(255,255,255,0.07)',
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: active ? `${plan.color}18` : 'rgba(255,255,255,0.06)' }}>
                <GIcon size={15} style={{ color: active ? plan.color : 'rgba(255,255,255,0.3)' }} />
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

    // 4 — Ativar
    <div key="ativar" className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">Tudo pronto.</h2>
        <p className="text-white/40 text-sm">
          {plan.trial ? `Seu trial de ${plan.trialDays} dias começa agora. Sem cartão de crédito.`
            : 'Você será redirecionado para o pagamento seguro via Stripe.'}
        </p>
      </div>
      <div className="p-5 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          ['Plano', plan.name],
          ['Nome', form.name],
          ['E-mail', form.email],
          ['Renda', INCOME_RANGES.find(r => r.id === form.incomeRange)?.label || '—'],
          ['Bancos', form.banks.length > 0 ? form.banks.slice(0, 3).join(', ') + (form.banks.length > 3 ? '…' : '') : '—'],
          ['Objetivos', form.goals.length > 0 ? `${form.goals.length} selecionado${form.goals.length > 1 ? 's' : ''}` : '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-white/30">{k}</span>
            <span className="font-bold text-white truncate max-w-[60%] text-right">{v}</span>
          </div>
        ))}
      </div>
      {error && <p className="text-red-400 text-[12px] font-medium px-1">{error}</p>}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={activate} disabled={loading}
        className="w-full py-4 rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 transition-all"
        style={{
          background: loading ? 'rgba(255,255,255,0.06)'
            : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
          color: loading ? 'rgba(255,255,255,0.3)'
            : planId === 'private' ? '#fff' : '#000',
          boxShadow: loading ? 'none' : `0 8px 32px ${plan.color}35`,
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
      <p className="text-center text-[10px] text-white/20 leading-relaxed px-4">
        Ao criar sua conta, você concorda com os{' '}
        <Link to="/termos-de-uso" className="underline hover:text-white/50 transition-colors" target="_blank">Termos de Uso</Link>
        {' '}e a{' '}
        <Link to="/politica-de-privacidade" className="underline hover:text-white/50 transition-colors" target="_blank">Política de Privacidade</Link>
        {' '}da Cortez Group.
      </p>
    </div>,
  ];

  return (
    <div className="min-h-screen flex text-white" style={{ background: '#06080f' }}>

      {/* ── Painel esquerdo (desktop) ── */}
      <div className="lg:w-[400px] lg:min-h-screen shrink-0">
        <LeftPanel plan={plan} step={step} />
      </div>

      {/* ── Painel direito ── */}
      <div className="flex-1 flex flex-col min-h-screen"
        style={{ backgroundImage: `radial-gradient(ellipse 60% 40% at 80% 20%, ${plan.color}06 0%, transparent 70%)` }}>

        {/* Topo mobile: logo + plano */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}80)` }}>E</div>
            <span className="font-black text-white text-sm">Extrato Co.</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black"
            style={{ background: `${plan.color}12`, color: plan.color, border: `1px solid ${plan.color}25` }}>
            <PlanIcon size={10} /> {plan.name}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => step > 0 ? go(step - 1) : navigate('/pricing')}
              className="flex items-center gap-1.5 text-[12px] font-medium text-white/25 hover:text-white/60 transition-colors">
              <ArrowLeft size={13} /> Voltar
            </button>
            <div className="flex items-center gap-1.5">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <div className="rounded-full transition-all duration-300 flex items-center justify-center"
                      style={{
                        width: i === step ? 7 : 6, height: i === step ? 7 : 6,
                        background: i < step ? plan.color : i === step ? plan.color : 'rgba(255,255,255,0.15)',
                        boxShadow: i === step ? `0 0 8px ${plan.color}80` : 'none',
                      }} />
                  </div>
                  {i < 4 && <div className="w-5 h-[1px]" style={{ background: i < step ? `${plan.color}60` : 'rgba(255,255,255,0.08)' }} />}
                </div>
              ))}
            </div>
            <span className="text-[11px] font-bold text-white/20">{STEP_LABELS[step]}</span>
          </div>

          {/* Barra linear */}
          <div className="h-[2px] rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full"
              animate={{ width: `${((step + 1) / 5) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: `linear-gradient(90deg, ${plan.color}80, ${plan.color})` }}
            />
          </div>
        </div>

        {/* Conteúdo do step */}
        <div className="flex-1 px-4 sm:px-8 py-4 overflow-y-auto max-h-[calc(100dvh-280px)]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              {steps[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Botão continuar (steps 0–3) */}
        {step < 4 && (
          <div className="px-4 sm:px-8 py-4 sm:py-6">
            <motion.button
              whileHover={canNext() ? { scale: 1.02 } : {}}
              whileTap={canNext() ? { scale: 0.97 } : {}}
              onClick={() => canNext() && go(step + 1)}
              className="w-full py-4 rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 transition-all"
              style={{
                background: canNext()
                  ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`
                  : 'rgba(255,255,255,0.05)',
                color: canNext() ? (planId === 'private' ? '#fff' : '#000') : 'rgba(255,255,255,0.2)',
                boxShadow: canNext() ? `0 8px 28px ${plan.color}30` : 'none',
                cursor: canNext() ? 'pointer' : 'not-allowed',
              }}>
              Continuar <ArrowRight size={16} />
            </motion.button>
          </div>
        )}

        {/* Rodapé legal */}
        <div className="px-4 sm:px-8 pb-6 text-center space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] text-white/15 pt-4">Cortez Group · CNPJ 60.994.700/0001-70 · atendimento@cortezgroup.com.br</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/termos-de-uso" target="_blank" className="text-[10px] text-white/15 hover:text-white/40 transition-colors underline">Termos de Uso</Link>
            <Link to="/politica-de-privacidade" target="_blank" className="text-[10px] text-white/15 hover:text-white/40 transition-colors underline">Política de Privacidade</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
