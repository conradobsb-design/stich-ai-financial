import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PARSE_SYSTEM = `Você é um parser especializado em extratos e faturas bancárias brasileiras.
Analise o documento fornecido e retorne APENAS um JSON válido (sem markdown, sem explicações) com esta estrutura exata:

{
  "bank": "nome do banco",
  "billing_month": "YYYY-MM",
  "transactions": [
    {
      "description": "descrição limpa da transação",
      "amount": -100.00,
      "transaction_date": "YYYY-MM-DD",
      "billing_month": "YYYY-MM",
      "category": "categoria",
      "installment": "X/Y ou null"
    }
  ]
}

REGRAS CRÍTICAS:
- amount NEGATIVO = débito/despesa/compra no cartão
- amount POSITIVO = crédito/receita/depósito em conta
- Para extratos bancários: "C" (Crédito) = POSITIVO, "D" (Débito) = NEGATIVO
- Para faturas de cartão: todas as compras são NEGATIVAS
- Para datas no formato DD/MM sem ano: inferir o ano a partir do billing_month do documento
- Para compras parceladas "DD/MM DESCRIÇÃO XX/YY valor": transaction_date = data original da compra, installment = "XX/YY"
- billing_month de cada transação = mês da fatura em que aparece
- Para faturas Itaú com múltiplos cartões/titulares: incluir TODAS as transações de TODOS os cartões
- Para transações internacionais: usar SEMPRE o valor em R$ (não USD/EUR)
- IGNORAR: totais, subtotais, saldos, encargos, IOF, juros, multas, anuidade, mensalidade, tarifas bancárias
- IGNORAR: linhas de cabeçalho, rodapé, informações de limite, simulações de parcelamento

FORMATOS CONHECIDOS:
Itaú fatura: "DD/MM DESCRIÇÃO[DD/MM parcela] valor" — ex: "09/11 KIWIFY *RENDE06/10 179,92"
BTG fatura: "DD Mmm DESCRIÇÃO (X/Y) R$ valor" — ex: "18 Ago Greenn Pagamentos (9/12) R$ 182,37"
Caixa extrato: "DD/MM/YYYY - HH:MM:SS NrDoc DESCRIÇÃO valor C/D saldo C/D"
Nubank fatura: "DD/MM DESCRIÇÃO valor"
Sicredi extrato: "DD/MM/YYYY DESCRIÇÃO valor C/D"

CATEGORIAS disponíveis: Alimentação, Transporte, Viagem, Hospedagem, Saúde, Educação, Entretenimento, Assinaturas, Compras, Serviços Financeiros, Vestuário, Casa, Outros`;

// deno-lint-ignore no-explicit-any
const parseAmount = (v: any): number => {
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(s) || 0;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { text_data, user_id, file_name, import_type, source_type } = await req.json();

    if (!text_data || !user_id) {
      return new Response(JSON.stringify({ error: 'text_data e user_id obrigatórios' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const apiKey     = Deno.env.get('ANTHROPIC_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const supabase = createClient(supabaseUrl, serviceKey, { db: { schema: 'stich_ai' } });

    // ── Checar duplicata ─────────────────────────────────────────────────────
    const { data: dup } = await supabase
      .from('imported_files')
      .select('id, imported_at')
      .eq('user_id', user_id)
      .eq('file_name', file_name)
      .maybeSingle();

    if (dup) {
      return new Response(
        JSON.stringify({ error: 'duplicate', imported_at: dup.imported_at }),
        { status: 409, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── Parsear com Claude ───────────────────────────────────────────────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: PARSE_SYSTEM,
        messages: [{
          role: 'user',
          content: `Parse este documento e retorne APENAS o JSON:\n\n${text_data.substring(0, 15000)}`,
        }],
      }),
    });

    const claudeData = await claudeRes.json();
    const rawText = claudeData?.content?.[0]?.text ?? '';

    // Extrai o JSON da resposta (ignora texto antes/depois)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ count: 0, error: 'parse_failed', raw: rawText.substring(0, 300) }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // deno-lint-ignore no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ count: 0, error: 'invalid_json' }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const transactions: any[] = parsed.transactions ?? [];
    if (transactions.length === 0) {
      return new Response(JSON.stringify({ count: 0 }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ── Montar rows ──────────────────────────────────────────────────────────
    const detectedSourceType = source_type ||
      (import_type === 'cartao' ? 'credit_card' : import_type === 'investimento' ? 'investment' : 'bank');

    const rows = transactions.map((t: any) => ({
      user_id,
      description: String(t.description ?? '').substring(0, 255),
      amount: parseAmount(t.amount),
      transaction_date: t.transaction_date ?? parsed.billing_month + '-01',
      billing_month: t.billing_month ?? parsed.billing_month ?? null,
      category: t.category ?? 'Outros',
      bank: parsed.bank ?? '',
      source_type: detectedSourceType,
      metadata: {
        file_name,
        import_type: import_type ?? 'extrato',
        installment: t.installment ?? null,
      },
    }));

    const { error: insertError } = await supabase.from('transactions').insert(rows);
    if (insertError) throw new Error(`Insert error: ${insertError.message}`);

    // ── Registrar arquivo importado ──────────────────────────────────────────
    await supabase.from('imported_files').insert({
      user_id,
      file_name,
      imported_at: new Date().toISOString(),
      transaction_count: rows.length,
    });

    return new Response(JSON.stringify({ count: rows.length }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('parse-statement error:', err);
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Erro interno' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
