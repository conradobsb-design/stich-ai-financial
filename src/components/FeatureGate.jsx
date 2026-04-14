import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';

const PLAN_LABELS = {
  essencial:    { name: 'Essencial', color: '#22d3ee', price: 'R$ 49/mês' },
  private:      { name: 'Private',   color: '#a78bfa', price: 'R$ 197/mês' },
  family_office:{ name: 'Family Office', color: '#f59e0b', price: 'R$ 497/mês' },
};

/**
 * FeatureGate — envolve conteúdo premium.
 *
 * Props:
 *   canAccess  {boolean}  — resultado de canAccess('feature') do useSubscription
 *   requiredPlan {string} — 'private' | 'family_office' | 'essencial'
 *   label      {string}   — nome amigável da feature para exibir no lock
 *   blur       {boolean}  — se true, exibe o conteúdo embaçado em vez de ocultá-lo
 *   children   {ReactNode}
 */
export default function FeatureGate({ canAccess, requiredPlan = 'private', label, blur = false, children }) {
  const navigate = useNavigate();
  const plan = PLAN_LABELS[requiredPlan] || PLAN_LABELS.private;

  if (canAccess) return <>{children}</>;

  if (blur) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.4 }}>
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95"
            style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}40` }}
            onClick={() => navigate('/pricing')}
          >
            <Lock size={13} style={{ color: plan.color }} />
            <span className="text-[11px] font-black" style={{ color: plan.color }}>
              {plan.name} · {plan.price}
            </span>
          </div>
          {label && <p className="text-[10px] text-white/30">{label}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95 select-none"
      style={{ background: `${plan.color}10`, border: `1px solid ${plan.color}30` }}
      onClick={() => navigate('/pricing')}
    >
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${plan.color}20` }}
      >
        <Lock size={13} style={{ color: plan.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black" style={{ color: plan.color }}>
          {label || 'Recurso Premium'}
        </p>
        <p className="text-[10px] text-white/30">Disponível no plano {plan.name} · {plan.price}</p>
      </div>
      <Zap size={12} style={{ color: plan.color }} className="shrink-0" />
    </div>
  );
}
