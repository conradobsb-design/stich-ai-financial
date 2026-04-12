import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useSEO } from '../hooks/useSEO';
import { ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  useSEO({ title: 'Redefinir Senha', description: '', noindex: true });
  const navigate = useNavigate();
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [status, setStatus]         = useState(null); // 'success' | 'error' | null
  const [message, setMessage]       = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase envia o access_token no hash da URL (#access_token=xxx&type=recovery)
  // O SDK detecta automaticamente e estabelece uma sessão temporária
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
      }
    });
  }, []);

  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8)              s++;
    if (/[A-Z]/.test(password))            s++;
    if (/[0-9]/.test(password))            s++;
    if (/[^A-Za-z0-9]/.test(password))     s++;
    return s;
  })();

  const strengthLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#0ea5e9', '#10b981'][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('error');
      setMessage('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setMessage('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setStatus('error');
      setMessage(error.message || 'Erro ao redefinir senha. Tente novamente.');
    } else {
      setStatus('success');
      setMessage('Senha redefinida com sucesso!');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 mb-4 shadow-lg shadow-primary/10">
            <ShieldCheck className="text-secondary" size={22} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white">Extrato Co.</h1>
          <p className="text-on-surface-variant text-sm mt-1">Redefinição de senha</p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-white/8">

          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-success" />
              </div>
              <h2 className="text-white font-black text-xl mb-2">Senha redefinida!</h2>
              <p className="text-on-surface-variant text-sm">Redirecionando para o painel…</p>
            </div>
          ) : (
            <>
              <h2 className="text-white font-black text-xl mb-1 tracking-tight">Nova senha</h2>
              <p className="text-on-surface-variant text-sm mb-6">
                {sessionReady
                  ? 'Escolha uma senha forte para sua conta.'
                  : 'Aguardando verificação do link…'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Nova senha */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Nova senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      disabled={!sessionReady || loading}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all pr-11 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Barra de força */}
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4].map(i => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ backgroundColor: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)' }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Confirmar senha
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    disabled={!sessionReady || loading}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
                  />
                  {confirm.length > 0 && password !== confirm && (
                    <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> As senhas não coincidem
                    </p>
                  )}
                </div>

                {/* Erro geral */}
                {status === 'error' && (
                  <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="text-error shrink-0" />
                    <p className="text-error text-sm">{message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!sessionReady || loading || password !== confirm || password.length < 8}
                  className="w-full bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Redefinindo…</>
                    : 'Redefinir senha'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Cortez Group · CNPJ 60.994.700/0001-70
        </p>
      </div>
    </div>
  );
}
