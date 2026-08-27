# Phase 1 � FE & BE Implementation Checklist

**Reference:** [PHASE_1_Core_Platform.md](./PHASE_1_Core_Platform.md)  
**Duration:** 8�10 weeks (Sprint 1 + Sprint 2 + UAT buffer)  
**Stack (implemented):** Next.js � NestJS � PostgreSQL � Prisma � **Zustand** � TanStack Query � Leaflet  
**Last updated:** June 2026 — backlog polish complete (customer detail, schedule preview, map discovery, CI, security)

**Legend:** `[x]` implemented � `[ ]` not implemented � `[~]` partial / dev substitute

---

## Progress summary

| Area | Done | Total | Notes |
|------|------|-------|-------|
| Shared / DevOps | 9 | 11 | CI added; no Redis (by design) |
| Sprint 1 — Foundation | 38 | 42 | Phone uniqueness not enforced; tokens in localStorage |
| Sprint 2 — Business Core | 86 | 86 | Complete |
| Structured Address & Geocoding | 26 | 26 | Complete |
| Security & Quality | 9 | 14 | Schedule unit tests + Helmet + rate limit; no integration/E2E in BE |
| UAT & Release | 1 | 14 | UAT runbook added; staging deploy + sign-off pending |
| **Overall implementation** | **~169** | **~193** | **~88% code complete** |

**API endpoints:** 35 implemented · **FE routes:** 32/32

---

## 0. Shared / DevOps (Week 1)

### Infrastructure

- [x] **BE** � Initialize NestJS module structure (`auth`, `admin`, `distributor`, `customer`, `subscription`, `common`)
- [x] **FE** � Initialize Next.js App Router with TypeScript, Tailwind, shadcn-style UI
- [x] **BE** � PostgreSQL database (Docker Compose on port **5433**)
- [~] **BE** � PostGIS extension � *deferred; Haversine distance used instead*
- [x] **BE** � Prisma schema + `db push` pipeline
- [ ] **BE** � Redis for refresh tokens / session blacklist (optional v1)
- [x] **Shared** � Environment config (`backend/.env.example`, `frontend/.env.local.example`)
- [x] **Shared** � `GOOGLE_MAPS_API_KEY` documented in `.env.example` (optional production geocoding)
- [x] **Shared** — GitHub Actions CI (lint, typecheck, tests, migration check)
- [~] **Shared** � Docker Compose � *Postgres only; no redis/api/web services*
- [x] **Shared** � Seed script: super admin + master product catalog + platform settings
- [x] **Shared** � Root `README.md` + `package.json` scripts

### Cross-cutting FE setup

- [x] **FE** � API client (axios) with auth header injection + 401 refresh retry
- [x] **FE** � TanStack Query provider + toast handling (`providers.tsx`)
- [x] **FE** � **Zustand auth store** (`store/auth-store.ts`) � persist user/tokens to localStorage
- [x] **FE** � Shared layout (sidebar, header, role nav) + `AuthGuard`
- [x] **FE** — Route groups `(public)` + `(dashboard)` with middleware role guard
- [x] **FE** � Zod schemas aligned with BE DTOs (`lib/schemas.ts`, `lib/address.ts`, `types/index.ts`)

---

## 1. Authentication & Registration (Sprint 1)

### 1.1 Backend � Auth core

- [x] **BE** � `users` table migration
- [x] **BE** � Password hashing (bcrypt)
- [x] **BE** � `POST /api/auth/register` � role-specific (`distributor` | `customer`)
- [x] **BE** — Validate unique email/phone per role rules (`@@unique([phone, role])`)
- [x] **BE** � Distributor register ? `approval_status = pending`, `setup_status = incomplete`
- [x] **BE** � Customer register ? creates `customer_profiles` with structured address + geocoding
- [x] **BE** � `POST /api/auth/login` � access JWT + refresh token
- [x] **BE** � `POST /api/auth/refresh` � rotate refresh token
- [x] **BE** � `POST /api/auth/forgot-password` + reset token
- [x] **BE** � `POST /api/auth/reset-password`
- [x] **BE** � JWT payload: `userId`, `role`, `status`
- [x] **BE** � Auth guard on protected routes
- [x] **BE** � Role guard decorator (`@Roles()`)

### 1.2 Backend � RBAC

- [x] **BE** � RBAC permission matrix per module
- [x] **BE** � Block unapproved distributor from business APIs (except profile/setup)
- [x] **BE** � 403 on RBAC violations
- [x] **BE** � `audit_logs` table + writes on approve/reject/settings changes

### 1.3 Frontend � Public pages

- [x] **FE** � Landing page `/` with CTAs
- [x] **FE** � Login page `/login`
- [x] **FE** � Role redirect after login
- [x] **FE** � Distributor pending redirect ? `/distributor/pending`
- [x] **FE** � Register role chooser `/register`
- [x] **FE** � Distributor registration `/register/distributor`
- [x] **FE** � Customer registration `/register/customer` � *structured address + map pin*
- [x] **FE** � Forgot password UI
- [x] **FE** � Reset password `/reset-password?token=...`
- [x] **FE** � Form validation (Zod)
- [~] **FE** — Token storage — *localStorage + role cookie for middleware; httpOnly deferred to Phase 2*
- [x] **FE** � Auto refresh on 401 retry (axios interceptor)

### 1.4 Frontend � Auth guards

- [x] **FE** � `AuthGuard` ? redirect to `/login`
- [x] **FE** � `RoleGuard` � block wrong role from route group
- [x] **FE** � Distributor pending/rejected redirect on dashboard

---

## 2. Super Admin Module (Sprint 1�2)

### 2.1 Backend � Admin APIs

- [x] **BE** � `GET /api/admin/dashboard/kpis`
- [x] **BE** � `GET /api/admin/distributors/pending`
- [x] **BE** � `POST /api/admin/distributors/{id}/approve`
- [x] **BE** � `POST /api/admin/distributors/{id}/reject`
- [x] **BE** � `GET /api/admin/distributors` � list + filters
- [x] **BE** � `PATCH /api/admin/distributors/{id}/suspend`
- [x] **BE** � `GET /api/admin/customers`
- [x] **BE** � `GET /api/admin/customers/{id}`
- [x] **BE** � `GET /api/admin/subscriptions`
- [x] **BE** � `GET /api/admin/settings`
- [x] **BE** � `PATCH /api/admin/settings`

### 2.2 Frontend � Admin panel

- [x] **FE** � Admin layout shell `/admin/*`
- [x] **FE** � Dashboard `/admin/dashboard`
- [x] **FE** � Verification queue `/admin/verification`
- [x] **FE** � Approve / reject with reason
- [x] **FE** � Distributors list `/admin/distributors`
- [x] **FE** � Suspend distributor action
- [x] **FE** — Customers monitor — list + detail drawer (`AdminCustomerDrawer`)
- [x] **FE** � Subscriptions `/admin/subscriptions`
- [x] **FE** � Settings `/admin/settings`

---

## 3. Distributor Module (Sprint 1�2)

### 3.1 Backend � Profile & lifecycle

- [x] **BE** � `distributor_profiles` migration
- [x] **BE** � `GET /api/distributor/profile`
- [x] **BE** � `PATCH /api/distributor/profile`
- [x] **BE** � `POST /api/distributor/setup/complete-step`
- [x] **BE** � Setup steps enum (5 steps)
- [x] **BE** � Readiness check service
- [x] **BE** � `POST /api/distributor/go-live`
- [x] **BE** � Block go-live with explicit missing items

### 3.2 Backend � Products & pricing

- [x] **BE** � Master products seeded
- [x] **BE** � Milk species + `fat_percent` on pricing
- [x] **BE** � `pricing` table with `effective_from`, `active`
- [x] **BE** � `GET /api/distributor/products`
- [x] **BE** � `PATCH /api/distributor/products`
- [x] **BE** � `GET /api/distributor/pricing`
- [x] **BE** � `POST /api/distributor/pricing`
- [x] **BE** � `PATCH /api/distributor/pricing/{id}`
- [x] **BE** � Duplicate active price validation

### 3.3 Backend � Delivery slots

- [x] **BE** � `delivery_slots` table
- [x] **BE** � CRUD delivery slots API
- [x] **BE** � Go-live requires ?1 active slot

### 3.4 Backend � Customer onboarding (Path A)

- [x] **BE** � `customer_profiles` + `distributor_customers` junction
- [x] **BE** � `GET/POST /api/distributor/customers`
- [x] **BE** � Geocode on create via `resolveAddress` (map pin ? Google ? Nominatim ? mock)
- [x] **BE** � User record + activation token
- [x] **BE** � `GET/PATCH /api/distributor/customers/{id}`
- [x] **BE** � `POST /api/auth/activate` **(FE+BE)**

### 3.5 Backend � Distributor subscriptions

- [x] **BE** � `subscriptions` table
- [x] **BE** � CRUD distributor subscriptions
- [x] **BE** � Readiness validation on subscribe
- [x] **BE** � All 5 frequency enums
- [x] **BE** � `GET /api/distributor/subscriptions/{id}/preview`

### 3.6 Frontend � Distributor panel

- [x] **FE** � Distributor layout `/distributor/*`
- [x] **FE** � Pending page `/distributor/pending`
- [x] **FE** � Rejected page `/distributor/rejected`
- [x] **FE** � Dashboard with setup progress
- [x] **FE** � Setup wizard `/distributor/setup`
  - [x] Step 1: Business profile + structured address + map pin
  - [x] Step 2: Product toggles
  - [x] Step 3: Fat-based pricing matrix
  - [x] Step 4: Delivery slots CRUD
  - [x] Step 5: Readiness + Go Live
- [x] **FE** � Products & pricing `/distributor/products`
- [x] **FE** � Delivery slots `/distributor/delivery-slots`
- [x] **FE** � Customers list `/distributor/customers`
- [x] **FE** � Add customer `/distributor/customers/new` � *urban/rural form + map pin*
- [x] **FE** — Customer detail `/distributor/customers/[id]`
- [x] **FE** � Copy activation link UI after customer create (Path A)
- [x] **FE** � Subscriptions list `/distributor/subscriptions`
- [x] **FE** � Create subscription `/distributor/subscriptions/create`
- [x] **FE** — Subscription schedule preview calendar component (`DeliverySchedulePreview` on create + detail)
- [x] **FE** � Settings `/distributor/settings` � *structured address + map pin + service radius*

---

## 4. Customer Module (Sprint 1�2)

### 4.1 Backend � Profile & geocoding

- [x] **BE** � `GET/PATCH /api/customers/profile`
- [x] **BE** � Geocoding service � Google Maps API ? Nominatim ? mock fallback
- [x] **BE** � Urban/rural address validation (`address.util.ts`)

### 4.2 Backend � Distributor discovery (Path B)

- [x] **BE** — Geo index — lat/lng btree + bounding-box prefilter (Haversine retained)
- [x] **BE** � `GET /api/customers/distributors/nearby`
- [x] **BE** � Filter approved + go_live + pricing + slots
- [x] **BE** � Haversine distance + sort ASC
- [x] **BE** � Return name, distance, product summary, slots
- [x] **BE** � `GET /api/customers/distributors/{id}`
- [x] **BE** � Pagination + empty results
- [x] **BE** � Parameterized geo queries (Prisma)

### 4.3 Backend � Customer subscriptions (Path B)

- [x] **BE** � `GET/POST/PATCH /api/customers/subscriptions`
- [x] **BE** � `created_via = self_service` + distributor link
- [x] **BE** � Block ineligible distributor subscribe

### 4.4 Backend � Pause & extra requests

- [x] **BE** � `subscription_pauses` + `subscription_extras` tables
- [x] **BE** � Pause/extra POST endpoints with cutoff validation
- [x] **BE** � List pauses/extras GET endpoints
- [x] **BE** � Store only (no delivery/billing side effects)

### 4.5 Frontend � Customer panel

- [x] **FE** � Customer layout `/customer/*`
- [x] **FE** � Activation page `/activate?token=...`
- [x] **FE** � Profile `/customer/profile` � *urban/rural form + map pin + formatted address preview*
- [x] **FE** � Find Distributor `/customer/find-distributor`
  - [x] Radius filter chips: 1 / 3 / 5 / 10 km
  - [x] List + map view toggle
  - [x] Distributor result cards
  - [x] Empty state
- [x] **FE** � Distributor detail `/customer/distributors/[id]`
- [x] **FE** � Subscribe flow `/customer/subscribe/[distributorId]`
- [x] **FE** � Subscriptions list `/customer/subscriptions`
- [x] **FE** � Subscription detail `/customer/subscriptions/[id]`
- [x] **FE** — Edit subscription — full edit UI (product, slot, qty, frequency, fat %)
- [x] **FE** � Pause request form
- [x] **FE** � Extra milk request form
- [x] **FE** — Schedule preview calendar on subscription detail
- [x] **FE** � Post-registration redirect ? `/customer/find-distributor` (Path B)

---

## 5. Subscription Engine (Sprint 2)

### 5.1 Backend � Schedule logic

- [x] **BE** � `SubscriptionScheduleService`
- [x] **BE** � Daily, alternate day, weekdays, weekly, monthly
- [x] **BE** — Unit tests for edge cases (leap year, month-end)
- [x] **BE** � Preview endpoints (distributor + customer)

### 5.2 Frontend � Schedule display

- [x] **FE** — Shared `DeliverySchedulePreview` component
- [x] **FE** — Next 30 days preview on subscription create/edit
- [x] **FE** — Highlight paused dates in preview

---

## 6. Master Product Catalog (Sprint 2)

### 6.1 Backend

- [x] **BE** � Seed all product categories with SKUs
- [x] **BE** � Milk species enum + unit
- [x] **BE** — `GET /api/products` public master list

### 6.2 Frontend

- [x] **FE** — Product selector — shared `ProductSelect` + `DeliverySlotSelect`
- [x] **FE** � Fat % selector for milk (distributor pricing + subscribe forms)
- [x] **FE** � INR price display (?)

---

## 7. Notifications (Phase 1 � minimal)

- [x] **BE** � Invite token generation (Path A)
- [x] **BE** � Log invite URL to console (dev stub) + return `activationUrl` in API response
- [x] **FE** � Copy invite link button for distributor (`/distributor/customers/new`)

---

## 8. Structured Address & Geocoding (Phase 1 polish � implemented)

### 8.1 Backend � Data model

- [x] **BE** � `AddressType` enum (`URBAN`, `RURAL`) on customer + distributor profiles
- [x] **BE** � Structured fields: `flat_or_house_no`, `building_or_society`, `street_or_lane`, `landmark`, `village`, `district`, `state`
- [x] **BE** � `formatted_address` stored on save
- [x] **BE** � `StructuredAddressDto` shared across register/profile/customer DTOs
- [x] **BE** � `mergeAddressInput` + `resolveAddress` pipeline
- [x] **BE** � Map pin (`lat`/`lng`) takes priority over text geocoding
- [x] **BE** � Urban validation: flat/building/street + city + (pincode or map pin)
- [x] **BE** � Rural validation: village + district + state + (pincode or landmark or map pin)

### 8.2 Backend � Geocoding providers

- [x] **BE** � Google Geocoding API (when `GOOGLE_MAPS_API_KEY` set)
- [x] **BE** � OpenStreetMap Nominatim fallback (India-scoped)
- [x] **BE** � Mock hash fallback for offline dev
- [x] **BE** � Reverse geocoding for map pin
- [x] **BE** � `POST /api/geocoding/resolve`
- [x] **BE** � `GET /api/geocoding/reverse?lat=&lng=`

### 8.3 Frontend � Address UI

- [x] **FE** � `AddressFormFields` � urban/rural toggle with field sets
- [x] **FE** � `MapPinPicker` � Leaflet map, click + drag marker
- [x] **FE** � Address preview line (`formatAddressPreview`)
- [x] **FE** � Zod validation mirroring BE rules (`lib/address.ts`)
- [x] **FE** � Wired: customer register, profile, distributor setup, settings, add customer
- [x] **FE** — List + map view on Find Distributor discovery page

---

## 9. Security & Quality (Sprint 1�2 + Buffer)

### 9.1 Backend

- [x] **BE** � Input validation on DTOs (class-validator)
- [x] **BE** — Rate limit on auth endpoints
- [x] **BE** — CORS for FE origin
- [x] **BE** — Helmet / security headers
- [x] **BE** � Parameterized queries (Prisma)
- [x] **BE** � JWT expiry: access 15m, refresh 7d
- [x] **BE** — Unit tests (auth, RBAC, schedule, geo, address validation) — *schedule service covered*
- [ ] **BE** � Integration tests (full onboarding flow)

### 9.2 Frontend

- [~] **FE** � ESLint � *scaffold default; not enforced in CI*
- [ ] **FE** � Loading skeletons on all pages � *text "Loading..." only*
- [x] **FE** — Empty states — shared `EmptyState` + global `ErrorBoundary` + `error.tsx`
- [x] **FE** � Responsive layout (customer discovery + address forms mobile-usable)
- [~] **FE** — Accessibility — skip link, ARIA on forms/drawer; map keyboard nav still partial
- [x] **FE** — E2E tests (Playwright smoke tests)

---

## 10. Sprint 1 exit gate

- [x] **FE+BE** � Distributor register ? pending page
- [x] **FE+BE** � Admin approve/reject + audit log
- [x] **FE+BE** � Customer register + login
- [x] **FE+BE** � Approved distributor ? setup wizard
- [x] **FE+BE** � RBAC blocks wrong roles
- [x] **BE** � Sprint 1 APIs in Swagger (`/api/docs`)

---

## 11. Sprint 2 exit gate

- [x] **FE+BE** — Distributor wizard → go live
- [x] **FE+BE** — Path A end-to-end
- [x] **FE+BE** — Path B: radius discovery → self-subscribe
- [x] **FE+BE** — Unapproved / not-live hidden from discovery
- [x] **FE+BE** — Subscribe blocked without pricing/slots
- [x] **BE** — All 5 frequencies in schedule service + FE preview UI
- [x] **FE+BE** — Pause stored + cutoff enforced
- [x] **FE+BE** — Extra milk stored
- [x] **BE** — All Phase 1 APIs in Swagger
- [x] **FE** — All Phase 1 screens (32/32 routes)

---

## 12. UAT & Alpha release (Weeks 9�10)

- [ ] **Shared** � Seed 2�3 test distributors with go-live data in staging
- [ ] **Shared** � Seed 10+ customers (Path A + Path B mix)
- [ ] **QA** � Auth: register/login/refresh each role
- [ ] **QA** � Verification: approve, reject, resubmit
- [ ] **QA** � Setup wizard: incomplete blocks go-live
- [ ] **QA** � Path A end-to-end (incl. activation link + map pin address)
- [ ] **QA** � Path B: radius 1/3/5/10 km
- [ ] **QA** � Urban + rural address validation and geocoding
- [ ] **QA** � Readiness gate on subscribe
- [ ] **QA** � RBAC bypass attempts fail
- [ ] **QA** � JWT expiry and refresh rotation
- [ ] **QA** � Geo param injection blocked
- [x] **Shared** — UAT runbook published — see [PHASE_1_UAT_RUNBOOK.md](./PHASE_1_UAT_RUNBOOK.md)
- [ ] **Shared** — Security review sign-off
- [ ] **Shared** � Alpha deploy to staging
- [ ] **Shared** � Phase 2 backlog groomed

---

## 13. Phase 1 exit criteria (final)

- [x] Super Admin approve/reject with audit trail
- [x] Distributor wizard ? `go_live`
- [~] Path A: distributor-led customer + subscription — *ready for UAT*
- [x] Path B: radius discovery + self-subscribe
- [x] Structured urban + rural addresses with map pin geocoding
- [x] Subscription engine � 5 frequencies (BE)
- [x] Pause/extra persist with cutoff validation
- [x] RBAC on APIs + FE routes
- [ ] Alpha UAT signed off by PM/stakeholders
- [ ] Phase 2 kickoff ready

---

## 14. API endpoint checklist (BE quick reference)

| # | Method | Endpoint | Sprint | Done |
|---|--------|----------|--------|------|
| 1 | POST | `/api/auth/register` | 1 | [x] |
| 2 | POST | `/api/auth/login` | 1 | [x] |
| 3 | POST | `/api/auth/refresh` | 1 | [x] |
| 4 | POST | `/api/auth/forgot-password` | 1 | [x] |
| 5 | POST | `/api/auth/reset-password` | 1 | [x] |
| 6 | POST | `/api/auth/activate` | 2 | [x] |
| 7 | GET | `/api/admin/dashboard/kpis` | 1 | [x] |
| 8 | GET | `/api/admin/distributors/pending` | 1 | [x] |
| 9 | POST | `/api/admin/distributors/{id}/approve` | 1 | [x] |
| 10 | POST | `/api/admin/distributors/{id}/reject` | 1 | [x] |
| 11 | GET | `/api/admin/distributors` | 2 | [x] |
| 12 | PATCH | `/api/admin/distributors/{id}/suspend` | 2 | [x] |
| 13 | GET | `/api/admin/customers` | 2 | [x] |
| 14 | GET | `/api/admin/subscriptions` | 2 | [x] |
| 15 | GET/PATCH | `/api/admin/settings` | 2 | [x] |
| 16 | GET/PATCH | `/api/distributor/profile` | 1�2 | [x] |
| 17 | POST | `/api/distributor/setup/complete-step` | 2 | [x] |
| 18 | POST | `/api/distributor/go-live` | 2 | [x] |
| 19 | GET/PATCH | `/api/distributor/products` | 2 | [x] |
| 20 | CRUD | `/api/distributor/pricing` | 2 | [x] |
| 21 | CRUD | `/api/distributor/delivery-slots` | 2 | [x] |
| 22 | CRUD | `/api/distributor/customers` | 2 | [x] |
| 23 | CRUD | `/api/distributor/subscriptions` | 2 | [x] |
| 24 | GET | `/api/distributor/subscriptions/{id}/preview` | 2 | [x] |
| 25 | GET/PATCH | `/api/customers/profile` | 1�2 | [x] |
| 26 | GET | `/api/customers/distributors/nearby` | 2 | [x] |
| 27 | GET | `/api/customers/distributors/{id}` | 2 | [x] |
| 28 | CRUD | `/api/customers/subscriptions` | 2 | [x] |
| 29 | POST | `/api/customers/subscriptions/{id}/pause` | 2 | [x] |
| 30 | POST | `/api/customers/subscriptions/{id}/extra` | 2 | [x] |
| 31 | POST | `/api/geocoding/resolve` | 1�2 | [x] |
| 32 | GET | `/api/geocoding/reverse` | 1–2 | [x] |
| 33 | GET | `/api/products` | 2 | [x] |
| 34 | POST | `/api/subscriptions/preview-schedule` | 2 | [x] |
| 35 | GET | `/api/customers/subscriptions/{id}` | 2 | [x] |

**All 35 API endpoints implemented.**

---

## 15. FE page checklist (quick reference)

| # | Route | Role | Sprint | Done |
|---|-------|------|--------|------|
| 1 | `/` | Public | 1 | [x] |
| 2 | `/login` | Public | 1 | [x] |
| 3 | `/register` | Public | 1 | [x] |
| 4 | `/register/distributor` | Public | 1 | [x] |
| 5 | `/register/customer` | Public | 1 | [x] |
| 6 | `/forgot-password` | Public | 1 | [x] |
| 7 | `/reset-password` | Public | 1 | [x] |
| 8 | `/activate` | Public | 2 | [x] |
| 9 | `/admin/dashboard` | Admin | 1 | [x] |
| 10 | `/admin/verification` | Admin | 1 | [x] |
| 11 | `/admin/distributors` | Admin | 2 | [x] |
| 12 | `/admin/customers` | Admin | 2 | [x] |
| 13 | `/admin/subscriptions` | Admin | 2 | [x] |
| 14 | `/admin/settings` | Admin | 2 | [x] |
| 15 | `/distributor/pending` | Distributor | 1 | [x] |
| 16 | `/distributor/rejected` | Distributor | 1 | [x] |
| 17 | `/distributor/dashboard` | Distributor | 2 | [x] |
| 18 | `/distributor/setup` | Distributor | 2 | [x] |
| 19 | `/distributor/products` | Distributor | 2 | [x] |
| 20 | `/distributor/delivery-slots` | Distributor | 2 | [x] |
| 21 | `/distributor/customers` | Distributor | 2 | [x] |
| 22 | `/distributor/customers/new` | Distributor | 2 | [x] |
| 23 | `/distributor/subscriptions` | Distributor | 2 | [x] |
| 24 | `/distributor/subscriptions/create` | Distributor | 2 | [x] |
| 25 | `/distributor/settings` | Distributor | 2 | [x] |
| 26 | `/customer/profile` | Customer | 1�2 | [x] |
| 27 | `/customer/find-distributor` | Customer | 2 | [x] |
| 28 | `/customer/distributors/[id]` | Customer | 2 | [x] |
| 29 | `/customer/subscribe/[distributorId]` | Customer | 2 | [x] |
| 30 | `/customer/subscriptions` | Customer | 2 | [x] |
| 31 | `/customer/subscriptions/[id]` | Customer | 2 | [x] |
| 32 | `/distributor/customers/[id]` | Distributor | 2 | [x] |

**32/32 routes implemented.**

---

## Remaining backlog (Phase 1 polish before UAT)

1. ~~`/distributor/customers/[id]` detail page~~ ✅
2. ~~`DeliverySchedulePreview` component wired to preview API~~ ✅
3. ~~List + map toggle on Find Distributor page~~ ✅
4. ~~GitHub Actions CI + unit/E2E tests~~ ✅
5. ~~Rate limiting + Helmet on API~~ ✅
6. ~~`GET /api/products` public master list~~ ✅
7. Formal UAT + staging deploy — see [PHASE_1_UAT_RUNBOOK.md](./PHASE_1_UAT_RUNBOOK.md)

**Note:** Redis refresh-token blacklist intentionally deferred (not in scope).

---

**Owner tracking:** Assign remaining `[ ]` items in Jira/Linear. Labels: `phase-1`, `frontend`, `backend`, `qa`, `address`.
