# MERCHANT FRONTEND FINANCE AUDIT — 2026-08-04

**Branch**: `feat/merchant-dashboard-finance-coherence-20260804`  
**Base SHA**: `01f62e6fb53b6a641c34d7bdf86644e246cc99a9`  
**Scope**: Merchant frontend only (no backend, no landing, no auth, no `/payments/charge`)

---

## 1. Dados reais consumidos

| Dado | Endpoint | Componente | Campo
|------|----------|------------|------|
| Vendas brutas/líquidas (hoje, semana, mês, allTime) | `GET finance/overview?currency=EUR` | dashboard.tsx | `sales.today.gross`, `sales.month.net` etc.
| Wallet balance | `GET finance/overview?currency=EUR` | dashboard.tsx | `wallet.balance`
| Wallet pending | `GET finance/overview?currency=EUR` | dashboard.tsx | `wallet.pending`
| Payouts pagos | `GET finance/overview?currency=EUR` | dashboard.tsx | `payouts.paid`, `payouts.paidCount`
| Stores financeiros | `GET finance/stores?currency=EUR` | dashboard.tsx, wallets.tsx | `FinanceStore[]`
| Liberações | `GET finance/releases?currency=EUR` | finance-releases.tsx | `FinanceNextRelease[]`
| Extratos de payout | `GET payout-statements?currency=EUR` | finance-payouts.tsx | `PayoutStatementV4[]`
| Wallets | `GET wallets` | wallets.tsx | `Wallet[]`
| Movements | `GET wallets/movements` | wallets.tsx | `WalletMovement[]`
| Transações | `GET transactions` | payments.tsx | `Transaction[]` (paginated)
| Risk profile | `GET risk/profile` | risk.tsx | `RiskProfile`
| Analytics overview | `GET analytics/overview` | analytics.tsx | `AnalyticsOverview`
| Payout requests | `GET payout-requests` | payout-request-panel.tsx | `PayoutRequest[]`

## 2. Dados calculados no frontend (legítimos)

| Dado | Onde | Cálculo
|------|------|--------|
| `totalEur`, `availableEur`, `reservedEur` | wallets.tsx | `wallets.reduce()` usando `EUR_RATES` (PROBLEMA: taxas hardcoded)
| `weightedChange` | wallets.tsx | média ponderada de `changePct` por `EUR_RATES` (PROBLEMA)
| `allocationData` | wallets.tsx | `w.balance * EUR_RATES[w.currency]` (PROBLEMA)
| `swapRate`, `swapConverted` | wallets.tsx | divisão de `EUR_RATES` hardcoded
| `funnel` (visits=184200) | analytics.tsx | `visits * conversion / 100` (PROBLEMA: hardcoded)
| `countries` volume | analytics.tsx | `Math.sin(seed) * volume` (PROBLEMA: simulado)
| Risk score `change={-3.0}` | risk.tsx | valor fixo hardcoded

## 3. Dados simulados encontrados

| Ficheiro | Problema | Gravidade
|----------|----------|----------|
| **wallets.tsx:38-40** | `EUR_RATES` com taxas fixas (USD:0.92, BRL:0.18, GBP:1.17, USDT:0.99, BTC:42000) | **CRÍTICO**
| **wallets.tsx:42-51** | `genSpark()` — sparklines gerados com `Math.sin/Math.cos` | **CRÍTICO**
| **wallets.tsx:72-77** | `totalEur` calculado com taxas hardcoded | **CRÍTICO**
| **wallets.tsx:100-101** | `swapRate` e `swapConverted` com taxas hardcoded | **CRÍTICO**
| **analytics.tsx:44** | `visits = 184200` hardcoded | **CRÍTICO**
| **analytics.tsx:59-67** | países com volume derivado de `Math.sin(seed)` | **CRÍTICO**
| **analytics.tsx:42-43** | `conversion ?? 4.7`, `approvalRate ?? 96.8` defaults apresentados como reais | **MÉDIO**
| **risk.tsx:74** | `change={-3.0}` hardcoded no StatCard | **MÉDIO**
| **risk.tsx:58-63** | `Engine live` badge sem heartbeat real | **BAIXO**
| **risk.tsx:175-181** | `Monitoring` badge sem estado real | **BAIXO**

## 4. Filtros visuais sem suporte de API

| Filtro | Componente | Problema
|--------|------------|----------|
| Método (visa, mastercard, pix...) | payments.tsx:161-167 | `method` não enviado à API
| País (COUNTRY_LIST) | payments.tsx:168-174 | `country` não enviado à API
| Período (7d, 30d, 90d) | analytics.tsx:86-96 | `range` nunca usado na query
| Pesquisa por cliente/email | payments.tsx:140-144 | Enviado como `reference`, mas a UI diz "customer, email"
| Gateway (hardcoded) | payments.tsx:175-181 | `gateway` enviado à API, mas lista de gateways é hardcoded, não vem do backend

## 5. Botões sem operação real

| Botão | Componente | Comportamento
|--------|------------|-------------|
| **Export CSV** | payments.tsx:125-127 | `toast("Export started")` — nenhum export real
| **Export Excel** | payments.tsx:128-130 | `toast("Export started")` — nenhum export real
| **Deposit** | wallets.tsx:175-177 | Chama endpoint real mas não validado operacionalmente
| **Withdraw** | wallets.tsx:178-180 | Chama endpoint real mas não validado operacionalmente
| **Swap** | wallets.tsx:181-183 | Usa taxas hardcoded — não operacional

## 6. Páginas duplicadas

- `finance-stores` (Por Store) está desativada com banner, mas os mesmos dados existem em `wallets.tsx` (secção Carteiras por Store).

## 7. Páginas que devem ser ocultadas da sidebar

| Página | Razão |
|--------|-------|
| **FX** (`fx`) | Endpoint `/finance/fx-quotes` retorna 404 — página mostra banner desabilitado |
| **Tesouraria** (`treasury`) | Página mostra banner "Indisponível" |
| **Fluxo Financeiro** (`finance-flow`) | Página mostra banner "Indisponível" |

## 8. Lacunas do contrato de API

1. **`GET /finance/stores` não retorna métricas diárias por Store** — não é possível mostrar "Líquido do dia" por Store sem estimar.
2. **Não existe `GET /developer/payment-method-health`** — necessário para aba Estado em Desenvolvedores.
3. **`GET /finance/fx-quotes` retorna 404** — sem fonte real de câmbio.
4. **`GET /transactions` não suporta `method` nem `country`** como query params — filtros são falsos.
5. **Não existe exportação CSV/Excel no backend** — os botões são funcionais apenas no frontend.
6. **Wallet `changePct`** é opcional no tipo mas usado como se fosse sempre presente.

## 9. Ficheiros alterados nesta intervenção

- `src/components/merchant/dashboard.tsx` — REESCRITO
- `src/components/merchant/wallets.tsx` — REESCRITO
- `src/components/merchant/finance-stores.tsx` — RESTAURADO com dados reais
- `src/components/merchant/finance-payouts.tsx` — MODIFICADO (consolidação)
- `src/components/merchant/payments.tsx` — MODIFICADO (filtros, exports)
- `src/components/merchant/analytics.tsx` — LIMPO (remover dados simulados)
- `src/components/merchant/risk.tsx` — LIMPO (remover dados fabricados)
- `src/components/merchant/developers.tsx` — ADICIONAR aba Estado
- `src/components/merchant/payout-requests/payout-confirmation-dialog.tsx` — CORRIGIR state machine
- `src/components/merchant/payout-requests/payout-request-list.tsx` — FILTRAR confirmed do bloco superior
- `src/components/merchant/finance/store-wallet-card.tsx` — NOVO (reutilizável)
- `src/components/merchant/finance/store-wallet-dialog.tsx` — NOVO (reutilizável)
- `src/config/index.ts` — MODIFICADO (remover FX/Treasury/Flow da sidebar)
- `src/types/index.ts` — ADICIONAR MoneyConversion
- `src/lib/i18n/locales.ts` — ADICIONAR chaves i18n
- `docs/MERCHANT-FRONTEND-FINANCE-AUDIT-20260804.md` — NOVO
- `docs/MERCHANT-FRONTEND-CONTRACT-GAPS.md` — NOVO
