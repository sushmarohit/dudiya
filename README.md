# Milk Distribution SaaS

Multi-tenant milk subscription platform — Phase 1 implementation.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind, **Zustand**, TanStack Query, Zod |
| Backend | NestJS 10, Prisma 5, PostgreSQL 16 |
| Auth | JWT access + refresh tokens |

## Project structure

```
milk/
├── backend/          # NestJS API (port 3001)
├── frontend/         # Next.js web app (port 3000)
├── docs/             # PRD & implementation plans
└── docker-compose.yml
```

## Quick start

### 1. Database

```bash
docker compose up -d
```

Postgres runs on **localhost:5433** (avoids conflict with local Postgres on 5432).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run prisma:seed
npm run start:dev
```

- API: http://localhost:3001/api  
- Swagger: http://localhost:3001/api/docs  

**Seed admin:** `admin@milk.local` / `Admin@123`

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

- App: http://localhost:3000  

> **Node.js:** Next.js 16 recommends Node 20+. Backend works on Node 18.

## Phase 1 features

### Auth & roles
- Register/login for Admin, Distributor, Customer
- JWT + refresh token rotation
- Forgot / reset password
- Customer activation via invite token (Path A)

### Distributor
- Admin verification queue
- Setup wizard → go live
- Products, fat-based pricing, delivery slots
- Customer onboarding (Path A)
- Subscription management

### Customer
- Self-registration with address geocoding
- **Find distributor by radius** (1 / 3 / 5 / 10 km) — Path B
- Self-subscribe, pause & extra requests
- Subscription schedule preview

### Admin
- KPI dashboard, approve/reject distributors
- Customer & subscription monitoring
- Platform settings (pause cutoff)

## Environment variables

**backend/.env**
```
DATABASE_URL=postgresql://milk:milk@localhost:5433/milk?schema=public
JWT_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
PORT=3001
FRONTEND_URL=http://localhost:3000
GOOGLE_MAPS_API_KEY=          # optional: Geocoding API for address resolve

# SMTP — required for forgot-password and customer activation emails
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM=Dudiya <noreply@yourdomain.com>
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Feature flags (subscription & billing)

By default, **milk delivery subscriptions** and **billing/payments** are disabled in the user flow. All code remains in the codebase and can be re-enabled via env vars:

| Flag | Backend | Frontend |
|------|---------|----------|
| Subscription create flow | `FEATURE_SUBSCRIPTION_FLOW_ENABLED=true` | `NEXT_PUBLIC_FEATURE_SUBSCRIPTION_FLOW_ENABLED=true` |
| Subscription approval (customer self-subscribe waits for distributor accept/decline) | `FEATURE_SUBSCRIPTION_APPROVAL_ENABLED=true` | `NEXT_PUBLIC_FEATURE_SUBSCRIPTION_APPROVAL_ENABLED=true` |
| Billing & payments | `FEATURE_BILLING_ENABLED=true` | `NEXT_PUBLIC_FEATURE_BILLING_ENABLED=true` |

When subscription approval is enabled, customer self-service subscribe creates `PENDING_APPROVAL` until the distributor accepts (`ACTIVE`) or declines (`REJECTED`). Distributor-led create stays instantly `ACTIVE`. When the flag is off, customer subscribe activates immediately (legacy behavior).

When subscription/billing flows are disabled: nav items and create/subscribe CTAs are hidden; new subscriptions and payment recording are blocked via API; billing cron jobs are skipped. Existing subscriptions, deliveries, and read-only bill views continue to work.

Public API: `GET /api/config/features`

> Optional: set `GOOGLE_MAPS_API_KEY` on the backend for Geocoding API. Frontend uses browser GPS only (no map UI).
## Zustand auth store

Client auth state lives in `frontend/src/store/auth-store.ts`:
- Persists `user`, `accessToken`, `refreshToken` to `localStorage`
- Used by axios interceptors for Bearer token + 401 refresh retry

## Documentation

- [Implementation overview](docs/implementation/00_IMPLEMENTATION_OVERVIEW.md)
- [Phase 1 plan](docs/implementation/PHASE_1_Core_Platform.md)
- [Phase 1 checklist](docs/implementation/PHASE_1_Checklist.md)

## Test flows

1. **Admin:** Login → `/admin/verification` → approve distributor  
2. **Distributor:** Register → wait for approval → setup wizard → go live  
3. **Path A:** Distributor adds customer → share activation link → create subscription  
4. **Path B:** Customer registers → find nearby distributor → subscribe  
