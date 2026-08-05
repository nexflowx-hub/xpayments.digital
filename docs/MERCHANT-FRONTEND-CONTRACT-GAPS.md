# MERCHANT FRONTEND — CONTRACT GAPS

**Branch**: `feat/merchant-dashboard-finance-coherence-20260804`

---

## GAP-01: Métricas diárias por Store

**Endpoint atual**: `GET /finance/stores?currency=EUR`

**Falta**: Dados de vendas do dia (gross, fees, net, transactions) por Store.

**Sugestão**: Adicionar propriedades opcionais:
```json
{
  "today": {
    "gross": 0,
    "fees": 0,
    "net": 0,
    "transactions": 0
  }
}
```

Ou query param:
```
GET /finance/stores?currency=EUR&period=today
```

**Impacto**: O frontend não consegue mostrar "Líquido do dia" por Store. Mostra apenas "Líquido acumulado" e "Saldo operacional".

---

## GAP-02: Health de métodos de pagamento por Store

**Endpoint necessário**: `GET /developer/payment-method-health`

**Resposta esperada**:
```json
[
  {
    "storeId": "...",
    "storeCode": "REVEURO1",
    "storeName": "RevEuro-1",
    "currency": "EUR",
    "gatewayConfigured": "stripe-rail",
    "methods": [
      {
        "method": "visa",
        "active": true,
        "lastSuccessfulChargeAt": "2026-08-04T12:00:00Z",
        "lastError": null,
        "lastValidatedAt": "2026-08-04T12:00:00Z",
        "operationalStatus": "healthy"
      }
    ],
    "vaultConfigured": true,
    "lastValidatedAt": "2026-08-04T12:00:00Z"
  }
]
```

**Impacto**: A aba Estado em Desenvolvedores será mostrada com estado "Contrato de API necessário" até o endpoint existir.

---

## GAP-03: FX Quotes

**Endpoint atual**: `GET /finance/fx-quotes?base=EUR&quotes=BRL,USDT`

**Problema**: Retorna 404.

**Sugestão**: Integrar com provedor real de câmbio ou remover o endpoint até estar disponível.

**Impacto**: FX completamente desabilitado. Conversões multi-moeda no frontend não são feitas.

---

## GAP-04: Filtros de transações

**Endpoint atual**: `GET /transactions?page&limit&status&gateway&currency&reference`

**Falta**: Não suporta `method`, `country`, `sortBy`, `sortDir`.

**Sugestão**: Estender query params:
``nGET /transactions?page&limit&status&gateway&currency&reference&method&country&sortBy&sortDir
``

**Impacto**: Os filtros de método, país e ordenação foram removidos do frontend.

---

## GAP-05: Exportação CSV/Excel

**Endpoint atual**: Não existe.

**Sugestão**:
```
GET /transactions/export?format=csv&status=succeeded&currency=EUR
GET /transactions/export?format=xlsx&status=succeeded&currency=EUR
```

**Impacto**: Botões de exportação removidos. Quando o endpoint existir, podem ser restaurados.

---

## GAP-06: Conversão multi-moeda (PLN, etc.)

**Contexto**: XPayments começará a processar PLN via BLIK na Polónia.

**Falta**: O backend precisa extrair e expor dados de conversão do provedor (Stripe):
```json
{
  "sourceAmount": 100.00,
  "sourceCurrency": "PLN",
  "settlementAmount": 23.15,
  "settlementCurrency": "EUR",
  "exchangeRate": 0.2315,
  "exchangeRateSource": "provider",
  "convertedAt": "2026-08-04T12:00:00Z"
}
```

**Impacto**: O tipo `MoneyConversion` foi preparado no frontend. Nenhuma conversão é feita no browser.

---

## GAP-07: Wallet `changePct`

**Problema**: O campo `changePct` em `Wallet` é opcional mas o frontend o usa sem verificação segura em alguns lugares.

**Sugestão**: Garantir que o backend sempre retorna `changePct: 0` quando não houver variação, ou marcar explicitamente como `null`.

**Impacto**: Menor. Frontend trata `?? 0`.

---

## GAP-08: Dados de Analytics

**Endpoint atual**: `GET /analytics/overview`

**Falta**: O endpoint não retorna dados de visitas, funil de conversão, nem volume por país. Os campos legados (`revenue`, `volume`, `conversion`, `approvalRate`, `riskScore`) são opcionais e podem ser `undefined`.

**Impacto**: Funil de conversão e breakdown por país foram removidos. Gráficos mostram "Dados ainda não disponíveis" quando as séries estão vazias.

---

## GAP-09: Heartbeat do Risk Engine

**Falta**: Não existe endpoint de heartbeat/health do motor de risco acessível ao merchant.

**Impacto**: Badges "Engine live" e "Monitoring" foram removidos. O status é inferido apenas pelo carregamento bem-sucedido do `GET /risk/profile`.
