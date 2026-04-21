import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fmtBRL = (v: number) => {
  const n = isNaN(v) ? 0 : v;
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
Não invente números. Use APENAS os dados do contexto financeiro fornecido. Se não houver dados suficientes para responder com precisão, diga isso e ofereça um raciocínio baseado em princípios gerais.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { message, context } = await req.json();
    const ctx = context ?? {};

    const topCats = Array.isArray(ctx.top_categories) && ctx.top_categories.length > 0
      ? ctx.top_categories.map((c: { category: string; total: number }) =>
          `  - ${c.category}: ${fmtBRL(c.total)}`
        ).join('\n')
      : '  (sem dados registrados)';

    const savingsRate = ctx.income > 0
      ? ((ctx.savings ?? 0) / ctx.income * 100).toFixed(1) + '%'
      : 'N/A';

    const expenseRate = ctx.income > 0
      ? ((ctx.expense ?? 0) / ctx.income * 100).toFixed(1) + '%'
      : 'N/A';

    const contextBlock = [
      `=== DADOS FINANCEIROS — ${ctx.month ?? 'mês atual'} ===`,
      `Entradas (receita):    ${fmtBRL(ctx.income ?? 0)}`,
      `Saídas (despesas):     ${fmtBRL(ctx.expense ?? 0)}  (${expenseRate} da receita)`,
      `Investimentos:         ${fmtBRL(ctx.savings ?? 0)}  (taxa de poupança: ${savingsRate})`,
      `Saldo líquido:         ${fmtBRL(ctx.balance ?? 0)}`,
      '',
      'Maiores categorias de gasto:',
      topCats,
    ].join('\n');

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
