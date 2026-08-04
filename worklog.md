# XPayments Digital — Worklog

---
Task ID: 1
Agent: Main
Task: Dashboard redesign, wallets by store, disable money-movement pages

Work Log:
- Read all relevant source files (dashboard, wallets, fx, treasury, finance-flow, finance-stores, config, types, hooks, shell, api)
- Rewrote dashboard.tsx: removed 3 KPI cards (Taxas, Disponível, Projetado), kept 5 (Vendas brutas, Líquido, Wallet total, Pendente, Payouts pagos)
- Added month selector (Popover with 12 months) in dashboard header
- Added drill-down dialogs for Wallet total and Pendente (shows breakdown by Store using FinanceStores API)
- Made all KPI cards uniform height (min-h-[120px])
- Rewrote wallets.tsx: added 'Carteiras por Store' section with responsive grid showing store cards (net, pending, operational balance)
- Added store detail dialog showing all financial metrics per store
- Replaced fx.tsx content with disabled banner ('Indisponível nesta versão')
- Replaced treasury.tsx content with disabled banner
- Replaced finance-flow.tsx content with disabled banner
- Replaced finance-stores.tsx content with disabled banner
- Fixed unused imports (CreditCard, formatNumber, ArrowLeftRight)
- Ran ESLint: clean pass
- Dev server compiled without errors
- Committed as 0713594 and pushed to origin/main

Stage Summary:
- 6 files changed, 499 insertions, 1132 deletions
- Commit: 0713594 pushed to main
- All 4 money-movement sub-pages now show 'Indisponível nesta versão' banner
- Dashboard has 5 uniform KPI cards with month selector and drill-down
- Wallets page shows store-associated financial data
