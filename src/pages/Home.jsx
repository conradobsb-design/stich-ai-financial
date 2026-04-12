import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import {
  Upload, BarChart3, Share2, ShieldCheck, Zap, FileText,
  TrendingUp, Users, Clock, ChevronRight, CheckCircle2,
  ArrowRight, Star, Building2
} from 'lucide-react';

const BASE_URL = 'https://extratobancario.cortezgroup.com.br';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-24 px-6">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <motion.div
        className="max-w-5xl mx-auto text-center"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm font-medium mb-8">
          <Zap size={14} />
          Importação automática de extratos bancários
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
        >
          Visualize seu{' '}
          <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            fluxo financeiro
          </span>
          <br />sem planilhas.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Importe extratos OFX/CSV de qualquer banco, visualize transações categorizadas
          e compartilhe painéis limpos com sua equipe — em segundos.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-lg transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5"
          >
            Começar grátis
            <ArrowRight size={20} />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-lg transition-all duration-200"
          >
            Ver como funciona
          </a>
        </motion.div>

        {/* Mock dashboard preview */}
        <motion.div
          variants={fadeUp}
          className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs text-slate-500">extratobancario.cortezgroup.com.br/dashboard</span>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Entradas', value: 'R$ 48.320', color: 'text-emerald-400', icon: TrendingUp },
              { label: 'Saídas', value: 'R$ 31.850', color: 'text-red-400', icon: TrendingUp },
              { label: 'Saldo líquido', value: 'R$ 16.470', color: 'text-sky-400', icon: BarChart3 },
              { label: 'Transações', value: '247', color: 'text-indigo-400', icon: FileText },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-xl bg-slate-800/60 p-4">
                <Icon size={16} className={`${color} mb-2`} />
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-slate-800/60 p-4 h-32 flex items-end gap-1.5">
              {[40, 65, 45, 80, 55, 90, 70, 60, 85, 75, 95, 68].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-sky-600 to-sky-400 opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: '10+', label: 'Bancos suportados' },
    { value: '< 30s', label: 'Para importar um extrato' },
    { value: 'OFX & CSV', label: 'Formatos aceitos' },
    { value: '100%', label: 'Seguro e privado' },
  ];
  return (
    <section className="py-16 border-y border-slate-800/60 bg-slate-900/30">
      <motion.div
        className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
      >
        {stats.map(({ value, label }) => (
          <motion.div key={label} variants={fadeUp}>
            <p className="text-4xl font-black text-sky-400 mb-1">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ── Como Funciona ────────────────────────────────────────────────────────────
function ComoFunciona() {
  const steps = [
    {
      icon: Upload,
      title: 'Importe seu extrato',
      desc: 'Faça upload de arquivos OFX ou CSV gerados pelo seu banco. Itaú, Bradesco, Nubank, Sicoob e muito mais.',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      icon: BarChart3,
      title: 'Visualize tudo organizado',
      desc: 'Transações categorizadas automaticamente, gráficos de fluxo de caixa e filtros por período — sem configuração.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      icon: Share2,
      title: 'Compartilhe com sua equipe',
      desc: 'Convide colaboradores por e-mail. Cada um vê somente o que precisa, com controle total de acesso.',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <section id="como-funciona" className="py-24 px-6">
      <motion.div
        className="max-w-5xl mx-auto"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className="text-center mb-16">
          <p className="text-sky-400 font-semibold text-sm uppercase tracking-widest mb-3">Como funciona</p>
          <h2 className="text-4xl md:text-5xl font-black">Três passos. Nada mais.</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-slate-600 transition-colors duration-300"
            >
              <span className="absolute top-6 right-6 text-6xl font-black text-slate-800 select-none leading-none">
                {i + 1}
              </span>
              <div className={`inline-flex p-3 rounded-xl ${bg} mb-5`}>
                <Icon size={24} className={color} />
              </div>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: Zap, title: 'Processamento instantâneo', desc: 'Extratos são processados em segundos, independentemente do tamanho.' },
    { icon: ShieldCheck, title: 'Dados criptografados', desc: 'Toda informação financeira é armazenada com criptografia end-to-end.' },
    { icon: Building2, title: 'Multi-empresa', desc: 'Gerencie vários CNPJs e contas bancárias em um único painel.' },
    { icon: Users, title: 'Colaboração em equipe', desc: 'Permissões granulares por usuário para cada empresa ou conta.' },
    { icon: Clock, title: 'Histórico completo', desc: 'Acesse qualquer período importado, sem limite de tempo.' },
    { icon: FileText, title: 'Exportação flexível', desc: 'Exporte relatórios em PDF ou CSV com um clique.' },
  ];

  return (
    <section className="py-24 px-6 bg-slate-900/30">
      <motion.div
        className="max-w-5xl mx-auto"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
      >
        <motion.div variants={fadeUp} className="text-center mb-16">
          <p className="text-sky-400 font-semibold text-sm uppercase tracking-widest mb-3">Funcionalidades</p>
          <h2 className="text-4xl md:text-5xl font-black">Tudo que você precisa,<br />nada que você não precisa.</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="flex gap-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-600 transition-colors duration-300"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Icon size={20} className="text-sky-400" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ── Bancos ───────────────────────────────────────────────────────────────────
function Bancos() {
  const banks = [
    'Itaú', 'Bradesco', 'Santander', 'Nubank', 'Banco do Brasil',
    'Caixa', 'Sicoob', 'Sicredi', 'Inter', 'C6 Bank',
  ];
  return (
    <section className="py-20 px-6">
      <motion.div
        className="max-w-5xl mx-auto text-center"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.p variants={fadeUp} className="text-slate-500 text-sm uppercase tracking-widest font-medium mb-8">
          Compatível com os principais bancos brasileiros
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
          {banks.map((bank) => (
            <span
              key={bank}
              className="px-4 py-2 rounded-full border border-slate-800 bg-slate-900/40 text-slate-400 text-sm font-medium"
            >
              {bank}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24 px-6">
      <motion.div
        className="max-w-3xl mx-auto text-center"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
      >
        <motion.div
          variants={fadeUp}
          className="rounded-3xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 to-transparent p-12"
        >
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-sky-500/10 blur-[100px]" />
          </div>
          <CheckCircle2 size={40} className="text-sky-400 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Pronto para organizar<br />suas finanças?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Crie sua conta gratuita e importe seu primeiro extrato agora.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-lg transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5"
          >
            Criar conta grátis
            <ChevronRight size={20} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-800 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-black text-xl">Extrato Co.</p>
          <p className="text-slate-500 text-sm mt-1">Painel financeiro corporativo.</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link to="/termos-de-uso" className="hover:text-slate-300 transition-colors">Termos de Uso</Link>
          <Link to="/politica-de-privacidade" className="hover:text-slate-300 transition-colors">Privacidade</Link>
          <Link to="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
          <Link to="/login" className="hover:text-slate-300 transition-colors">Entrar</Link>
        </div>
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} Extrato Co.</p>
      </div>
    </footer>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60' : ''}`}>
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-black text-xl">Extrato Co.</Link>
        <div className="flex items-center gap-3">
          <a href="#como-funciona" className="text-slate-400 hover:text-white text-sm font-medium transition-colors hidden sm:block">
            Como funciona
          </a>
          <ThemeToggle />
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all duration-200"
          >
            Entrar
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  useSEO({
    title: 'Extrato Co. — Painel Financeiro Corporativo',
    description: 'Importe extratos bancários e visualize tudo em um painel limpo, compartilhável e seguro. Sem planilhas.',
    canonical: BASE_URL,
  });

  return (
    <div className="bg-background text-on-surface min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <ComoFunciona />
      <Features />
      <Bancos />
      <CTA />
      <Footer />
    </div>
  );
}
