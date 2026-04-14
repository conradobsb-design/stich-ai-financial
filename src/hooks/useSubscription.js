import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Hierarquia de planos — índice maior = mais acesso
const PLAN_LEVELS = { free: 0, essencial: 1, private: 2, family_office: 3 };

// Qual plano mínimo cada feature exige
const FEATURE_REQUIREMENTS = {
  prophet:      'private',
  chat_ia:      'private',
  history_36:   'private',
  pluggy:       'private',
  soraya:       'family_office',
  multi_user:   'family_office',
  pdf_report:   'family_office',
};

export function useSubscription(userId) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    supabase
      .schema('stich_ai')
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        // Sem registro = acesso Private durante período de lançamento
        // Quando o usuário assinar, o registro será criado pelo webhook do Stripe
        setSubscription(data || { plan: 'private', status: 'active', _default: true });
        setLoading(false);
      });
  }, [userId]);

  const plan   = subscription?.plan   || 'free';
  const status = subscription?.status || 'active';
  const isTrial  = status === 'trialing';
  const isActive = ['active', 'trialing'].includes(status);

  const trialEndsAt = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null;

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / 86400000))
    : null;

  const canAccess = (feature) => {
    if (!isActive) return false;
    const required = FEATURE_REQUIREMENTS[feature];
    if (!required) return true; // sem requisito = liberado para todos
    return (PLAN_LEVELS[plan] ?? 0) >= (PLAN_LEVELS[required] ?? 99);
  };

  return { subscription, loading, plan, status, isTrial, isActive, trialDaysLeft, canAccess };
}
