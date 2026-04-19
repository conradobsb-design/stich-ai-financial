import React, { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  useSEO({
    title: 'Entrar',
    description: 'Acesse seu painel financeiro corporativo Extrato Co.',
    noindex: true,
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!email) {
      setMessage({ text: 'Digite seu e-mail acima para receber o link de redefinição.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage({ text: `Link enviado! Verifique a caixa de entrada de ${email}.`, type: 'success' });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: `Quase lá! \nEnviamos um link de confirmação para: ${email}. Verifique sua caixa de entrada.`, type: 'success' });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/dashboard';
        navigate(redirect);
      }
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesh-bg relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-10 w-48 h-48 sm:w-80 sm:h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-10 w-48 h-48 sm:w-80 sm:h-80 bg-tertiary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <motion.div 
        className="glass-card w-full max-w-md p-6 sm:p-10 rounded-[2.5rem] relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <ShieldCheck className="text-secondary" size={32} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-extrabold tracking-tighter text-white mb-2 font-['Inter'] text-glow"
          >
            Extrato Co.
          </motion.h1>
          <p className="text-on-surface-variant text-sm font-medium">
            {isSignUp ? 'Crie sua conta corporativa' : 'Painel Financeiro de Gestão Premium'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {message.text && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`p-4 rounded-xl mb-6 text-sm text-center font-medium border ${
                message.type === 'error' 
                ? 'bg-error/10 text-error border-error/20' 
                : 'bg-success/10 text-success border-success/20'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors" size={18} />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background/50 border border-outline-variant py-4 pl-12 pr-4 rounded-2xl text-white outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors" size={18} />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-background/50 border border-outline-variant py-4 pl-12 pr-4 rounded-2xl text-white outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-tertiary p-4 rounded-2xl text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all mt-4"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
                <span>{isSignUp ? 'Cadastrar Agora' : 'Acesse sua Conta'}</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="text-center mt-6 space-y-3">
          {!isSignUp && (
            <div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="text-on-surface-variant hover:text-secondary text-sm font-medium transition-colors underline decoration-secondary/30 underline-offset-4 disabled:opacity-50"
              >
                Esqueceu sua senha? Crie uma nova
              </button>
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setMessage({ text: '', type: '' }); }}
              className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors underline decoration-primary/30 underline-offset-4"
            >
              {isSignUp ? 'Já possui acesso? Entre aqui' : 'Novo por aqui? Crie sua conta'}
            </button>
          </div>
        </div>

        {/* Links legais */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-on-surface-variant/50">
          <Link to="/termos" className="hover:text-secondary transition-colors underline underline-offset-4 decoration-secondary/30">
            Termos de Uso
          </Link>
          <span>·</span>
          <Link to="/privacidade" className="hover:text-secondary transition-colors underline underline-offset-4 decoration-secondary/30">
            Política de Privacidade
          </Link>
          <span>·</span>
          <Link to="/faq" className="hover:text-secondary transition-colors underline underline-offset-4 decoration-secondary/30">
            FAQ
          </Link>
        </div>

        {/* Rodapé empresa */}
        <div className="text-center mt-4">
          <p className="text-on-surface-variant/30 text-[10px]">
            Cortez Group · CNPJ 60.994.700/0001-70
          </p>
        </div>
      </motion.div>
    </div>
  );
}
