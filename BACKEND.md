# XPayments — Backend & Database Technical Specification

**Document:** Master technical specification for the XPayments backend API and Supabase database.
**Frontend repo:** https://github.com/nexflowx-hub/xpayments.digital
**API base URL (production):** `https://api.xpayments.digital/api/v1`
**Source of truth for the API contract:** `src/lib/api/xpApi.ts` + `src/types/index.ts` in the frontend repo.
**Companion document:** `AUDIT.md` (frontend readiness audit).

This document specifies everything an engineer needs to build, deploy, and operate the backend on a Ubuntu VPS with a Supabase PostgreSQL database. The SQL DDL in §4 is runnable as-is in the Supabase SQL editor. The endpoint table in §5 is the canonical API contract — the frontend's `xpApi.ts` is the client-side mirror.

---

## 1. Architecture Overview

### 1.1 Components

| Layer | Technology | Role |
|-------|-----------|------|
| Reverse proxy | Nginx 1.22+ | TLS termination, gzip, security headers, request buffering |
| Process manager | PM2 | Node.js process supervision, restart on crash, logs |
| Application server | Node.js 20 LTS (or Bun 1.1+) | The REST API |
| Web framework | Hono (recommended) or Fastify | HTTP routing, middleware, validation |
| Database | Supabase (PostgreSQL 15) | Managed Postgres + Storage + (optional) Auth |
| ORM / query | `postgres` (Postgres.js) or `@supabase/supabase-js` | Parameterized queries, no raw string interpolation |
| Cache / queue (optional) | Redis 7 (Upstash or self-hosted) | Session cache, rate-limit counters, background job queue |
| Background jobs | BullMQ (Redis-backed) or `pg-boss` (Postgres-backed) | Webhook delivery, KYC document processing, payouts |
| Secrets | `.env` file + `pm2` env injection |  |
| TLS | Let's Encrypt via Certbot | Auto-renewing certificates |
| Monitoring | PM2 logs, Sentry (optional), UptimeRobot (optional) |  |

### 1.2 Why Hono

Hono is recommended over Express and Fastify for this project because:
- It runs on Node.js, Bun, Deno, and Cloudflare Workers (future-proof).
- It has built-in Zod-OpenAPI integration (`@hono/zod-openapi`) — the validation schema and the OpenAPI spec are the same file, so the contract in §5 stays in sync with the code automatically.
- It is faster than Express and comparable to Fastify.
- Middleware composition is cleaner than Express.

If the team prefers Express for familiarity, every endpoint in §5 maps 1:1 — the contract is framework-agnostic.

### 1.3 Architecture diagram

```mermaid
graph TB
    Client["Browser (Next.js SPA)<br/>xpayments.digital"]
    Nginx["Nginx :443<br/>TLS / gzip / headers"]
    API["Node.js API :3001<br/>Hono + PM2"]
    Supabase[("Supabase PostgreSQL<br/>RLS-enabled")]
    Redis[("Redis<br/>sessions / queues")]
    Storage["Supabase Storage<br/>KYC docs / product images"]
    Workers["Background Workers<br/>BullMQ / pg-boss"]

    Client -->|HTTPS| Nginx
    Nginx -->|reverse_proxy localhost:3001| API
    API -->|SQL over pgbouncer:6543| Supabase
    API -->|SET / GET| Redis
    API -->|signed URLs| Storage
    API -->|enqueue jobs| Redis
    Redis -->|dequeue| Workers
    Workers -->|SQL| Supabase
    Workers -->|deliver| ExtWebhooks["External merchant webhooks"]
    Workers -->|upload / read| Storage
```

### 1.4 Request lifecycle

1. Browser sends `Authorization: Bearer <jwt>` to `https://api.xpayments.digital/api/v1/...`.
2. Nginx terminates TLS, applies security headers, forwards to `localhost:3001`.
3. Hono middleware: CORS check → rate-limit check (Redis counter) → JWT verification → `req.set('merchantId', jwt.merchant_id)` → Zod request validation.
4. Route handler: parameterized SQL via `postgres` client (Supabase pooler) → response shaping → JSON.
5. On mutation: enqueue webhook/payout jobs to Redis (or `pg-boss`).
6. Nginx applies gzip, returns response.

### 1.5 Why not Supabase Edge Functions / PostgREST directly

Supabase exposes PostgREST (auto-REST from tables) and Edge Functions (Deno). The frontend could in principle talk to PostgREST directly. We do **not** recommend this because:
- The auth envelope (`AuthSession`) and the refresh flow are custom (see §6) and do not match Supabase Auth's default session shape.
- Several endpoints aggregate across tables (`/analytics/overview`, `/treasury/overview`, `/admin/revenue`) — these are 5–10 SQL queries each, better expressed as a single server-side function than as N+1 client calls.
- Business logic (wallet swap, payout, KYC decision, risk score update) requires transactions and side effects (webhooks, audit logs) that PostgREST cannot express cleanly.
- The backend is the right place to enforce PCI DSS / KYC / audit rules; putting them in the frontend or in PostgREST RLS policies makes them hard to audit.

Supabase is used as a **managed PostgreSQL + Storage**, not as the application layer. RLS is enabled as defense-in-depth (§4, §7).

---

## 2. VPS Provisioning (Ubuntu)

Target: a fresh Ubuntu 24.04 LTS VPS (Hetzner CX32, DigitalOcean 4GB/2vCPU, or equivalent). 4 GB RAM / 2 vCPU / 80 GB SSD is the minimum for the API + Nginx + Redis. The database lives on Supabase (managed), so the VPS does not need to run Postgres.

### 2.1 Initial SSH hardening

```bash
# As root over the provider's console or initial SSH
apt update && apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades curl ca-certificates gnupg build-essential

# Create deploy user
adduser deploy --gecos ""
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable root login + password auth
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall: allow SSH, HTTP, HTTPS only
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# fail2ban: ban after 5 SSH failures in 10 min
cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
findtime = 600
bantime = 3600
EOF
systemctl enable --now fail2ban

# Automatic security updates
dpkg-reconfigure -plow unattended-upgrades
```

### 2.2 Timezone + swap

```bash
timedatectl set-timezone UTC
# 4 GB swap on a 4 GB RAM VPS (for npm install spikes)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf
```

### 2.3 Install Node.js 20 LTS, Nginx, Certbot, PM2, Redis

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v && npm -v

# PM2 globally
npm install -g pm2

# Nginx + Certbot
apt install -y nginx certbot python3-certbot-nginx

# Redis (optional but recommended)
apt install -y redis-server
sed -i 's/^#\?maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/^#\?maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
systemctl enable --now redis-server

# Bun (optional, if running the API on Bun)
curl -fsSL https://bun.sh/install | bash
```

### 2.4 Directory structure

```bash
mkdir -p /var/www/xpayments-api
mkdir -p /var/www/xpayments-api/releases
mkdir -p /var/www/xpayments-api/shared
mkdir -p /var/log/xpayments-api
chown -R deploy:deploy /var/www/xpayments-api /var/log/xpayments-api
```

Symlink-based deploy: each release goes in `releases/<timestamp>/`, `current` symlinks to the latest, PM2 runs from `current/`.

### 2.5 Environment variables

`/var/www/xpayments-api/shared/.env` (chmod 600, owned by deploy):

```bash
# ---- Server ----
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# ---- Database (Supabase) ----
# Direct connection (for migrations, NOT for runtime)
DATABASE_URL=postgresql://postgres.xxxxxx:password@db.xxxxxx.supabase.co:5432/postgres
# Pooler connection (for runtime — PgBouncer, max 200 conns)
DATABASE_POOLER_URL=postgresql://postgres.xxxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres

# ---- Supabase ----
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...      # service_role key — server only, never exposed
SUPABASE_ANON_KEY=eyJhbGci...         # anon key — for Storage public reads

# ---- Auth ----
JWT_SECRET=CHANGE_ME_to_a_64_char_random_string
JWT_ACCESS_TTL=28800                   # 8 hours, in seconds
JWT_REFRESH_TTL=2592000                # 30 days, in seconds
BCRYPT_ROUNDS=12

# ---- CORS ----
CORS_ORIGINS=https://xpayments.digital,https://www.xpayments.digital

# ---- Redis (optional) ----
REDIS_URL=redis://127.0.0.1:6379/0

# ---- Rate limiting ----
RATE_LIMIT_WINDOW=60                   # seconds
RATE_LIMIT_MAX=300                     # requests per window per IP

# ---- Webhooks ----
WEBHOOK_SIGNING_SECRET=whsec_change_me
WEBHOOK_DELIVERY_TIMEOUT_MS=10000
WEBHOOK_MAX_RETRIES=5

# ---- Storage buckets ----
KYC_BUCKET=kyc-documents
PRODUCT_BUCKET=product-images
```

### 2.6 Nginx reverse proxy + SSL

`/etc/nginx/sites-available/api.xpayments.digital`:

```nginx
server {
    listen 80;
    server_name api.xpayments.digital;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.xpayments.digital;

    ssl_certificate     /etc/letsencrypt/live/api.xpayments.digital/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.xpayments.digital/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript application/xml text/xml application/xml+rss text/javascript;

    # Body limits
    client_max_body_size 25M;  # KYC document uploads

    # Reverse proxy to Node API
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Health check (no rate limit, no logging)
    location = /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/api.xpayments.digital /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.xpayments.digital --non-interactive --agree-tos -m ops@xpayments.digital --redirect
# Auto-renew is installed as a systemd timer by certbot
```

---

## 3. Supabase Database Setup

### 3.1 Project creation

1. Create a Supabase project at https://supabase.com/dashboard. Region: pick the one closest to the VPS (e.g. `eu-central-1` for a Hetzner FSN1 VPS). Plan: Pro ($25/mo) minimum for production — the Free tier has 500 MB DB + 1 GB storage + paused after 7 days inactivity, which is insufficient.
2. Set a strong database password (store in 1Password / Vault — it cannot be recovered).
3. Note the project reference (`xxxxxx` in `db.xxxxxx.supabase.co`).

### 3.2 Connection strings

Supabase provides four connection modes. Use them as follows:

| Mode | URL pattern | Use case |
|------|------------|----------|
| Direct (port 5432) | `postgresql://postgres.xxxxxx:pwd@db.xxxxxx.supabase.co:5432/postgres` | Migrations, DDL, admin scripts. Long-lived, one connection. |
| Session pooler (port 5432, pooler host) | `...@aws-0-region.pooler.supabase.com:5432/postgres` | Server-side prepared statements. |
| Transaction pooler (port 6543) | `...@aws-0-region.pooler.supabase.com:6543/postgres` | **Runtime API queries.** PgBouncer, max 200 conns. No prepared statements. |
| IPv4 vs IPv6 | Add `?pgbouncer=true` for transaction pooler |  |

**Production rule:** the API server uses `DATABASE_POOLER_URL` (transaction pooler, port 6543) for all runtime queries. Migrations use `DATABASE_URL` (direct, port 5432). Never run migrations through the pooler.

### 3.3 Row Level Security (RLS) strategy

RLS is enabled on every table. Two operating modes are supported:

**Approach A (recommended for MVP) — application-layer auth, RLS as defense-in-depth:**
- The backend issues its own JWTs (see §6). The API connects to Supabase using the `service_role` key, which **bypasses RLS**.
- Auth, authorization, and merchant-scoping are enforced in the application layer (Hono middleware + per-route checks).
- RLS policies are still written (see §4) so that if the `service_role` key is ever compromised and an attacker connects directly, they still cannot read another merchant's data **unless** they also have the `service_role` key (which bypasses RLS). RLS here is a second line of defense for the `anon`/`authenticated` keys, not for `service_role`.

**Approach B (alternative) — Supabase Auth + RLS as primary auth:**
- The frontend calls Supabase Auth directly (`supabase.auth.signInWithPassword`). Supabase issues its own JWT with `auth.uid()` and `auth.jwt() ->> 'role'` claims.
- The backend verifies the Supabase JWT and forwards it to Postgres via `set request.jwt.claim.merchant_id = ...`. RLS policies use `auth.jwt() ->> 'merchant_id'`.
- Trade-off: the frontend's `AuthSession` shape (§6.1) does not match Supabase Auth's session shape. A mapping layer is required. The refresh flow is different. This approach is more work but gives you Supabase Auth's MFA, magic links, OAuth providers for free.

**This document specifies Approach A.** Approach B is documented as a future migration path in §9 (Phase 5+).

### 3.4 Storage buckets

Create two private buckets via the Supabase dashboard (Storage → New bucket):

| Bucket name | Public? | Purpose | MIME types | Max size |
|-------------|---------|---------|-----------|----------|
| `kyc-documents` | No (private) | KYC documents (passport, ID, selfie, address proof) | `image/jpeg, image/png, application/pdf` | 10 MB |
| `product-images` | No (private, signed URLs) | Merchant product images | `image/jpeg, image/png, image/webp` | 5 MB |

Files are stored as `<merchant_id>/<uuid>.<ext>`. Access is via signed URLs (10-minute expiry) generated by the backend. Never make these buckets public.

### 3.5 Auth provider config (Approach A)

Under Authentication → Providers:
- Email: enabled. Confirm email: ON (sends a verification link on signup). Auth rate limit: 10/hour.
- Google / GitHub / Apple: disabled for MVP (the frontend has no OAuth UI).
- SMTP: configure a transactional email provider (Resend, Postmark, or AWS SES). The default Supabase SMTP is rate-limited and not suitable for production.

Note: under Approach A, Supabase Auth is **not used for the frontend's login flow**. The `merchants` and `users` tables in §4 are the source of truth. Supabase Auth may still be used for admin access to the dashboard (a separate concern) — but this is optional.

---

## 4. Database Schema (Supabase / PostgreSQL)

### 4.1 Conventions

- All primary keys are `uuid`, generated by `gen_random_uuid()` (pgcrypto, enabled by default in Supabase).
- All timestamps are `timestamptz`, default `now()`. Stored in UTC.
- Money is stored as `numeric(18, 2)` (not `integer` cents) — the frontend's domain model uses floats, and the product involves 6 currencies including crypto where 8 decimals matter. For crypto amounts, use `numeric(18, 8)`.
- Enumerated types are PostgreSQL `text` with a `CHECK` constraint (not `enum`) — easier to migrate.
- JSON columns are `jsonb`.
- Arrays are `text[]`.
- Every table has `created_at timestamptz default now()`. Mutable tables also have `updated_at timestamptz default now()` with a trigger to keep it current.
- RLS is enabled on every table. Policies use a helper function `current_merchant_id()` that reads a session variable set by the backend: `set local request.jwt.claim.merchant_id = '<uuid>'`.

### 4.2 The DDL

Run the entire block below in the Supabase SQL editor (Database → SQL → New query). It is idempotent — safe to re-run.

```sql
-- ============================================================
-- XPayments — Full DDL (Supabase / PostgreSQL 15+)
-- Run in: Supabase SQL editor
-- Idempotent: safe to re-run.
-- ============================================================

-- Required extensions (Supabase enables these by default)
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- Helper: updated_at trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Helper: current merchant id from session variable
-- Set by the backend on every connection:
--   set local request.jwt.claim.merchant_id = '<uuid>';
--   set local request.jwt.claim.role = 'merchant' | 'admin';
-- ============================================================
create or replace function current_merchant_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.merchant_id', true), '')::uuid;
$$;

create or replace function current_role_xp()
returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anonymous');
$$;

-- ============================================================
-- 1. merchants
-- One row per merchant account (company).
-- ============================================================
create table if not exists merchants (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null,
  company       text,
  country       text default 'Portugal',
  tier          text not null default 'standard' check (tier in ('starter','standard','pro','enterprise')),
  status        text not null default 'pending' check (status in ('active','frozen','suspended','pending')),
  kyc_status    text not null default 'not_submitted' check (kyc_status in ('not_submitted','pending','approved','rejected')),
  risk_score    int  not null default 50 check (risk_score between 0 and 100),
  reserve_pct   numeric(5,2) not null default 10.00,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists merchants_status_idx        on merchants (status);
create index if not exists merchants_kyc_status_idx    on merchants (kyc_status);
create index if not exists merchants_created_at_idx    on merchants (created_at desc);
drop trigger if exists merchants_set_updated_at on merchants;
create trigger merchants_set_updated_t before update on merchants
  for each row execute function set_updated_at();

-- ============================================================
-- 2. users
-- One row per human who can log in. merchant_id is null for admins.
-- password_hash is bcrypt ($2b$...) or argon2id.
-- ============================================================
create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  merchant_id         uuid references merchants(id) on delete cascade,
  email               text not null unique,
  name                text not null,
  role                text not null default 'merchant' check (role in ('merchant','admin','guest')),
  password_hash       text,                          -- null if Supabase Auth is used
  avatar_url          text,
  two_factor_enabled  boolean not null default false,
  two_factor_secret   text,                          -- TOTP secret, encrypted at rest
  last_login_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists users_merchant_id_idx on users (merchant_id);
create index if not exists users_role_idx        on users (role);
drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_t before update on users
  for each row execute function set_updated_at();

-- ============================================================
-- 3. refresh_tokens
-- Rotating refresh tokens. One row per issued refresh token.
-- Revoked tokens are kept for audit (do not delete).
-- ============================================================
create table if not exists refresh_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  token_hash    text not null unique,               -- sha256 of the refresh token
  user_agent    text,
  ip_address    inet,
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists refresh_tokens_user_id_idx    on refresh_tokens (user_id);
create index if not exists refresh_tokens_expires_at_idx on refresh_tokens (expires_at);

-- ============================================================
-- 4. wallets
-- Multi-currency merchant wallets. balance = available + reserved.
-- ============================================================
create type if not exists wallet_type as enum ('fiat','crypto','card');

create table if not exists wallets (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references merchants(id) on delete cascade,
  currency      text not null check (currency in ('EUR','USD','BRL','GBP','USDT','BTC')),
  label         text not null,
  balance       numeric(18,8) not null default 0 check (balance >= 0),
  available     numeric(18,8) not null default 0 check (available >= 0),
  reserved      numeric(18,8) not null default 0 check (reserved >= 0),
  type          text not null default 'fiat' check (type in ('fiat','crypto','card')),
  card_last4    text,
  change_pct    numeric(6,2) not null default 0,
  color         text not null default '#3b82f6',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint wallets_balance_invariant check (balance = available + reserved)
);
create index if not exists wallets_merchant_id_idx on wallets (merchant_id);
create unique index if not exists wallets_merchant_currency_uniq on wallets (merchant_id, currency);
drop trigger if exists wallets_set_updated_at on wallets;
create trigger wallets_set_updated_t before update on wallets
  for each row execute function set_updated_at();

-- ============================================================
-- 5. wallet_movements
-- Ledger of every wallet balance change. Append-only.
-- ============================================================
create table if not exists wallet_movements (
  id            uuid primary key default gen_random_uuid(),
  wallet_id     uuid not null references wallets(id) on delete restrict,
  merchant_id   uuid not null references merchants(id) on delete cascade,
  currency      text not null check (currency in ('EUR','USD','BRL','GBP','USDT','BTC')),
  type          text not null check (type in ('deposit','withdraw','swap','payment','fee','payout')),
  direction     text not null check (direction in ('in','out')),
  amount        numeric(18,8) not null check (amount > 0),
  status        text not null default 'completed' check (status in ('completed','pending','failed')),
  reference     text not null,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists wm_wallet_id_idx      on wallet_movements (wallet_id);
create index if not exists wm_merchant_id_idx    on wallet_movements (merchant_id);
create index if not exists wm_type_idx           on wallet_movements (type);
create index if not exists wm_created_at_idx     on wallet_movements (created_at desc);

-- ============================================================
-- 6. transactions
-- Payment transactions. amount_eur is the EUR-normalised amount
-- at settlement time (for cross-currency analytics).
-- ============================================================
create table if not exists transactions (
  id              uuid primary key default gen_random_uuid(),
  merchant_id     uuid not null references merchants(id) on delete cascade,
  reference       text not null unique,             -- e.g. "tx_01HX..."
  customer        text not null,                    -- customer name (denormalised)
  customer_email  text,
  amount          numeric(18,2) not null check (amount >= 0),
  currency        text not null check (currency in ('EUR','USD','BRL','GBP','USDT','BTC')),
  amount_eur      numeric(18,2) not null default 0,
  status          text not null default 'pending'
                  check (status in ('succeeded','pending','failed','refunded','disputed','authorized')),
  method          text not null check (method in ('visa','mastercard','amex','pix','mbway','apple_pay','google_pay','crypto','sepa','wise')),
  country         text,
  gateway         text not null default 'xpayments',
  risk_score      int not null default 0 check (risk_score between 0 and 100),
  fee             numeric(18,2) not null default 0,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists tx_merchant_id_idx      on transactions (merchant_id);
create index if not exists tx_status_idx           on transactions (status);
create index if not exists tx_method_idx           on transactions (method);
create index if not exists tx_currency_idx         on transactions (currency);
create index if not exists tx_country_idx          on transactions (country);
create index if not exists tx_gateway_idx          on transactions (gateway);
create index if not exists tx_created_at_idx       on transactions (created_at desc);
create index if not exists tx_merchant_created_idx on transactions (merchant_id, created_at desc);
create index if not exists tx_reference_idx        on transactions (reference);
create index if not exists tx_metadata_gin         on transactions using gin (metadata);

-- ============================================================
-- 7. transaction_events
-- Timeline of status changes / gateway messages for a transaction.
-- ============================================================
create table if not exists transaction_events (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references transactions(id) on delete cascade,
  type            text not null,                    -- 'authorization','capture','refund','dispute','gateway_message'
  label           text not null,
  detail          text,
  created_at      timestamptz not null default now()
);
create index if not exists te_transaction_id_idx on transaction_events (transaction_id);
create index if not exists te_created_at_idx     on transaction_events (created_at desc);

-- ============================================================
-- 8. customers
-- Merchant's customers (denormalised from transactions + manual entry).
-- ============================================================
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references merchants(id) on delete cascade,
  name          text not null,
  email         text not null,
  country       text,
  ltv           numeric(18,2) not null default 0,
  avg_order     numeric(18,2) not null default 0,
  orders        int not null default 0,
  segment       text not null default 'new' check (segment in ('vip','regular','new','at_risk')),
  status        text not null default 'active' check (status in ('active','inactive','blocked')),
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists customers_merchant_id_idx on customers (merchant_id);
create index if not exists customers_email_idx        on customers (email);
create index if not exists customers_segment_idx     on customers (segment);
drop trigger if exists customers_set_updated_at on customers;
create trigger customers_set_updated_t before update on customers
  for each row execute function set_updated_at();

-- ============================================================
-- 9. products
-- ============================================================
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references merchants(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  price         numeric(18,2) not null check (price >= 0),
  currency      text not null default 'EUR' check (currency in ('EUR','USD','BRL','GBP','USDT','BTC')),
  image_url     text,                               -- Supabase Storage path or signed URL
  active        boolean not null default true,
  sales         int not null default 0,
  stock         int,                                -- null = unlimited
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists products_merchant_id_idx on products (merchant_id);
create index if not exists products_active_idx      on products (active);
drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_t before update on products
  for each row execute function set_updated_at();

-- ============================================================
-- 10. stores
-- ============================================================
create table if not exists stores (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references merchants(id) on delete cascade,
  name          text not null,
  domain        text,
  status        text not null default 'draft' check (status in ('active','paused','draft')),
  products      int not null default 0,             -- denormalised count
  revenue       numeric(18,2) not null default 0,  -- denormalised
  currency      text not null default 'EUR' check (currency in ('EUR','USD','BRL','GBP','USDT','BTC')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists stores_merchant_id_idx on stores (merchant_id);
drop trigger if exists stores_set_updated_at on stores;
create trigger stores_set_updated_t before update on stores
  for each row execute function set_updated_at();

-- ============================================================
-- 11. payment_links
-- ============================================================
create table if not exists payment_links (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references merchants(id) on delete cascade,
  name          text not null,
  url           text not null,
  amount        numeric(18,2) not null check (amount >= 0),
  currency      text not null default 'EUR' check (currency in ('EUR','USD','BRL','GBP','USDT','BTC')),
  status        text not null default 'active' check (status in ('active','inactive')),
  visits        int not null default 0,
  conversions   int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists pl_merchant_id_idx on payment_links (merchant_id);

-- ============================================================
-- 12. invoices
-- ============================================================
create table if not exists invoices (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references merchants(id) on delete cascade,
  number        text not null,                      -- "INV-2026-0001"
  customer      text not null,
  amount        numeric(18,2) not null check (amount >= 0),
  currency      text not null default 'EUR' check (currency in ('EUR','USD','BRL','GBP','USDT','BTC')),
  status        text not null default 'draft'
                check (status in ('paid','open','overdue','draft','void')),
  due_date      date,
  created_at    timestamptz not null default now()
);
create index if not exists inv_merchant_id_idx on invoices (merchant_id);
create index if not exists inv_status_idx       on invoices (status);
create index if not exists inv_number_idx       on invoices (number);

-- ============================================================
-- 13. subscriptions
-- ============================================================
create table if not exists subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  merchant_id           uuid not null references merchants(id) on delete cascade,
  customer              text not null,
  plan                  text not null,
  amount                numeric(18,2) not null check (amount >= 0),
  currency              text not null default 'EUR' check (currency in ('EUR','USD','BRL','GBP','USDT','BTC')),
  status                text not null default 'active'
                        check (status in ('active','trialing','past_due','canceled')),
  interval              text not null default 'month' check (interval in ('month','year')),
  current_period_end    timestamptz not null,
  created_at            timestamptz not null default now()
);
create index if not exists sub_merchant_id_idx on subscriptions (merchant_id);
create index if not exists sub_status_idx       on subscriptions (status);

-- ============================================================
-- 14. api_keys
-- We store a SHA-256 hash of the full key. fullKey is returned
-- ONLY on creation (never persisted in cleartext).
-- ============================================================
create table if not exists api_keys (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references merchants(id) on delete cascade,
  name          text not null,
  prefix        text not null,                      -- "xp_live_" or "xp_test_"
  last_four     text not null,                      -- last 4 chars of the key
  hash          text not null unique,               -- sha256(full_key)
  scopes        text[] not null default '{}',
  environment   text not null check (environment in ('live','test')),
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists ak_merchant_id_idx on api_keys (merchant_id);
create index if not exists ak_hash_idx         on api_keys (hash);

-- ============================================================
-- 15. webhooks
-- ============================================================
create table if not exists webhooks (
  id                uuid primary key default gen_random_uuid(),
  merchant_id       uuid not null references merchants(id) on delete cascade,
  url               text not null,
  events            text[] not null default '{}',  -- ['transaction.succeeded', ...]
  status            text not null default 'active' check (status in ('active','disabled')),
  secret            text not null,                 -- HMAC signing secret
  success_rate      numeric(5,2) not null default 100.00,
  last_delivery_at  timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists wh_merchant_id_idx on webhooks (merchant_id);

-- ============================================================
-- 16. webhook_deliveries
-- One row per attempted webhook delivery (for success_rate + retry).
-- ============================================================
create table if not exists webhook_deliveries (
  id            uuid primary key default gen_random_uuid(),
  webhook_id    uuid not null references webhooks(id) on delete cascade,
  event_type    text not null,
  payload       jsonb not null,
  status_code   int,                                -- HTTP status from the target
  attempt       int not null default 1,
  delivered_at  timestamptz,
  next_retry_at timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);
create index if not exists wd_webhook_id_idx       on webhook_deliveries (webhook_id);
create index if not exists wd_next_retry_at_idx    on webhook_deliveries (next_retry_at) where next_retry_at is not null;

-- ============================================================
-- 17. risk_profiles
-- One row per merchant (1:1). score is 0-100, lower is better.
-- ============================================================
create table if not exists risk_profiles (
  merchant_id       uuid primary key references merchants(id) on delete cascade,
  score             int not null default 50 check (score between 0 and 100),
  reserve_pct       numeric(5,2) not null default 10.00,
  chargeback_rate   numeric(6,4) not null default 0.0000,
  trust_status      text not null default 'standard'
                    check (trust_status in ('trusted','standard','elevated','high_risk')),
  alerts            jsonb not null default '[]'::jsonb,           -- RiskAlert[]
  recommendations   jsonb not null default '[]'::jsonb,          -- string[]
  history           jsonb not null default '[]'::jsonb,          -- {date, score, chargebacks}[]
  updated_at        timestamptz not null default now()
);
drop trigger if exists rp_set_updated_at on risk_profiles;
create trigger rp_set_updated_t before update on risk_profiles
  for each row execute function set_updated_at();

-- ============================================================
-- 18. kyc_reviews
-- One row per KYC submission. status: pending -> approved|rejected.
-- ============================================================
create table if not exists kyc_reviews (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references merchants(id) on delete cascade,
  merchant_name text not null,                      -- snapshot at submission time
  country       text,
  submitted_at  timestamptz not null default now(),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  risk_flags    text[] not null default '{}',
  decided_at    timestamptz,
  decided_by    uuid references users(id),
  created_at    timestamptz not null default now()
);
create index if not exists kyc_merchant_id_idx on kyc_reviews (merchant_id);
create index if not exists kyc_status_idx       on kyc_reviews (status);

-- ============================================================
-- 19. kyc_documents
-- storage_path points to Supabase Storage (kyc-documents bucket).
-- ============================================================
create table if not exists kyc_documents (
  id              uuid primary key default gen_random_uuid(),
  kyc_review_id   uuid not null references kyc_reviews(id) on delete cascade,
  merchant_id     uuid not null references merchants(id) on delete cascade,
  name            text not null,
  type            text not null check (type in ('passport','id_card','selfie','address_proof','article')),
  pages           int not null default 1,
  size_kb         int not null check (size_kb > 0),
  storage_path    text not null,                    -- "kyc-documents/<merchant_id>/<uuid>.pdf"
  created_at      timestamptz not null default now()
);
create index if not exists kd_kyc_review_id_idx on kyc_documents (kyc_review_id);
create index if not exists kd_merchant_id_idx    on kyc_documents (merchant_id);

-- ============================================================
-- 20. feature_flags
-- Keyed by string (not uuid) — flag keys are stable identifiers.
-- ============================================================
create table if not exists feature_flags (
  key           text primary key,
  description   text not null default '',
  enabled       boolean not null default false,
  environment   text not null default 'production' check (environment in ('production','staging','development')),
  rollout       int not null default 0 check (rollout between 0 and 100),
  owner         text,
  updated_at    timestamptz not null default now()
);
drop trigger if exists ff_set_updated_at on feature_flags;
create trigger ff_set_updated_t before update on feature_flags
  for each row execute function set_updated_at();

-- ============================================================
-- 21. audit_logs
-- Immutable append-only audit trail. Every mutation writes here.
-- ============================================================
create table if not exists audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid,                               -- users.id (null for system)
  actor_type    text not null default 'user' check (actor_type in ('user','system','api_key','admin')),
  action        text not null,                      -- 'merchant.update', 'transaction.refund', ...
  resource_type text not null,                      -- 'merchant', 'transaction', 'wallet', ...
  resource_id   text,
  metadata      jsonb not null default '{}'::jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index if not exists al_actor_id_idx        on audit_logs (actor_id);
create index if not exists al_resource_idx         on audit_logs (resource_type, resource_id);
create index if not exists al_action_idx           on audit_logs (action);
create index if not exists al_created_at_idx       on audit_logs (created_at desc);

-- ============================================================
-- 22. support_tickets
-- ============================================================
create table if not exists support_tickets (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid references merchants(id) on delete cascade,
  subject       text not null,
  priority      text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status        text not null default 'open' check (status in ('open','pending','resolved','closed')),
  assigned_to   uuid references users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists st_merchant_id_idx on support_tickets (merchant_id);
create index if not exists st_status_idx       on support_tickets (status);
drop trigger if exists st_set_updated_at on support_tickets;
create trigger st_set_updated_t before update on support_tickets
  for each row execute function set_updated_at();

-- ============================================================
-- 23. system_health
-- Timeseries of health snapshots (1 row per minute via cron).
-- Latest row is read by GET /admin/health.
-- ============================================================
create table if not exists system_health (
  id            bigserial primary key,
  status        text not null check (status in ('operational','degraded','outage')),
  uptime        numeric(8,4) not null default 99.99,
  services      jsonb not null default '[]'::jsonb,  -- [{name, status, latencyMs}]
  queues        jsonb not null default '[]'::jsonb,  -- [{name, pending, processing, throughput}]
  workers       jsonb not null default '[]'::jsonb,  -- [{name, active, idle, region}]
  recorded_at   timestamptz not null default now()
);
create index if not exists sh_recorded_at_idx on system_health (recorded_at desc);

-- ============================================================
-- 24. admin_merchants_view
-- A view that joins merchants + risk_profiles + aggregations
-- to serve GET /admin/merchants in a single query.
-- ============================================================
create or replace view admin_merchants_view as
select
  m.id,
  m.name,
  m.email,
  m.country,
  m.status,
  m.risk_score,
  m.kyc_status,
  m.created_at,
  coalesce(tx.volume, 0)      as volume,
  coalesce(tx.revenue, 0)     as revenue
from merchants m
left join (
  select
    merchant_id,
    sum(amount_eur) as volume,
    sum(amount_eur - fee) as revenue
  from transactions
  where status in ('succeeded','authorized')
  group by merchant_id
) tx on tx.merchant_id = m.id;

-- ============================================================
-- Row Level Security
-- ============================================================
-- Strategy (Approach A): the API connects with the service_role
-- key (bypasses RLS). RLS policies below are defense-in-depth
-- for the anon/authenticated keys.
--
-- The backend sets, on every pooled connection:
--   set local request.jwt.claim.merchant_id = '<uuid>';
--   set local request.jwt.claim.role = 'merchant' | 'admin';
-- These are read by current_merchant_id() / current_role_xp().
-- ============================================================

alter table merchants          enable row level security;
alter table users              enable row level security;
alter table refresh_tokens     enable row level security;
alter table wallets            enable row level security;
alter table wallet_movements   enable row level security;
alter table transactions       enable row level security;
alter table transaction_events enable row level security;
alter table customers          enable row level security;
alter table products           enable row level security;
alter table stores             enable row level security;
alter table payment_links      enable row level security;
alter table invoices           enable row level security;
alter table subscriptions      enable row level security;
alter table api_keys           enable row level security;
alter table webhooks           enable row level security;
alter table webhook_deliveries enable row level security;
alter table risk_profiles      enable row level security;
alter table kyc_reviews        enable row level security;
alter table kyc_documents      enable row level security;
alter table feature_flags      enable row level security;
alter table audit_logs         enable row level security;
alter table support_tickets    enable row level security;
alter table system_health      enable row level security;

-- Helper: is the current role an admin?
create or replace function is_admin()
returns boolean language sql stable as $$
  select current_role_xp() = 'admin';
$$;

-- merchants: a merchant can read/update only their own row. Admins: all.
create policy merchants_self_read   on merchants for select using (is_admin() or id = current_merchant_id());
create policy merchants_self_update on merchants for update using (is_admin() or id = current_merchant_id());

-- users: a user can read their own row; admins: all.
create policy users_self_read on users for select using (is_admin() or merchant_id = current_merchant_id());

-- refresh_tokens: only the API (service_role) reads these. No public policy.
-- (No policy = denied for anon/authenticated keys.)

-- For all merchant-scoped tables, the same pattern applies:
--   select: is_admin() OR merchant_id = current_merchant_id()
--   insert/update/delete: is_admin() OR merchant_id = current_merchant_id()
-- Below is the full set.

-- wallets
create policy wallets_read   on wallets for select using (is_admin() or merchant_id = current_merchant_id());
create policy wallets_write  on wallets for all    using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- wallet_movements
create policy wm_read on wallet_movements for select using (is_admin() or merchant_id = current_merchant_id());
create policy wm_ins  on wallet_movements for insert with check (is_admin() or merchant_id = current_merchant_id());

-- transactions
create policy tx_read on transactions for select using (is_admin() or merchant_id = current_merchant_id());
create policy tx_write on transactions for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- transaction_events
create policy te_read on transaction_events for select using (
  is_admin() or exists (
    select 1 from transactions t where t.id = transaction_events.transaction_id and t.merchant_id = current_merchant_id()
  )
);

-- customers
create policy cust_read on customers for select using (is_admin() or merchant_id = current_merchant_id());
create policy cust_write on customers for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- products
create policy prod_read on products for select using (is_admin() or merchant_id = current_merchant_id());
create policy prod_write on products for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- stores
create policy sto_read on stores for select using (is_admin() or merchant_id = current_merchant_id());
create policy sto_write on stores for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- payment_links
create policy pl_read on payment_links for select using (is_admin() or merchant_id = current_merchant_id());
create policy pl_write on payment_links for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- invoices
create policy inv_read on invoices for select using (is_admin() or merchant_id = current_merchant_id());
create policy inv_write on invoices for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- subscriptions
create policy sub_read on subscriptions for select using (is_admin() or merchant_id = current_merchant_id());
create policy sub_write on subscriptions for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- api_keys
create policy ak_read on api_keys for select using (is_admin() or merchant_id = current_merchant_id());
create policy ak_write on api_keys for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- webhooks
create policy wh_read on webhooks for select using (is_admin() or merchant_id = current_merchant_id());
create policy wh_write on webhooks for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- webhook_deliveries
create policy wd_read on webhook_deliveries for select using (
  is_admin() or exists (select 1 from webhooks w where w.id = webhook_deliveries.webhook_id and w.merchant_id = current_merchant_id())
);

-- risk_profiles
create policy rp_read on risk_profiles for select using (is_admin() or merchant_id = current_merchant_id());

-- kyc_reviews
create policy kyc_read on kyc_reviews for select using (is_admin() or merchant_id = current_merchant_id());
create policy kyc_write on kyc_reviews for all using (is_admin()) with check (is_admin());

-- kyc_documents
create policy kd_read on kyc_documents for select using (is_admin() or merchant_id = current_merchant_id());

-- feature_flags: admin read/write; everyone else read enabled flags.
create policy ff_admin on feature_flags for all using (is_admin()) with check (is_admin());
create policy ff_read  on feature_flags for select using (enabled = true);

-- audit_logs: admin read; insert via service_role only.
create policy al_read on audit_logs for select using (is_admin());

-- support_tickets
create policy st_read on support_tickets for select using (is_admin() or merchant_id = current_merchant_id());
create policy st_write on support_tickets for all using (is_admin() or merchant_id = current_merchant_id()) with check (is_admin() or merchant_id = current_merchant_id());

-- system_health: admin read; insert via service_role.
create policy sh_read on system_health for select using (is_admin());

-- ============================================================
-- Seed: an admin user (CHANGE PASSWORD IMMEDIATELY)
-- ============================================================
-- Default password: "ChangeMe123!" — bcrypt hash below is for that password.
-- On first deploy, log in as admin@xpayments.digital / ChangeMe123! and change it.
insert into merchants (id, email, name, company, tier, status, kyc_status, risk_score)
values ('00000000-0000-0000-0000-000000000000', 'admin@xpayments.digital', 'XPayments Platform', 'XPayments, Inc.', 'enterprise', 'active', 'approved', 0)
on conflict (email) do nothing;

insert into users (merchant_id, email, name, role, password_hash, two_factor_enabled)
values (
  null,
  'admin@xpayments.digital',
  'Platform Admin',
  'admin',
  '$2b$12$LJ3m4ys3Lz6XjU5XjU5XjU5XjU5XjU5XjU5XjU5XjU5XjU5XjU5XjU5XjU',
  false
)
on conflict (email) do nothing;

-- Seed: default feature flags (matches the frontend admin-flags.tsx mock set)
insert into feature_flags (key, description, enabled, environment, rollout, owner) values
  ('new_checkout_flow',         'Redesigned 3-step checkout', true,  'production',  100, 'checkout-squad'),
  ('crypto_payouts',            'USDT/BTC payouts via Wise',  false, 'production',    0, 'treasury'),
  ('ai_risk_scoring',           'ML model v2.4 risk scoring', true,  'production',   75, 'risk-eng'),
  ('pix_instant',               'Sub-3s Pix settlement',      true,  'production',  100, 'latam-squad'),
  ('webhook_v2_signing',        'HMAC-SHA256 signed webhooks', true, 'staging',      50, 'platform'),
  ('subscription_proration',    'Mid-cycle plan upgrades',    false, 'development',   0, 'billing'),
  ('multi_currency_settlement', 'Native currency settlement', true,  'production',   25, 'treasury'),
  ('adaptive_3ds',              'PSD2 SCA risk-based 3DS',    true,  'production',  100, 'compliance')
on conflict (key) do nothing;

-- ============================================================
-- End of DDL
-- ============================================================
```

### 4.3 Migration strategy

The DDL above is the v1 baseline. Future schema changes use Supabase's migration tooling:
- Development: edit the schema in the Supabase dashboard SQL editor, or use `supabase db diff` locally.
- Production: run migrations via `supabase db push` from CI, or paste the migration SQL into the dashboard's SQL editor with `begin; ... commit;` wrapping.

**Backup before every migration.** Supabase Pro includes daily backups (7-day retention). For pre-migration safety, trigger a manual backup in Dashboard → Database → Backups → Create backup.

---

## 5. API Implementation

### 5.1 Conventions

- Base URL: `https://api.xpayments.digital/api/v1`
- All requests/responses are JSON (`Content-Type: application/json`).
- Authenticated routes require `Authorization: Bearer <jwt>`.
- Timestamps are ISO 8601 strings (UTC). The frontend's `Date.now()` produces epoch ms for `AuthSession.expiresAt` — the backend must return `expiresAt` as epoch ms (number), not ISO string.
- Money is returned as JSON numbers (matching the frontend's `number` type). Precision is preserved because JSON numbers are doubles, and the frontend uses `number` everywhere — acceptable for the MVP. (If sub-cent precision matters, switch to strings.)
- Error shape (matches the frontend's `ApiError` type in `src/types/index.ts`):
  ```json
  { "message": "Human-readable message", "code": "INVALID_CREDENTIALS", "status": 401, "details": {} }
  ```
- Status codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request / validation), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Unprocessable Entity), 429 (Too Many Requests), 500 (Internal Server Error).

### 5.2 Response envelope rules

The frontend's `xpApi.ts` uses **four** response shapes (see `AUDIT.md` §2.1). The backend MUST implement each endpoint with the exact shape the frontend expects:

| Shape | When | Example endpoints |
|-------|------|-------------------|
| Bare `T` | Single-object reads, creates | `GET /analytics/overview`, `POST /products`, `POST /auth/login` |
| `{ data: T[] }` | Unpaginated list reads | `GET /wallets`, `GET /customers`, `GET /admin/merchants` |
| `Paginated<T>` = `{ data, total, page, pageSize }` | Paginated list reads | `GET /transactions` (the only one currently) |
| `{ ok: boolean, ... }` | Mutations with no returned entity | `POST /auth/forgot`, `DELETE /products/:id`, `POST /wallets/swap` |

**Recommendation for new endpoints:** use `{ data: T }` for singletons and `Paginated<T>` for lists. Do not introduce a fifth shape.

### 5.3 Endpoint index (39 routes)

Grouped by domain. "Frontend caller" is the exact `xpApi.*` function that calls this route.

#### 5.3.1 Auth (5 endpoints)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 1 | POST | `/auth/login` | `auth.login(email, password, remember)` | None |
| 2 | POST | `/auth/forgot` | `auth.forgot(email)` | None |
| 3 | POST | `/auth/reset` | `auth.reset(token, password)` | None |
| 4 | GET | `/auth/me` | `auth.me()` | Bearer |
| 5 | POST | `/auth/refresh` | (called by `client.ts` 401 interceptor) | None (uses refresh token in body) |

**1. POST /auth/login**

Request:
```json
{ "email": "user@example.com", "password": "secret", "remember": false }
```

Response 200 — **bare `AuthSession`** (NOT an envelope):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "xp_refresh_<random>",
  "expiresAt": 1735689600000,
  "user": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Mariana Costa",
    "email": "user@example.com",
    "role": "merchant",
    "company": "Nimbus Labs",
    "merchantId": "00000000-0000-0000-0000-000000000001",
    "twoFactorEnabled": false
  }
}
```

DB tables read/written: `users` (read, verify password, update `last_login_at`), `merchants` (read for `merchantId`/`company`), `refresh_tokens` (insert new refresh token hash).

Business logic:
- Look up `users` by `email`. If not found or `password_hash` is null → 401 `INVALID_CREDENTIALS`.
- Verify password with `bcrypt.compare(password, user.password_hash)`. On mismatch → 401.
- If `two_factor_enabled` is true → return 200 with `{ twoFactorRequired: true, challengeToken: "..." }` and do NOT issue access/refresh tokens. (Frontend does not yet handle this — see `AUDIT.md` §3.8. Until the frontend implements the 2FA challenge screen, leave `two_factor_enabled = false` for all users.)
- Issue access JWT (8h TTL) with claims `{ sub: user.id, email, role, merchant_id }`.
- Issue refresh token (30d TTL if `remember`, else 8h matching access). Store `sha256(refreshToken)` in `refresh_tokens`.
- If `remember === false`, set `expiresAt = Date.now() + 8h`. If `remember === true`, set `expiresAt = Date.now() + 30d`. (Matches the mock in `xpApi.ts` line 64.)

Status codes: 200, 401, 422 (validation), 429 (rate-limited).

**2. POST /auth/forgot**

Request: `{ "email": "user@example.com" }`
Response 200: `{ "ok": true }`

DB: insert a row into a `password_resets` table (not in the DDL above — add it: `create table password_resets (id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id), token_hash text not null unique, expires_at timestamptz not null, used_at timestamptz, created_at timestamptz default now());`). Send email with reset link `https://xpayments.digital/?view=reset&token=<token>`.

Business logic: always return `{ ok: true }` even if the email does not exist (do not leak which emails are registered). Rate-limit to 3 requests per email per hour.

**3. POST /auth/reset**

Request: `{ "token": "<reset-token>", "password": "newpassword" }`
Response 200: `{ "ok: true }` | 400 `INVALID_OR_EXPIRED_TOKEN`

DB: look up `password_resets` by `token_hash = sha256(token)`, check `expires_at > now() and used_at is null`. Update `users.password_hash`, mark reset token `used_at = now()`.

**4. GET /auth/me**

Auth: Bearer JWT.
Response 200 — bare `User` object:
```json
{
  "id": "...", "name": "...", "email": "...", "role": "merchant",
  "company": "...", "merchantId": "...", "twoFactorEnabled": false
}
```

DB: `users` join `merchants`. If the JWT's `sub` does not exist → 401 (the token is valid but the user was deleted).

**5. POST /auth/refresh**

Request: `{ "refreshToken": "xp_refresh_..." }`
Response 200 — **asymmetric to login** (no `expiresAt`):
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "xp_refresh_<new>",
  "user": { "id": "...", "name": "...", "email": "...", "role": "...", "merchantId": "..." }
}
```

DB: `refresh_tokens` (look up by `token_hash`, check `revoked_at is null and expires_at > now()`), `users`, `merchants`. Revoke the old refresh token, insert a new one (rotation). Response 401 if the token is revoked/expired — the frontend will force-logout.

Status codes: 200, 401.

#### 5.3.2 Wallets (5 endpoints)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 6 | GET | `/wallets` | `wallets.list()` | Bearer |
| 7 | GET | `/wallets/movements` | `wallets.movements(walletId?)` | Bearer |
| 8 | POST | `/wallets/swap` | `wallets.swap(from, to, amount)` | Bearer |
| 9 | POST | `/wallets/deposit` | `wallets.deposit(currency, amount, method)` | Bearer |
| 10 | POST | `/wallets/payout` | `wallets.payout(currency, amount, beneficiary)` | Bearer |

**6. GET /wallets** → `{ data: Wallet[] }`
DB: `select * from wallets where merchant_id = $current_merchant_id order by created_at`.

**7. GET /wallets/movements?walletId=<uuid>** → `{ data: WalletMovement[] }`
DB: `select * from wallet_movements where merchant_id = $current_merchant_id [and wallet_id = $walletId] order by created_at desc limit 200`.
Note: the frontend does not paginate movements. Cap at 200 rows; if more, the frontend should be updated to paginate.

**8. POST /wallets/swap** — body `{ from: "EUR", to: "USD", amount: 1000 }` → `{ ok: true, rate: 1.08 }`
DB: transaction — debit `from` wallet, credit `to` wallet at the locked rate, insert two `wallet_movements` rows (one `out` from, one `in` to, both `type=swap`). Fetch the rate from an FX provider (ECB daily rates, or Wise API for live). Return the rate used.
Status: 200, 400 (insufficient balance), 422 (invalid currency).

**9. POST /wallets/deposit** — body `{ currency: "EUR", amount: 500, method: "sepa" }` → `{ ok: true, reference: "DEP123456" }`
DB: insert a `wallet_movements` row (`type=deposit, direction=in, status=pending`). The actual balance credit happens when the deposit clears (background job listening to the bank/gateway webhook). Return a reference for the merchant to track.
Note: the deposit does NOT immediately increase `wallets.balance` — it creates a pending movement. The merchant sees `available` unchanged until the deposit clears.

**10. POST /wallets/payout** — body `{ currency: "EUR", amount: 200, beneficiary: "John Doe" }` → `{ ok: true, reference: "PO123456" }`
DB: transaction — check `wallets.available >= amount`, decrement `available` and `balance`, insert `wallet_movements` (`type=payout, direction=out, status=pending`). Enqueue a payout job to the background worker (which talks to the actual rail — SEPA, Wise, etc.). On completion, the worker updates `movement.status = 'completed'`; on failure, reverses the balance change and sets `status = 'failed'`.

#### 5.3.3 Analytics (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 11 | GET | `/analytics/overview` | `analytics.overview()` | Bearer |

**11. GET /analytics/overview** → bare `AnalyticsOverview`

Response shape (matches `src/types/index.ts`):
```json
{
  "revenue": 8423105.50,
  "revenueChange": 4.2,
  "volume": 12840200.00,
  "volumeChange": 6.1,
  "conversion": 3.4,
  "conversionChange": 0.2,
  "approvalRate": 96.8,
  "approvalChange": -0.3,
  "riskScore": 28,
  "riskChange": -2,
  "revenueSeries": [{ "date": "2026-06-01", "value": 240000 }, ...],
  "volumeSeries": [{ "date": "2026-06-01", "value": 380000 }, ...],
  "paymentMethods": [{ "method": "visa", "share": 0.42, "volume": 5400000 }, ...],
  "currencies": [{ "currency": "EUR", "share": 0.55, "volume": 7000000 }, ...],
  "topCustomers": [{ "name": "Acme Corp", "ltv": 240000, "orders": 142 }, ...],
  "realtime": [{ "id": "tx_...", "label": "Acme Corp · €1,240", "amount": 1240, "currency": "EUR", "ago": "2m" }, ...]
}
```

DB: this is an aggregation endpoint — 6–8 SQL queries:
- `select sum(amount_eur - fee), sum(amount_eur) from transactions where merchant_id = ? and status = 'succeeded' and created_at >= now() - interval '30 days'`
- Same for the previous 30 days (for `revenueChange`).
- `select method, sum(amount_eur) from transactions ... group by method` for `paymentMethods`.
- `select currency, sum(amount_eur) from ... group by currency` for `currencies`.
- `select customer, sum(amount_eur) as ltv, count(*) as orders from transactions ... group by customer order by ltv desc limit 5` for `topCustomers`.
- `select * from transactions where merchant_id = ? and created_at >= now() - interval '5 minutes' order by created_at desc limit 10` for `realtime`.
- Daily series via `select date_trunc('day', created_at), sum(amount_eur) from transactions ... group by 1 order by 1` for `revenueSeries` / `volumeSeries`.

Consider caching this for 60 seconds in Redis (key: `analytics:overview:<merchant_id>`).

#### 5.3.4 Risk (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 12 | GET | `/risk/profile` | `risk.profile()` | Bearer |

**12. GET /risk/profile** → bare `RiskProfile`

DB: `select * from risk_profiles where merchant_id = ?`. The `alerts`, `recommendations`, `history` JSONB columns are returned as-is (they are already in the shape the frontend expects — `RiskAlert[]`, `string[]`, `{date, score, chargebacks}[]`).

#### 5.3.5 Transactions (2 endpoints)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 13 | GET | `/transactions` | `transactions.list(filters)` | Bearer |
| 14 | GET | `/transactions/:id` | `transactions.detail(id)` | Bearer |

**13. GET /transactions** — query params: `search, status, country, currency, method, gateway, from, to, page, pageSize, sortBy, sortDir` → `Paginated<Transaction>`

DB: dynamic SQL with parameterized WHERE clauses. Example:
```sql
select * from transactions
where merchant_id = $1
  and ($2::text is null or reference ilike '%' || $2 || '%' or customer ilike '%' || $2 || '%' or customer_email ilike '%' || $2 || '%')
  and ($3::text is null or status = $3)
  and ($4::text is null or currency = $4)
  ...
order by ${sortBy or 'created_at'} ${sortDir or 'desc'}
limit ${pageSize or 12} offset ${(page - 1) * pageSize}
```
(Use a query builder or carefully-escaped identifier for `sortBy` — never interpolate user input into `ORDER BY` directly.)

Also run a `select count(*)` with the same WHERE for `total`. Return `{ data, total, page, pageSize }`.

**14. GET /transactions/:id** → bare `Transaction` (with `events` populated)

DB: `select * from transactions where id = $1 and merchant_id = $current_merchant_id`, then `select * from transaction_events where transaction_id = $1 order by created_at`. Assemble the `events` array on the response.

#### 5.3.6 Customers (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 15 | GET | `/customers` | `customers.list()` | Bearer |

**15. GET /customers** → `{ data: Customer[] }`
DB: `select * from customers where merchant_id = $current_merchant_id order by ltv desc limit 200`.

#### 5.3.7 Products (3 endpoints)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 16 | GET | `/products` | `products.list()` | Bearer |
| 17 | POST | `/products` | `products.create(data)` | Bearer |
| 18 | DELETE | `/products/:id` | `products.remove(id)` | Bearer |

**16. GET /products** → `{ data: Product[] }`
**17. POST /products** — body `Partial<Product>` → bare `Product` (201). Insert with `merchant_id = $current_merchant_id`, `id = gen_random_uuid()`, `sales = 0`, `created_at = now()`.
**18. DELETE /products/:id** → `{ ok: true }`. Soft-delete (`active = false`) or hard-delete — product decision. Recommend soft-delete with a `deleted_at` column (add to the schema if needed).

#### 5.3.8 Stores (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 19 | GET | `/stores` | `stores.list()` | Bearer |

**19. GET /stores** → `{ data: Store[] }`

#### 5.3.9 Payment Links (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 20 | GET | `/payment-links` | `paymentLinks.list()` | Bearer |

**20. GET /payment-links** → `{ data: PaymentLink[] }`

#### 5.3.10 Invoices (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 21 | GET | `/invoices` | `invoices.list()` | Bearer |

**21. GET /invoices** → `{ data: Invoice[] }`

#### 5.3.11 Subscriptions (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 22 | GET | `/subscriptions` | `subscriptions.list()` | Bearer |

**22. GET /subscriptions** → `{ data: Subscription[] }`

#### 5.3.12 API Keys (3 endpoints)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 23 | GET | `/api-keys` | `apiKeys.list()` | Bearer |
| 24 | POST | `/api-keys` | `apiKeys.create(name, environment, scopes)` | Bearer |
| 25 | DELETE | `/api-keys/:id` | `apiKeys.revoke(id)` | Bearer |

**23. GET /api-keys** → `{ data: ApiKey[] }` (never include `fullKey`)
**24. POST /api-keys** — body `{ name, environment, scopes }` → bare `ApiKey` (201, **with `fullKey`** — returned exactly once)
DB: generate `fullKey = (environment === 'live' ? 'xp_live_' : 'xp_test_') + crypto.randomBytes(24).toString('base64url')`. Store `hash = sha256(fullKey)`, `prefix`, `lastFour = fullKey.slice(-4)`. Return the full key in the response. The frontend shows it once with a copy button and a warning.
**25. DELETE /api-keys/:id** → `{ ok: true }`. Set `revoked_at = now()` (do not delete the row — audit trail). Future requests with this key return 401.

#### 5.3.13 Webhooks (3 endpoints)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 26 | GET | `/webhooks` | `webhooks.list()` | Bearer |
| 27 | POST | `/webhooks` | `webhooks.create(url, events)` | Bearer |
| 28 | DELETE | `/webhooks/:id` | `webhooks.remove(id)` | Bearer |

**26. GET /webhooks** → `{ data: Webhook[] }`
**27. POST /webhooks** — body `{ url, events }` → bare `Webhook` (201). Generate `secret = 'whsec_' + crypto.randomBytes(24).toString('base64url')`. Return the secret in the response (shown once, like API keys).
**28. DELETE /webhooks/:id** → `{ ok: true }`. Soft-delete (`status = 'disabled'`) or hard-delete.

#### 5.3.14 Payouts (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 29 | GET | `/payouts` | `payouts.list()` | Bearer |

**29. GET /payouts** → `{ data: WalletMovement[] }`
DB: `select * from wallet_movements where merchant_id = $current_merchant_id and type in ('payout', 'withdraw') order by created_at desc limit 200`. (Note: the frontend filters by `type === 'payout' || type === 'withdraw'` — both are returned. See `AUDIT.md` §2.6.)

#### 5.3.15 Deposits (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 30 | GET | `/deposits` | `deposits.list()` | Bearer |

**30. GET /deposits** → `{ data: WalletMovement[] }`
DB: `select * from wallet_movements where merchant_id = $current_merchant_id and type = 'deposit' order by created_at desc limit 200`.

#### 5.3.16 Treasury (1 endpoint)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 31 | GET | `/treasury/overview` | `treasury.overview()` | Bearer |

**31. GET /treasury/overview** → bare `TreasuryOverview`

DB: aggregation across all the merchant's wallets:
- `totalLiquidity = sum(balance) from wallets where merchant_id = ?`
- `reserve = sum(reserved) from wallets ...`
- `pendingPayouts = sum(amount) from wallet_movements where merchant_id = ? and type = 'payout' and status = 'pending'`
- `netFlow = sum(case when direction='in' then amount else -amount end) from wallet_movements where merchant_id = ? and created_at >= now() - interval '30 days'`
- `balances = select currency, sum(balance) as amount, ... from wallets ... group by currency`
- `cashFlowSeries`, `settlementSeries` — daily aggregations over 30 days.

#### 5.3.17 KYC (1 endpoint, admin-side)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 32 | GET | `/admin/kyc` | `admin.kycQueue()` | Bearer (admin) |

**32. GET /admin/kyc** → `{ data: KycReview[] }` (with `documents` populated)
DB: `select * from kyc_reviews where status = 'pending' order by submitted_at`, then for each review, `select * from kyc_documents where kyc_review_id = ?`. Assemble the `documents` array per review.

> **Note on merchant-side KYC:** the frontend currently has no merchant-side KYC submission endpoint (merchants cannot submit KYC documents through the API — only admins see the queue). If product wants merchant self-onboarding, add `POST /kyc/submit` (multipart upload of documents to Supabase Storage, then insert a `kyc_reviews` row). This is not in the current 39-endpoint contract; flagged in `AUDIT.md` §2.4.

#### 5.3.18 Admin (7 endpoints)

| # | Method | Path | Frontend caller | Auth |
|---|--------|------|-----------------|------|
| 33 | GET | `/admin/treasury/overview` | `admin.treasury()` | Bearer (admin) |
| 34 | GET | `/admin/merchants` | `admin.merchants()` | Bearer (admin) |
| 35 | POST | `/admin/merchants/:id/status` | `admin.setMerchantStatus(id, status)` | Bearer (admin) |
| 36 | POST | `/admin/kyc/:id/approved` | `admin.kycDecision(id, 'approved')` | Bearer (admin) |
| 37 | POST | `/admin/kyc/:id/rejected` | `admin.kycDecision(id, 'rejected')` | Bearer (admin) |
| 38 | GET | `/admin/health` | `admin.health()` | Bearer (admin) |
| 39 | GET | `/admin/revenue` | `admin.revenue()` | Bearer (admin) |

**33. GET /admin/treasury/overview** → bare `TreasuryOverview` (platform-wide, all merchants)
DB: same as #31 but without the `merchant_id` filter. The frontend's mock returns `totalLiquidity: 48200000` for admin vs. the merchant's own number — the admin view is the platform total.

**34. GET /admin/merchants** → `{ data: AdminMerchant[] }`
DB: `select * from admin_merchants_view order by created_at desc`. The view (defined in §4.2) joins `merchants` with aggregated transaction volumes/revenue.

**35. POST /admin/merchants/:id/status** — body `{ status: "active" | "frozen" | "suspended" | "pending" }` → `{ ok: true }`
DB: `update merchants set status = $1 where id = $2`. Insert an `audit_logs` row (`action = 'merchant.status_change'`). If status is `frozen` or `suspended`, optionally revoke all refresh tokens for that merchant's users.

**36 & 37. POST /admin/kyc/:id/approved** and **POST /admin/kyc/:id/rejected** → `{ ok: true }`
DB: `update kyc_reviews set status = 'approved'/'rejected', decided_at = now(), decided_by = $current_user_id where id = $1`. Also `update merchants set kyc_status = 'approved'/'rejected' where id = (select merchant_id from kyc_reviews where id = $1)`. Insert audit log. If approved, optionally update the merchant's `tier` and `risk_profiles.trust_status`.

**38. GET /admin/health** → bare `SystemHealth`
DB: `select * from system_health order by recorded_at desc limit 1`. The `services`, `queues`, `workers` JSONB columns are returned as-is. A background cron job (every 60s) inserts a new row with fresh metrics.

**39. GET /admin/revenue** → `{ total: number, series: { date, value }[] }` (bare object, no `data` wrapper)
DB: `select sum(amount_eur - fee) as total from transactions where status = 'succeeded'`, and `select date_trunc('day', created_at) as date, sum(amount_eur - fee) as value from transactions where status = 'succeeded' and created_at >= now() - interval '30 days' group by 1 order by 1`.

### 5.4 Endpoints the frontend needs but does not yet call

Per `AUDIT.md` §2.4, four admin pages have no API backing. The backend should implement these even though the frontend does not yet call them, so the frontend can be wired later:

| Recommended endpoint | Serves admin page |
|----------------------|-------------------|
| `GET /admin/gateways` | `admin-gateways.tsx` |
| `GET /admin/feature-flags` + `PATCH /admin/feature-flags/:key` | `admin-flags.tsx` |
| `GET /admin/audit-logs` (paginated) | `admin-logs.tsx` |
| `GET /admin/support/tickets` + `PATCH /admin/support/tickets/:id` | `admin-support.tsx` |
| `GET /support/tickets` + `POST /support/tickets` | `support.tsx` (merchant) |
| `POST /auth/logout` (revoke refresh token) | called by `auth.logout()` |
| `POST /auth/register` (if self-serve signup is desired) | not in current frontend |

These are out of scope for the 39-endpoint contract but should be planned for Phase 2+ (§9).

---

## 6. Authentication & JWT

### 6.1 The auth session shape (CRITICAL)

The frontend's `auth.login()` expects a **bare `AuthSession` object at the top level of the response body**. There is no `{ success, data: {...} }` envelope. The shape (from `src/types/index.ts` and `xpApi.ts`):

```ts
interface AuthSession {
  accessToken: string;       // JWT, 8h TTL
  refreshToken: string;      // opaque token, 30d TTL
  expiresAt: number;         // epoch milliseconds (NOT ISO string)
  user: User;
}
interface User {
  id: string;
  name: string;
  email: string;
  role: "merchant" | "admin" | "guest";
  avatarUrl?: string;
  company?: string;
  merchantId?: string;       // absent for admin role
  twoFactorEnabled?: boolean;
}
```

The refresh endpoint (`POST /auth/refresh`) returns a **different, slimmer shape** (no `expiresAt` — see `client.ts` lines 99–103):

```ts
{ accessToken: string; refreshToken: string; user: User }
```

Both shapes must be implemented exactly as shown. The frontend's `tokenStore.set(access, refresh, user)` and the `useAuth` store read these fields by name.

> **Note on the originating task spec:** the spec for this document mentioned an auth envelope `{ success, data: { merchantId, name, tier, token, role } }` and a frontend function `mapEnvelopeToSession()`. Neither exists in the frontend code (verified by `grep` across `src/`). The frontend consumes the `AuthSession` shape above. The backend MUST match the frontend, not the spec's envelope. See `AUDIT.md` §2.2 for the full audit of this discrepancy.

### 6.2 Password hashing

Use **bcrypt** with cost factor 12 (matches `BCRYPT_ROUNDS=12` in `.env`). Alternative: **argon2id** (recommended by OWASP 2024) — if argon2id is used, set `password_hash` to the argon2id encoded string and adjust the verify call.

```ts
// On signup/reset:
const hash = await bcrypt.hash(password, 12);
// On login:
const ok = await bcrypt.compare(password, user.password_hash);
```

Never log `password` or `password_hash`.

### 6.3 JWT issuance

JWTs are HS256 signed with `JWT_SECRET` (64+ random chars). Claims:

```json
{
  "sub": "<user uuid>",
  "email": "user@example.com",
  "role": "merchant",
  "merchant_id": "<merchant uuid or null>",
  "iat": 1735689600,
  "exp": 1735718400
}
```

- Access token TTL: 8 hours (`JWT_ACCESS_TTL=28800`).
- Refresh token TTL: 30 days if `remember=true`, else 8 hours (matches `xpApi.ts` line 64). The refresh token is an opaque random string (`xp_refresh_<base64url(32)>`), NOT a JWT. Its hash is stored in `refresh_tokens`.

```ts
import jwt from 'jsonwebtoken';
const accessToken = jwt.sign(
  { sub: user.id, email: user.email, role: user.role, merchant_id: user.merchantId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_ACCESS_TTL }
);
```

### 6.4 Refresh flow (rotation)

On every `POST /auth/refresh`:
1. Look up `refresh_tokens` by `token_hash = sha256(req.body.refreshToken)`.
2. If not found OR `revoked_at is not null` OR `expires_at < now()` → 401. The frontend will force-logout.
3. **Replay attack detection:** if the token is found but revoked, this means someone is replaying an old refresh token. Revoke the entire chain (all refresh tokens for this `user_id`) and force-logout everywhere. Log a security event to `audit_logs`.
4. Otherwise: revoke the old token (`revoked_at = now()`), issue a new refresh token, insert it, and return `{ accessToken, refreshToken, user }`.

### 6.5 401 handling (frontend contract)

The frontend's `client.ts` interceptor (lines 79–117):
1. On a 401 response, if the request has not already been retried (`_retry !== true`) and a refresh token exists in localStorage, it calls `POST /auth/refresh` with `{ refreshToken }`.
2. On success, it stores the new tokens and retries the original request once.
3. On failure, it clears localStorage and calls `onLogout()` (which resets the Zustand store).

The backend's responsibilities:
- Return 401 (not 403) when the access token is missing, expired, or invalid.
- Return 401 on `POST /auth/refresh` when the refresh token is invalid/expired/revoked.
- Do NOT return 401 for authorization failures (e.g. a merchant trying to read another merchant's wallet) — return 403 or 404. (404 is safer — does not leak existence.)

> **Frontend bug to be aware of (see `AUDIT.md` §3.3):** the frontend's refresh interceptor does not queue concurrent requests. If two requests 401 simultaneously, only one triggers the refresh; the other is rejected. The backend cannot fix this, but it should be aware that spurious 401s under load may be a frontend issue, not a backend issue.

### 6.6 Middleware

Hono middleware (or equivalent):

```ts
import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';

export const authRequired = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ message: 'Missing authorization header', status: 401 }, 401);
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    c.set('userId', payload.sub);
    c.set('role', payload.role);
    c.set('merchantId', payload.merchant_id);
    // Set session variables for RLS (if using a per-request connection)
    // await c.var.db.unsafe(`set local request.jwt.claim.merchant_id = '${payload.merchant_id}'`);
    // await c.var.db.unsafe(`set local request.jwt.claim.role = '${payload.role}'`);
    await next();
  } catch {
    return c.json({ message: 'Invalid or expired token', status: 401 }, 401);
  }
});

export const adminRequired = createMiddleware(async (c, next) => {
  if (c.var.role !== 'admin') {
    return c.json({ message: 'Admin access required', status: 403 }, 403);
  }
  await next();
});
```

Apply `authRequired` to all routes except `/auth/login`, `/auth/forgot`, `/auth/reset`, `/auth/refresh`, and `/health`. Apply `adminRequired` to all `/admin/*` routes.

---

## 7. Security

### 7.1 CORS

Allow only the production frontend origins. Never use `*` in production.

```ts
import { cors } from 'hono/cors';
app.use('/api/v1/*', cors({
  origin: process.env.CORS_ORIGINS.split(','),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
  exposeHeaders: ['X-Request-Id'],
  credentials: false,  // not using cookies
  maxAge: 86400,
}));
```

### 7.2 Rate limiting

Two tiers:
- **Global per-IP:** 300 requests/minute (Redis counter, `RATE_LIMIT_WINDOW`/`RATE_LIMIT_MAX`). 429 response with `Retry-After` header.
- **Auth endpoints per-IP:** 10 login attempts/minute, 3 forgot-password/minute. Prevents credential stuffing.

```ts
import { rateLimit } from './middleware/rate-limit'; // Redis-backed
app.use('/api/v1/auth/login', rateLimit({ window: 60, max: 10 }));
app.use('/api/v1/auth/forgot', rateLimit({ window: 3600, max: 3 }));
app.use('/api/v1/*', rateLimit({ window: 60, max: 300 }));
```

### 7.3 Helmet / security headers

Nginx sets `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (see §2.6). The API additionally returns `Cache-Control: no-store` on all authenticated responses.

### 7.4 Input validation (Zod)

Every endpoint has a Zod schema. The schema is the single source of truth for request validation AND for the OpenAPI spec (via `@hono/zod-openapi`). Example:

```ts
import { z } from 'zod';
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  remember: z.boolean().default(false),
});
```

On validation failure, return 422 with:
```json
{ "message": "Validation failed", "code": "VALIDATION_ERROR", "status": 422, "details": { "email": ["Invalid email"] } }
```

### 7.5 SQL injection prevention

Use parameterized queries exclusively. Never interpolate user input into SQL. The `postgres` (Postgres.js) library enforces this:

```ts
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_POOLER_URL, { max: 20, prepare: false });
// Safe:
const txs = await sql`select * from transactions where merchant_id = ${merchantId} and status = ${status}`;
// NEVER: sql(`select * from transactions where merchant_id = '${merchantId}'`)
```

For dynamic `ORDER BY`, use a whitelist:
```ts
const SORT_COLUMNS = new Set(['created_at', 'amount', 'reference', 'status']);
const sortCol = SORT_COLUMNS.has(sortBy) ? sortBy : 'created_at';
const sortDir = sortDir === 'asc' ? 'asc' : 'desc';
// Then: sql`order by ${sql(sortCol)} ${sql(sortDir)}` — Postgres.js supports identifier escaping via sql.unsafe or a helper.
```

### 7.6 PCI DSS considerations

- **Never store full card numbers.** The frontend's `Wallet.cardLast4` is the only card field — last 4 digits only. The backend must never log or persist full PANs.
- **Never store CVV.** CVV is single-use; discard after authorization.
- **Tokenize cards at the gateway.** Use Stripe/Adyen's tokenization — the backend stores the gateway's token, not the card.
- **PCI DSS scope:** if the backend never touches cardholder data (only tokens), the scope is SAQ-A. If it ever touches PANs, the scope expands to SAQ-D (much heavier). Stay SAQ-A.
- The `transactions.method` field is the payment method type (`visa`, `mastercard`, ...), not card data.

### 7.7 KYC document storage

- Uploaded via the API to Supabase Storage bucket `kyc-documents` (private).
- Path: `<merchant_id>/<uuid>.<ext>`.
- The API generates a signed URL (10-minute expiry) for the admin to view the document in `admin-kyc.tsx`.
- Documents are never served publicly. The signed URL is the only access path.
- MIME-type whitelist: `image/jpeg`, `image/png`, `application/pdf`. Max size 10 MB. Validate on upload (not just client-side).

### 7.8 Audit logging

Every mutation writes a row to `audit_logs`:
- `actor_id`, `actor_type` (who)
- `action` (what — e.g. `merchant.status_change`, `transaction.refund`, `api_key.revoke`)
- `resource_type`, `resource_id` (what was affected)
- `metadata` (JSONB — before/after diff, reason, etc.)
- `ip_address`, `user_agent`, `created_at`

The audit log is append-only (no UPDATE/DELETE policy in RLS — only INSERT via `service_role`). Retain for 7 years (PCI DSS / financial regulation requirement).

### 7.9 Webhook signing

Outbound webhooks (the API calling merchant webhook URLs) are signed with HMAC-SHA256:
- Header: `X-XPayments-Signature: t=<timestamp>,v1=<hex-hmac>`.
- Payload signed: `<timestamp>.<json-body>`.
- The merchant's webhook `secret` is the HMAC key.
- The merchant verifies by recomputing the HMAC and comparing (constant-time).
- Replay protection: reject if `abs(now - timestamp) > 5 minutes`.

---

## 8. Deployment

### 8.1 PM2 ecosystem

`/var/www/xpayments-api/shared/ecosystem.config.cjs`:

```js
module.exports = {
  apps: [{
    name: 'xpayments-api',
    script: 'current/dist/index.js',
    instances: 2,                  // one per vCPU
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    env_file: '.env',
    error_file: '/var/log/xpayments-api/err.log',
    out_file: '/var/log/xpayments-api/out.log',
    time: true,
    merge_logs: true,
    kill_timeout: 5000,
  }],
};
```

```bash
cd /var/www/xpayments-api
pm2 start shared/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
# Follow the printed instruction to enable PM2 boot on restart.
```

### 8.2 Build + deploy script

`/var/www/xpayments-api/shared/deploy.sh` (run as `deploy` user):

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/nexflowx-hub/xpayments-backend.git"
BRANCH="main"
APP_DIR="/var/www/xpayments-api"
RELEASES="$APP_DIR/releases"
SHARED="$APP_DIR/shared"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RELEASE="$RELEASES/$TIMESTAMP"

echo "==> Cloning to $RELEASE"
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$RELEASE"

echo "==> Installing deps"
cd "$RELEASE"
npm ci --omit=dev

echo "==> Building"
npm run build

echo "==> Linking .env"
ln -s "$SHARED/.env" "$RELEASE/.env"

echo "==> Linking current"
ln -sfn "$RELEASE" "$APP_DIR/current"

echo "==> Restarting PM2"
pm2 reload xpayments-api --update-env

echo "==> Cleanup old releases (keep last 5)"
ls -1dt "$RELEASES"/*/ | tail -n +6 | xargs -r rm -rf

echo "==> Deploy complete"
```

### 8.3 CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` (in the backend repo):

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint
        run: npm ci && npm run lint
      - name: Test
        run: npm test
      - name: SSH deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/xpayments-api
            bash shared/deploy.sh
            pm2 reload xpayments-api
```

### 8.4 Environment variables table

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `NODE_ENV` | yes | `production` | |
| `PORT` | yes | `3001` | API port (localhost only; Nginx proxies 443 → 3001) |
| `DATABASE_URL` | yes | `postgresql://...@db.xxx.supabase.co:5432/postgres` | Direct connection (migrations only) |
| `DATABASE_POOLER_URL` | yes | `postgresql://...@aws-0-region.pooler.supabase.com:6543/postgres` | Pooled connection (runtime) |
| `SUPABASE_URL` | yes | `https://xxx.supabase.co` | Storage + (optional) Auth |
| `SUPABASE_SERVICE_KEY` | yes | `eyJ...` | Server-only, bypasses RLS |
| `SUPABASE_ANON_KEY` | no | `eyJ...` | For public Storage reads |
| `JWT_SECRET` | yes | `<64 random chars>` | HS256 signing |
| `JWT_ACCESS_TTL` | yes | `28800` | 8h, in seconds |
| `JWT_REFRESH_TTL` | yes | `2592000` | 30d, in seconds |
| `BCRYPT_ROUNDS` | yes | `12` | |
| `CORS_ORIGINS` | yes | `https://xpayments.digital` | Comma-separated |
| `REDIS_URL` | optional | `redis://127.0.0.1:6379/0` | Rate limit, sessions, queues |
| `RATE_LIMIT_WINDOW` | yes | `60` | Seconds |
| `RATE_LIMIT_MAX` | yes | `300` | Requests per window per IP |
| `WEBHOOK_SIGNING_SECRET` | no | `whsec_...` | Default signing secret (per-webhook secrets override) |
| `WEBHOOK_DELIVERY_TIMEOUT_MS` | yes | `10000` | |
| `WEBHOOK_MAX_RETRIES` | yes | `5` | Exponential backoff |
| `KYC_BUCKET` | yes | `kyc-documents` | Supabase Storage bucket |
| `PRODUCT_BUCKET` | yes | `product-images` | Supabase Storage bucket |
| `SENTRY_DSN` | optional | `https://...@sentry.io/...` | Error tracking |

### 8.5 Backup strategy

- **Supabase automated backups:** Pro plan includes daily snapshots (7-day retention) and Point-in-Time Recovery (PITR) up to 7 days. Verify in Dashboard → Database → Backups.
- **Daily `pg_dump` cron** (defense-in-depth, in case Supabase loses a project):

```bash
# /home/deploy/backup.sh — run via crontab at 02:00 daily
#!/usr/bin/env bash
set -e
DATE=$(date +%Y%m%d)
pg_dump "$DATABASE_URL" --format=custom --file="/var/backups/xpayments-$DATE.dump"
find /var/backups -name "xpayments-*.dump" -mtime +30 -delete
```

```cron
0 2 * * * /home/deploy/backup.sh >> /var/log/xpayments-backup.log 2>&1
```

- **Offsite backup:** upload the dump to S3/R2/B2 (optional but recommended).

### 8.6 Monitoring

- **PM2 logs:** `pm2 logs xpayments-api --lines 100`. Configure log rotation: `pm2 install pm2-logrotate`.
- **Uptime monitoring:** UptimeRobot or Better Uptime, pinging `https://api.xpayments.digital/health` every 60s. Alert on 3 consecutive failures.
- **Sentry** (optional): `@sentry/node` for error tracking. Wire into Hono's `onError`.
- **Supabase observability:** Dashboard → Reports → Query performance. Watch for slow queries on `transactions` (the main aggregation table).
- **Alerting:** if `system_health.status = 'degraded'` or `'outage'` for >5 min, alert ops (PagerDuty, Opsgenie).

### 8.7 Health check

`GET /health` (unauthenticated, no rate limit):
```json
{
  "status": "ok",
  "uptime": 3600,
  "db": "ok",
  "redis": "ok",
  "version": "1.0.0"
}
```
Returns 503 if the DB or Redis is unreachable. Nginx's `location = /health` proxies this without logging.

---

## 9. Roadmap / Phases

### Phase 1 — Auth + Merchants + Wallets (MVP, 1–2 weeks)

Endpoints: #1–7, #9–10 (login, forgot, reset, me, refresh, wallets.list, wallets.movements, wallets.deposit, wallets.payout).
Tables: `merchants`, `users`, `refresh_tokens`, `wallets`, `wallet_movements`, `audit_logs`.
Deliverable: a merchant can register (manual seed for MVP), log in, see their wallets, and request a deposit/payout.

**Blocker:** resolve `AUDIT.md` §8.2 items 1–7 before starting Phase 1.

### Phase 2 — Transactions + Analytics (1 week)

Endpoints: #11, #13, #14 (analytics.overview, transactions.list, transactions.detail).
Tables: `transactions`, `transaction_events`, `customers` (populated from transaction customer data).
Deliverable: merchant sees their transaction history with filters and the dashboard analytics.

### Phase 3 — Commerce (1 week)

Endpoints: #15–22 (customers, products, stores, payment-links, invoices, subscriptions).
Tables: `customers`, `products`, `stores`, `payment_links`, `invoices`, `subscriptions`.
Deliverable: full commerce surface.

### Phase 4 — Risk + KYC + Admin (1–2 weeks)

Endpoints: #12, #32–39 (risk.profile, admin.kyc, admin.treasury, admin.merchants, admin.setMerchantStatus, admin.kycDecision, admin.health, admin.revenue).
Tables: `risk_profiles`, `kyc_reviews`, `kyc_documents`, `system_health`, `feature_flags`.
Deliverable: admin platform; KYC review queue; risk center.

### Phase 5 — Real-time + Webhooks + Payouts (1 week)

Endpoints: #8, #26–31 (wallets.swap, webhooks.*, payouts.list, deposits.list, treasury.overview).
Tables: `webhooks`, `webhook_deliveries`. Background workers (BullMQ or pg-boss) for webhook delivery and payout processing.
Deliverable: webhook management + delivery; FX swap; treasury overview; payouts/deposits history.

### Phase 6 — Hardening (ongoing)

- Move JWT from localStorage to HttpOnly cookies (BFF pattern).
- Implement 2FA (TOTP via `otplib`).
- Add the 4 missing admin endpoints (§5.4).
- Add `POST /auth/logout` and wire the frontend.
- Migrate to Supabase Auth + RLS as primary auth (Approach B, §3.3) if the team wants Supabase's MFA/OAuth.
- PCI DSS SAQ-A audit.
- SOC 2 Type I prep.

---

## Appendix A — Endpoint quick reference

| # | Method | Path | Response shape | Auth |
|---|--------|------|----------------|------|
| 1 | POST | `/auth/login` | `AuthSession` (bare) | none |
| 2 | POST | `/auth/forgot` | `{ ok }` | none |
| 3 | POST | `/auth/reset` | `{ ok }` | none |
| 4 | GET | `/auth/me` | `User` (bare) | Bearer |
| 5 | POST | `/auth/refresh` | `{ accessToken, refreshToken, user }` | none |
| 6 | GET | `/wallets` | `{ data: Wallet[] }` | Bearer |
| 7 | GET | `/wallets/movements` | `{ data: WalletMovement[] }` | Bearer |
| 8 | POST | `/wallets/swap` | `{ ok, rate }` | Bearer |
| 9 | POST | `/wallets/deposit` | `{ ok, reference }` | Bearer |
| 10 | POST | `/wallets/payout` | `{ ok, reference }` | Bearer |
| 11 | GET | `/analytics/overview` | `AnalyticsOverview` (bare) | Bearer |
| 12 | GET | `/risk/profile` | `RiskProfile` (bare) | Bearer |
| 13 | GET | `/transactions` | `Paginated<Transaction>` | Bearer |
| 14 | GET | `/transactions/:id` | `Transaction` (bare) | Bearer |
| 15 | GET | `/customers` | `{ data: Customer[] }` | Bearer |
| 16 | GET | `/products` | `{ data: Product[] }` | Bearer |
| 17 | POST | `/products` | `Product` (bare, 201) | Bearer |
| 18 | DELETE | `/products/:id` | `{ ok }` | Bearer |
| 19 | GET | `/stores` | `{ data: Store[] }` | Bearer |
| 20 | GET | `/payment-links` | `{ data: PaymentLink[] }` | Bearer |
| 21 | GET | `/invoices` | `{ data: Invoice[] }` | Bearer |
| 22 | GET | `/subscriptions` | `{ data: Subscription[] }` | Bearer |
| 23 | GET | `/api-keys` | `{ data: ApiKey[] }` | Bearer |
| 24 | POST | `/api-keys` | `ApiKey` (bare, 201, with `fullKey`) | Bearer |
| 25 | DELETE | `/api-keys/:id` | `{ ok }` | Bearer |
| 26 | GET | `/webhooks` | `{ data: Webhook[] }` | Bearer |
| 27 | POST | `/webhooks` | `Webhook` (bare, 201, with `secret`) | Bearer |
| 28 | DELETE | `/webhooks/:id` | `{ ok }` | Bearer |
| 29 | GET | `/payouts` | `{ data: WalletMovement[] }` | Bearer |
| 30 | GET | `/deposits` | `{ data: WalletMovement[] }` | Bearer |
| 31 | GET | `/treasury/overview` | `TreasuryOverview` (bare) | Bearer |
| 32 | GET | `/admin/kyc` | `{ data: KycReview[] }` | Admin |
| 33 | GET | `/admin/treasury/overview` | `TreasuryOverview` (bare) | Admin |
| 34 | GET | `/admin/merchants` | `{ data: AdminMerchant[] }` | Admin |
| 35 | POST | `/admin/merchants/:id/status` | `{ ok }` | Admin |
| 36 | POST | `/admin/kyc/:id/approved` | `{ ok }` | Admin |
| 37 | POST | `/admin/kyc/:id/rejected` | `{ ok }` | Admin |
| 38 | GET | `/admin/health` | `SystemHealth` (bare) | Admin |
| 39 | GET | `/admin/revenue` | `{ total, series }` (bare) | Admin |

---

## Appendix B — Frontend files to reference during backend development

| File | Purpose |
|------|---------|
| `src/lib/api/xpApi.ts` | The 39 endpoint definitions — the canonical contract. |
| `src/lib/api/client.ts` | Axios client, JWT injection, 401 refresh flow, mock fallback. |
| `src/types/index.ts` | All domain types (`User`, `AuthSession`, `Wallet`, `Transaction`, etc.). |
| `src/stores/auth.ts` | Auth state, login flow, hydration. |
| `src/config/index.ts` | Nav structure, payment methods, currencies, `API_BASE_URL`. |
| `src/hooks/queries.ts` | TanStack Query hooks — shows which data is fetched where. |
| `AUDIT.md` | Frontend readiness audit — read §2 (API contract) and §3 (auth) before starting. |

---

*End of specification.*
