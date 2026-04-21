import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fmtBRL = (v: number) => {
  const n = isNaN(v) ? 0 : v;
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { message, context } = await req.json();
    const ctx = context ?? {};

    const topCats = Array.isArray(ctx.top_categories)
      ? ctx.top_categories.map((c: { category: string; total: number }) =>
          `  - ${c.category}: ${fmtBRL(c.total)}`
        ).join('\n')
      : '  (sem dados)';

    const systemPrompt = [
      'Você é o assistente financeiro da plataforma Extrato Co., criada pela Cortez Group.',
      'Responda sempre em português brasileiro. Seja direto e conciso (máx. 3 parágrafos).',
      'Não invente dados. Use apenas os números do contexto abaixo.',
      '',
      `=== CONTEXTO — ${ctx.month ?? 'mês atual'} ===`,
      `Entradas:      ${fmtBRL(ctx.income ?? 0)}`,
      `Saídas:        ${fmtBRL(ctx.expense ?? 0)}`,
      `Investimentos: ${fmtBRL(ctx.savings ?? 0)}`,
      `Saldo líquido: ${fmtBRL(ctx.balance ?? 0)}`,
      '',
      'Top categorias:',
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
        system: systemPrompt,
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
  } catch (err) {
    return new Response(
      JSON.stringify({ reply: 'Erro interno no assistente. Tente novamente.' }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
