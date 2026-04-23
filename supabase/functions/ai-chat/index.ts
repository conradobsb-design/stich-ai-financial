import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fmt = (v: number) => {
  const n = isNaN(v) ? 0 : v;
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const pctStr = (v: number | null | undefined) => {
  if (v == null) return 'N/A';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
};

const SYSTEM_PROMPT = `Você é Clara, consultora financeira pessoal da plataforma Extrato Co., criada pela Cortez Group.

## Identidade e tom
Você fala como uma CFO amiga — direta, confiante e acolhedora. Usa linguagem simples e acessível, sem jargão desnecessário. Celebra conquistas do usuário (metas atingidas, economia superada, saldo positivo) e é honesta quando os números preocupam, mas sempre construtiva e sem alarmismo. Nunca fria ou robótica.

## Formato das respostas
- Responda sempre em português brasileiro
- Seja direta e objetiva — máximo 3 parágrafos por resposta
- Use **negrito** para destacar números e insights principais
- Quando houver dados suficientes, termine com uma sugestão prática e acionável
- Não use listas longas — prefira texto fluido e natural

## Expertise
Você domina os seguintes temas e os aborda com confiança:
- Análise de padrões de gastos, tendências mensais e sazonalidade
- Orçamento pessoal e familiar (método 50/30/20, orçamento base zero, envelope)
- Produtos de renda fixa brasileiros: Tesouro Direto, CDB, LCI/LCA, poupança, fundos DI
- Construção de reserva de emergência e fundo de metas
- Planejamento de aposentadoria e previdência (PGBL/VGBL)
- Noções básicas de IR pessoa física, come-cotas e declaração de investimentos
- Hábitos e psicologia financeira (gastos por impulso, vieses cognitivos)

## Limites éticos
Você NÃO recomenda ações, FIIs, criptomoedas ou ativos de risco específicos. Não faz promessas de rentabilidade. Quando a pergunta exige consultoria regulada (CVM, CFP), você informa isso com clareza e gentileza, mas ainda oferece orientação geral útil.

## Regra fundamental
Não invente números. Use APENAS os dados do contexto financeiro fornecido.

## Quando o mês atual tem dados zerados
Se receita e despesa do mês atual forem zero, NÃO diga que está "de mãos atadas" nem peça mais dados. Em vez disso:
- Mencione em uma frase curta que o mês corrente ainda não tem transações registradas
- Analise imediatamente o trimestre, o ano e o mês anterior disponíveis no contexto
- Identifique tendências e dê uma orientação prática baseada no histórico — a análise deve ser útil e completa`;

// deno-lint-ignore no-explicit-any
const buildContextBlock = (ctx: any): string => {
  const lines: string[] = [];

  // ── Mês atual ──────────────────────────────────────────────────────────────
  const savingsRate = ctx.income > 0 ? (ctx.savings / ctx.income * 100).toFixed(1) + '%' : 'N/A';
  const expenseRate = ctx.income > 0 ? (ctx.expense / ctx.income * 100).toFixed(1) + '%' : 'N/A';

  const currentMonthEmpty = (ctx.income ?? 0) === 0 && (ctx.expense ?? 0) === 0 && (ctx.savings ?? 0) === 0;

  lines.push(`=== MÊS ATUAL (${ctx.month ?? 'não informado'}) ===`);
  if (currentMonthEmpty) {
    lines.push(`⚠️  Nenhuma transação registrada para este mês ainda.`);
  } else {
    lines.push(`Receita:           ${fmt(ctx.income ?? 0)}`);
    lines.push(`Despesas:          ${fmt(ctx.expense ?? 0)}  (${expenseRate} da receita)`);
    lines.push(`Investimentos:     ${fmt(ctx.savings ?? 0)}  (taxa de poupança: ${savingsRate})`);
    lines.push(`Saldo líquido:     ${fmt(ctx.balance ?? 0)}`);
  }

  if (Array.isArray(ctx.top_categories) && ctx.top_categories.length > 0) {
    lines.push('');
    lines.push('Maiores categorias de gasto:');
    ctx.top_categories.forEach((c: { category: string; total: number }) => {
      const pctOfExpense = ctx.expense > 0 ? ` (${(c.total / ctx.expense * 100).toFixed(1)}% das despesas)` : '';
      lines.push(`  - ${c.category}: ${fmt(c.total)}${pctOfExpense}`);
    });
  }

  // ── Comparativo mês anterior ───────────────────────────────────────────────
  if (ctx.vs_last_month) {
    const v = ctx.vs_last_month;
    lines.push('');
    lines.push(`=== COMPARATIVO — vs ${v.prev_label ?? 'mês anterior'} ===`);
    lines.push(`Receita:   ${fmt(v.prev_income ?? 0)}  →  ${pctStr(v.income_chg_pct)} em relação ao mês atual`);
    lines.push(`Despesas:  ${fmt(v.prev_expense ?? 0)}  →  ${pctStr(v.expense_chg_pct)} em relação ao mês atual`);
    lines.push(`Saldo:     ${fmt(v.prev_balance ?? 0)}  →  ${pctStr(v.balance_chg_pct)} em relação ao mês atual`);
  }

  // ── Trimestre ──────────────────────────────────────────────────────────────
  if (ctx.quarter) {
    const q = ctx.quarter;
    lines.push('');
    lines.push(`=== TRIMESTRE (${q.label ?? 'atual'}) ===`);
    lines.push(`Receita:       ${fmt(q.income ?? 0)}  (${pctStr(q.income_chg_pct)} vs trimestre anterior)`);
    lines.push(`Despesas:      ${fmt(q.expense ?? 0)}  (${pctStr(q.expense_chg_pct)} vs trimestre anterior)`);
    lines.push(`Saldo acum.:   ${fmt(q.balance ?? 0)}`);
    lines.push(`Investido:     ${fmt(q.savings ?? 0)}`);
  }

  // ── Ano ────────────────────────────────────────────────────────────────────
  if (ctx.year) {
    const y = ctx.year;
    lines.push('');
    lines.push(`=== ANO (${y.label ?? 'atual'}) ===`);
    lines.push(`Receita:       ${fmt(y.income ?? 0)}  (${pctStr(y.income_chg_pct)} vs ano anterior)`);
    lines.push(`Despesas:      ${fmt(y.expense ?? 0)}  (${pctStr(y.expense_chg_pct)} vs ano anterior)`);
    lines.push(`Saldo acum.:   ${fmt(y.balance ?? 0)}`);
    lines.push(`Investido:     ${fmt(y.savings ?? 0)}`);
  }

  // ── Metas / Missões ────────────────────────────────────────────────────────
  if (Array.isArray(ctx.goals) && ctx.goals.length > 0) {
    lines.push('');
    lines.push('=== METAS E MISSÕES ===');
    ctx.goals.forEach((g: { title: string; target: number; current: number; status: string; deadline?: string }) => {
      const progress = g.target > 0 ? ` — ${(g.current / g.target * 100).toFixed(0)}% concluído` : '';
      const deadline = g.deadline ? ` | prazo: ${g.deadline}` : '';
      lines.push(`  [${g.status}] ${g.title}: ${fmt(g.current ?? 0)} / ${fmt(g.target ?? 0)}${progress}${deadline}`);
    });
  }

  // ── Streak ─────────────────────────────────────────────────────────────────
  if (ctx.streak_days != null && ctx.streak_days > 0) {
    lines.push('');
    lines.push(`=== ENGAJAMENTO ===`);
    lines.push(`Sequência de uso: ${ctx.streak_days} dias consecutivos`);
  }

  return lines.join('\n');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { message, context } = await req.json();
    const ctx = context ?? {};
    const contextBlock = buildContextBlock(ctx);

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
        messages: [{ role: 'user', content: message ?? '' }],
      }),
    });

    const data = await claudeRes.json();
    const reply =
      data?.content?.[0]?.text ??
      data?.error?.message ??
      'Não consegui processar sua pergunta no momento. Tente novamente.';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (_err) {
    return new Response(
      JSON.stringify({ reply: 'Tive um problema técnico agora. Tente novamente em instantes.' }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
