# CLAUDE.md — Extrato Co. / Stich AI Financial

Leia este arquivo inteiro antes de qualquer ação. Ele é a fonte de verdade do projeto.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS (CDN) + Recharts + Framer Motion |
| Auth + DB | Supabase (projeto: `vqeooohmsffyqonzwzct`) — schema: `stich_ai`, tabela: `transactions` |
| AI pipeline | n8n (auto-hospedado no Coolify) → Claude API (claude-haiku-4-5) |
| Deploy | Coolify → Docker (nginx:alpine na porta 3000) |
| Repositório git | `stich-ai-financial` em `C:\Users\55619\Documents\GitHub\stich-ai-financial\` |
| Arquivos locais de referência | `C:\Users\55619\Downloads\CONRADO 3d\Antigravity\Extrato Bancario\` (NÃO é o repo git) |

---

## Arquitetura do fluxo de importação

```
Browser (PDF.js extrai texto) 
  → POST JSON para VITE_N8N_WEBHOOK_URL
  → n8n: Build Prompt → Claude API → Extract Transactions → Save to Supabase
  → window.location.reload()
```

### Payload enviado ao n8n
```json
{
  "text_data": "<texto extraído do PDF>",
  "user_id": "<uuid do usuário>",
  "file_name": "<nome do arquivo>",
  "import_type": "extrato | cartao | investimento",
  "source_type": "bank | credit_card | investment"
}
```

### n8n Workflow ativo: "Stich AI: Categorização Financeira v2"
- Webhook path: `f4cf362c-8274-4dc6-a13d-896e0af469a0`
- Nodes: Webhook → Build Prompt (Code) → Claude API (HTTP Request) → Extract Transactions (Code) → Save to Supabase → Respond
- **IMPORTANTE**: Body Content Type do node Claude API deve ser `Raw`, não `JSON`
- Supabase node: Use Custom Schema ON, schema=`stich_ai`, table=`transactions`, Auto-Map Input Data to Columns
- Há também o workflow de chat: "Extrato Co - AI Chat" (path: `extrato-ai-chat`)

### Campos salvos na tabela `transactions`
```
user_id, transaction_date (YYYY-MM-DD), description, amount (negativo=despesa),
category, source_type (bank|credit_card|investment), bank (nome do arquivo)
```

---

## Lógica de categorização (frontend)

- `smartCategory(item)`: tenta a categoria salva no DB; se for "Outros" ou vazia, aplica `CATEGORY_RULES` por keyword matching na descrição
- `classifyTransaction(item)`: retorna `'income'` (amount > 0), `'expense'` (amount < 0), ou `'savings'` (categoria de investimento com amount < 0)
- `CATEGORY_RULES` em `Dashboard.jsx` linhas ~43-60: 18 categorias com listas de keywords expandidas

---

## Lógica de anti-duplicação (cartão de crédito)

Quando o usuário sobe tanto o extrato bancário quanto a fatura do cartão, o pagamento do boleto da fatura no extrato bancário deve **desaparecer** — substituído pelas transações individuais da fatura.

```javascript
// Em monthlyData (useMemo):
// hasAnyCreditCard = data.some(item => item.source_type === 'credit_card')
// creditCardTotalByIssuer = { 'sicredi': 1234.56, '__unknown__': 0 }

// Se hasAnyCreditCard === true:
//   Camada 1: remove transações com categoria 'Cartão de Crédito'
//   Camada 2: remove boletos bancários cujo emissor tenha fatura importada
//     BOLETO_PATTERNS: ['pagamento boleto', 'pgto boleto', 'deb aut fatura', ...]
//     CARD_ISSUERS: ['itau', 'sicredi', 'nubank', 'bradesco', 'santander', ...]
```

Dependências do useMemo: `[data, selectedMonth, searchTerm, hasAnyCreditCard, creditCardTotalByIssuer]`

---

## Configurações críticas

### Supabase
- URL Configuration → Site URL: `https://extratobancario.cortezgroup.com.br`
- Redirect URLs: `https://extratobancario.cortezgroup.com.br/**`
- Constraints de fingerprint **já removidas**:
  ```sql
  -- Já executado:
  ALTER TABLE stich_ai.transactions DROP CONSTRAINT IF EXISTS transactions_fingerprint_key;
  ALTER TABLE stich_ai.transactions DROP CONSTRAINT IF EXISTS uq_transaction_fingerprint;
  ```

### nginx (`nginx.conf`)
- Serve SPA na porta 3000
- Cache longo para `/assets/`
- `location ~* \.mjs$` com `types { application/javascript mjs; }` para o PDF.js worker
- **ATENÇÃO**: O worker do PDF.js agora carrega via CDN (ver abaixo) — o fix do nginx é redundante mas mantido

### PDF.js worker (Dashboard.jsx linha 23-24)
```javascript
import * as pdfjsLib from 'pdfjs-dist'; // versão 5.6.205
// CDN — evita erro de MIME type do nginx com .mjs
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
```
**NÃO reverter** para `import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'` — nginx não serve .mjs com MIME type correto.

---

## Variáveis de ambiente (build time no Coolify)

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SCHEMA=stich_ai
VITE_N8N_WEBHOOK_URL    ← URL do webhook de importação
VITE_N8N_CHAT_URL       ← URL do webhook do chat AI
```

---

## Problemas já resolvidos — NÃO tentar de novo

1. **n8n AI Agent retornava texto puro** → substituído por HTTP Request direto à Claude API
2. **Body Content Type = JSON no node Claude API** → causa erro "Field required". Usar `Raw`
3. **Constraint `transactions_fingerprint_key`** → removida via SQL
4. **Constraint `uq_transaction_fingerprint`** → removida via SQL
5. **`chartData` usando `item.category` direto** → causa ~R$80k em "Outros". Usar `smartCategory(item)`
6. **Crash React (tela preta)** → dependency array do useMemo `monthlyData` referenciava `importedCardIssuers` (nome antigo). Correto: `[data, selectedMonth, searchTerm, hasAnyCreditCard, creditCardTotalByIssuer]`
7. **Coolify pulando rebuild** → causado por mesmo commit SHA. Forçar com novo commit
8. **`default_type` no nginx não funciona para .mjs** → usar bloco `types {}` OU CDN (solução atual)

---

## Estado atual do banco de dados

- **228 transações** com `source_type = 'bank'`
- **0 transações** com `source_type = 'credit_card'` (fatura ainda não importada com sucesso)
- Saldo do mês de março 2026: R$ -52.570,20 (normal — boleto Sicredi ainda contando como despesa pois não há credit_card data)

---

## Próximos passos pendentes

1. ~~Commit + push `Dashboard.jsx` (workerSrc via CDN)~~ ✓
2. ~~Redeploy Coolify~~ ✓
3. ~~Constraints de fingerprint removidas~~ ✓
4. ~~n8n workflow v2 publicado com chave correta~~ ✓
5. Reimportar extrato bancário + fatura cartão (base zerada em 13/04/2026)
6. Verificar anti-duplicação do boleto Sicredi após reimport
7. Logout + login no app (CORS Supabase auth)

---

## Chave Anthropic

- Chave `extrato-co` (Ml3...KAAA) foi **revogada** — estava exposta no workflow JSON e no .env
- Chave ativa: `extrato co-nova` (5Zf...hgAA)
- Atualizar no n8n: node Claude API → header `x-api-key`
- Atualizar no `.env` local

---

## Fase 6 — Integração bancária automática via Pluggy

**Objetivo:** eliminar upload manual de PDFs. Usuário conecta o banco uma vez e os lançamentos chegam automaticamente.

### Arquitetura planejada
```
Usuário clica "Conectar banco" no app
→ Pluggy Connect Widget (OAuth)
→ Pluggy busca transações periodicamente
→ Webhook Pluggy → n8n
→ Claude categoriza → Supabase salva
→ Dashboard atualiza automaticamente
```

### Escopo de implementação

**Backend / n8n:**
- [ ] Criar conta Pluggy (pluggy.ai) e obter `CLIENT_ID` + `CLIENT_SECRET`
- [ ] Novo n8n workflow: recebe webhook Pluggy → mapeia campos → chama Claude → salva Supabase
- [ ] Campos Pluggy: `id`, `date`, `description`, `amount`, `type`, `category`, `accountId`

**Frontend:**
- [ ] Adicionar botão "Conectar banco" no dashboard
- [ ] Integrar Pluggy Connect Widget (SDK JS): `@pluggy/connect-widget`
- [ ] Salvar `itemId` do Pluggy por usuário na tabela `stich_ai.connected_accounts`
- [ ] Exibir status da conexão (conectado/desconectado/erro)

**Supabase:**
- [ ] Criar tabela `stich_ai.connected_accounts`: `user_id`, `pluggy_item_id`, `bank_name`, `connected_at`, `last_sync_at`
- [ ] Adicionar campo `pluggy_id` na tabela `transactions` (para evitar duplicatas via upsert)

**Variáveis de ambiente a adicionar:**
```
VITE_PLUGGY_CLIENT_ID
PLUGGY_CLIENT_SECRET   (só no backend/n8n — nunca no frontend)
```

### Bancos cobertos pelo Pluggy relevantes
- Sicredi ✓
- Nubank ✓
- Itaú ✓
- Bradesco ✓
- Santander ✓
- Banco Inter ✓
- C6 Bank ✓
- BTG ✓

### Custo estimado
~R$0,50 por conexão ativa/mês. Para 10 usuários = ~R$5/mês.

---

## Identidade do produto

- Nome: **Extrato Co.** (plataforma), criada pela **Cortez Group**
- Domínio: `extratobancario.cortezgroup.com.br`
- Usuário principal: Conrado (`conradobsb@gmail.com`)
