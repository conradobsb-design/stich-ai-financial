import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

export default function InvitePage({ user }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | valid | accepting | success | already_linked | error
  const [invite, setInvite] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Token de convite não encontrado.');
      return;
    }

    const checkInvite = async () => {
      const { data, error } = await supabase
        .from('account_invites')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setStatus('error');
        setErrorMsg('Convite inválido ou já utilizado.');
        return;
      }

      // Check if user already has a link
      const { data: existingLink } = await supabase
        .from('account_links')
        .select('linked_to_user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLink) {
        setStatus('already_linked');
        return;
      }

      setInvite(data);
      setStatus('valid');
    };

    checkInvite();
  }, [token, user]);

  const handleAccept = async () => {
    setStatus('accepting');
    try {
      const { error: linkError } = await supabase
        .from('account_links')
        .insert({ user_id: user.id, linked_to_user_id: invite.inviter_user_id });

      if (linkError) throw linkError;

      await supabase
        .from('account_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token);

      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-10 rounded-[2.5rem] text-center"
      >
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/30">
          <ShieldCheck className="text-secondary" size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Extrato Co.</h1>

        {status === 'loading' && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <Loader className="animate-spin text-primary" size={32} />
            <p className="text-on-surface-variant">Verificando convite...</p>
          </div>
        )}

        {status === 'valid' && (
          <div className="mt-6">
            <p className="text-on-surface-variant mb-2">Você foi convidado para compartilhar uma conta.</p>
            <p className="text-xs text-white/50 mb-8">
              Convite enviado para <span className="text-white font-bold">{invite?.invitee_email}</span>
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              className="w-full bg-gradient-to-r from-primary to-tertiary p-4 rounded-2xl text-white font-bold shadow-lg shadow-primary/20"
            >
              Aceitar Convite e Compartilhar Conta
            </motion.button>
          </div>
        )}

        {status === 'accepting' && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <Loader className="animate-spin text-primary" size={32} />
            <p className="text-on-surface-variant">Vinculando conta...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <CheckCircle className="text-success" size={48} />
            <p className="text-success font-bold text-lg">Conta vinculada com sucesso!</p>
            <p className="text-on-surface-variant text-sm">Redirecionando para o dashboard...</p>
          </div>
        )}

        {status === 'already_linked' && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <CheckCircle className="text-primary" size={48} />
            <p className="text-white font-bold">Você já está vinculado a uma conta compartilhada.</p>
            <button onClick={() => navigate('/dashboard')} className="text-primary underline text-sm mt-2">
              Ir para o Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <AlertTriangle className="text-error" size={48} />
            <p className="text-error font-bold">{errorMsg}</p>
            <button onClick={() => navigate('/login')} className="text-primary underline text-sm mt-2">
              Ir para o Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
