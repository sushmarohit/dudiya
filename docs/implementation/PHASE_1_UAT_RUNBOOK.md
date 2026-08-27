# Phase 1 — UAT Runbook

Use this checklist for alpha/staging validation before Phase 2 kickoff.

## Prerequisites

1. Postgres running (`docker compose up -d`)
2. Backend seeded (`cd backend && npm run db:push`)
3. Frontend + API running (`npm run dev:api` / `npm run dev:web`)
4. Seed data: admin `admin@milk.local` / `Admin@123`

## Test accounts to create

| Role | Path | Notes |
|------|------|-------|
| Distributor A | Register → admin approve → complete setup → go live | Urban address + map pin |
| Distributor B | Same | Rural address |
| Customer Path A | Added by distributor + activation link | |
| Customer Path B | Self-register → find distributor | Radius 1/3/5/10 km |

## QA checklist

- [ ] Auth: register/login/refresh for admin, distributor, customer
- [ ] Admin: approve/reject distributor with audit log
- [ ] Distributor setup wizard blocks go-live when incomplete
- [ ] Path A: add customer, copy activation link, activate account
- [ ] Path B: radius discovery (list + map), self-subscribe
- [ ] Urban + rural address validation and geocoding
- [ ] Subscribe blocked when distributor not live or missing pricing/slots
- [ ] Subscription schedule preview (create + detail)
- [ ] Pause/extra requests respect cutoff
- [ ] RBAC: wrong role cannot access other dashboards
- [ ] Rate limit on auth endpoints (optional curl test)
- [ ] Swagger docs at `/api/docs`

## Staging deploy (outline)

1. Provision Postgres + env vars (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`)
2. Run `prisma db push` + seed on staging DB
3. Deploy API (Node 20+, port 3001)
4. Deploy Next.js with `NEXT_PUBLIC_API_URL`
5. Run this UAT checklist on staging URL
6. PM/stakeholder sign-off → Phase 2 kickoff

## Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| PM | | | |
| Engineering | | | |
| QA | | | |
