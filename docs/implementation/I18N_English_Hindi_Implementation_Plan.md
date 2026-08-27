# Multi-Lingual (English + Hindi) — Implementation Plan

**Scope:** Milk Distribution SaaS — full stack (Next.js FE, NestJS BE, docs, CI, tests)  
**Locales:** `en` (English, default) · `hi` (Hindi)  
**Status:** Planning only — no code in this document  
**Estimated effort:** 3–4 weeks (1 FE engineer + 0.5 BE engineer + QA)  
**Last updated:** June 2026

---

## 1. Is this achievable?

**Yes — fully achievable** for this codebase.

| Area | Feasibility | Notes |
|------|-------------|-------|
| UI copy (labels, buttons, headings) | High | ~500–800 strings across 32 routes |
| Form validation (Zod + class-validator) | High | Map errors to translation keys |
| API error messages | High | Error codes + FE/BE catalog |
| Dates, currency, numbers | High | `Intl` with `en-IN` / `hi-IN` |
| Hindi typography | High | Add Devanagari web font |
| Map / Leaflet | Medium | Keep English OSM tiles; Hindi UI chrome only |
| Product catalog names (DB) | Medium | Phase 1: keep English SKUs; optional `nameHi` column later |
| PDFs in `docs/` | N/A | Reference docs stay English; add Hindi *implementation* docs only |
| SMS / email (Phase 2+) | High | Template per locale when notifications ship |

**Not in initial scope:** auto-translate user-generated content (customer names, business names, addresses), PostGIS, RTL (Hindi uses LTR).

---

## 2. Recommended library stack

### 2.1 Frontend — `next-intl`

| Library | Version target | Why |
|---------|----------------|-----|
| **next-intl** | ^4.x | Built for Next.js App Router; locale routing, middleware, Server + Client Components, type-safe message keys |
| **Intl API** (built-in) | — | Dates, numbers, currency — already partially used in `formatDate` / `formatCurrency` |

**Why not alternatives:**

| Alternative | Rejected because |
|-------------|------------------|
| `react-i18next` alone | No first-class App Router / RSC integration; more boilerplate for `[locale]` routing |
| `next-i18next` | Pages Router–oriented; poor fit for App Router 16 |
| Google Translate widget | Not enterprise-grade; inconsistent UX; no control over dairy terminology |

### 2.2 Backend — hybrid: error codes + `nestjs-i18n` (optional layer)

| Approach | Use when |
|----------|----------|
| **ApiErrorCode enum** + JSON catalog | All business errors (`SUBSCRIPTION_CUTOFF_PASSED`, `PHONE_ALREADY_REGISTERED`) — FE translates |
| **nestjs-i18n** | Server-rendered messages (Swagger descriptions optional), email/SMS templates in Phase 2 |
| **class-validator** custom messages | Return keys like `validation.email.invalid`, not English sentences |

**Why hybrid:** Most UI is FE-rendered; translating on the client avoids duplicating every NestJS exception string. Backend returns `{ code, params? }` for known errors; unknown errors fall back to generic key.

**Optional:** `nestjs-i18n` if you want Hindi Swagger or admin-facing API docs later.

### 2.3 Validation — Zod error map

| Library | Why |
|---------|-----|
| Zod `.refine()` + custom error map | Already on Zod 4; map issue codes to `t('validation.xxx')` at form level |
| No extra package required | Keeps bundle small |

### 2.4 Testing

| Tool | Why |
|------|-----|
| Playwright `test.use({ locale: 'hi-IN' })` | E2E in Hindi browser context |
| Jest snapshot of message files | Catch missing keys between `en.json` / `hi.json` |
| Custom script `npm run i18n:check` | Fail CI if keys mismatch |

### 2.5 Fonts

| Font | Why |
|------|-----|
| **Noto Sans Devanagari** (Google Fonts) | Readable Hindi; pairs with existing Geist/Latin stack |

Load in `app/layout.tsx` with `lang={locale}` and `font-family` fallback chain in `globals.css`.

---

## 3. Architecture decisions

### 3.1 Locale routing

Use **URL prefix** (recommended for SEO and shareable links):

```
/en/login          /hi/login
/en/customer/profile    /hi/customer/profile
```

**Folder restructure:**

```
frontend/src/app/
  [locale]/
    (public)/...
    (dashboard)/...
  layout.tsx          ← root html/body, fonts
```

Default locale: `en`. Visiting `/` redirects to `/en` (or browser `Accept-Language` if `hi`, else `en`).

### 3.2 Locale persistence

| Layer | Mechanism |
|-------|-----------|
| Anonymous | Cookie `NEXT_LOCALE` (next-intl default) + URL |
| Logged-in | `User.preferredLocale` in DB (`en` \| `hi`), synced on profile save |
| API | Header `Accept-Language: hi` or `X-Locale: hi` on axios requests |

### 3.3 Middleware composition

Merge **two concerns** in `frontend/src/middleware.ts`:

1. **next-intl** — locale detection, redirect `/` → `/en`
2. **Existing auth role guard** — `milk-auth-role` cookie (wrong role block)

Order: locale first → auth second.

### 3.4 What stays untranslated

- Product SKUs, enum values sent to API (`DAILY`, `URBAN`)
- User-entered text (names, business names, addresses)
- `formattedAddress` from geocoding (provider-dependent language)
- Developer Swagger (English) unless Phase 2 doc i18n
- Audit log action codes (English); display labels translated on FE admin views

### 3.5 Translation file organization

```
frontend/messages/
  en/
    common.json       ← buttons, errors, nav
    auth.json
    admin.json
    distributor.json
    customer.json
    validation.json
    address.json
  hi/
    common.json
    ... (mirror structure)
```

Use **namespaced keys**: `customer.findDistributor.title`, `validation.phone.required`.

### 3.6 Backend error contract change

**Before:** `{ message: "Phone already registered", statusCode: 409 }`  
**After:** `{ code: "PHONE_ALREADY_REGISTERED", message: "...", params: { role: "customer" }, statusCode: 409 }`

- `message` remains English for logs/debug
- FE uses `code` + `params` → `t(\`errors.${code}\`, params)`

---

## 4. Database & schema changes

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add `preferredLocale String @default("en") @map("preferred_locale")` on `User` |
| `backend/prisma/schema.prisma` | Optional later: `nameHi` on `Product` (not Phase I18N-1) |
| `backend/prisma/seed.ts` | Seed admin with `preferredLocale: 'en'`; document Hindi test user |
| Platform settings | Optional `defaultLocale` on `PlatformSettings` (admin can set platform default) |

---

## 5. Implementation phases

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **I18N-0** | 2 days | Infrastructure, message files skeleton, locale switcher, CI key check |
| **I18N-1** | 5 days | All public + auth pages translated |
| **I18N-2** | 8 days | Admin + distributor + customer dashboards |
| **I18N-3** | 4 days | BE error codes, Zod/class-validator keys, axios interceptor |
| **I18N-4** | 3 days | E2E hi tests, UAT runbook, docs, checklist |
| **Total** | ~22 days | English + Hindi parity |

---

## 6. New files to create (not in repo today)

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/i18n/routing.ts` | `locales`, `defaultLocale`, `localePrefix` config |
| `frontend/src/i18n/request.ts` | Server-side message loader for RSC |
| `frontend/src/i18n/navigation.ts` | Locale-aware `Link`, `redirect`, `useRouter` wrappers |
| `frontend/messages/en/*.json` | English catalogs (6–8 namespaces) |
| `frontend/messages/hi/*.json` | Hindi catalogs (mirror) |
| `frontend/src/components/locale-switcher.tsx` | EN / हिंदी toggle in header + dashboard |
| `frontend/scripts/check-i18n-keys.ts` | CI: compare en vs hi key sets |
| `frontend/e2e/i18n-hi.spec.ts` | Hindi smoke tests |

### Backend

| File | Purpose |
|------|---------|
| `backend/src/common/errors/error-codes.ts` | Enum of all API error codes |
| `backend/src/common/errors/api-exception.filter.ts` | Normalize exceptions to `{ code, params }` |
| `backend/src/common/i18n/messages/en.json` | Optional server-side messages |
| `backend/src/common/i18n/messages/hi.json` | Optional server-side messages |

### Docs

| File | Purpose |
|------|---------|
| `docs/implementation/I18N_Checklist.md` | FE/BE file-by-file completion tracker |
| `docs/implementation/I18N_UAT_RUNBOOK.md` | Hindi QA scenarios |

---

## 7. File-by-file implementation inventory

Legend:
- **T** = extract strings → translation keys
- **C** = config / wiring only
- **N** = no user-facing strings (skip translation)
- **L** = locale-aware formatting (`Intl`)
- **E** = error codes / validation keys
- **D** = documentation update

---

### 7.1 Repository root

| File | Action | Notes |
|------|--------|-------|
| `README.md` | D | Add i18n section, locale URLs, `npm run i18n:check` |
| `package.json` | C | Add scripts: `i18n:check`, optional `i18n:extract` |
| `docker-compose.yml` | N | No change |
| `.gitignore` | N | No change |
| `.github/workflows/ci.yml` | C | Add i18n key parity step; Playwright hi job |

---

### 7.2 Documentation (`docs/`)

| File | Action | Notes |
|------|--------|-------|
| `docs/implementation/00_IMPLEMENTATION_OVERVIEW.md` | D | Add i18n as cross-cutting concern |
| `docs/implementation/PHASE_1_Checklist.md` | D | New section: i18n exit criteria |
| `docs/implementation/PHASE_1_Core_Platform.md` | D | Note bilingual UX requirement |
| `docs/implementation/PHASE_1_UAT_RUNBOOK.md` | D | Hindi test cases |
| `docs/implementation/PHASE_2_*.md` | D | SMS/email templates per locale |
| `docs/implementation/PHASE_3_*.md` | D | OTP SMS Hindi templates |
| `docs/implementation/PHASE_4_*.md` | D | Analytics labels |
| `docs/implementation/PHASE_5_*.md` | D | IoT alerts |
| `docs/implementation/I18N_English_Hindi_Implementation_Plan.md` | — | This document |
| `docs/implementation/I18N_Checklist.md` | **Create** | Per-file tracker |
| `docs/implementation/I18N_UAT_RUNBOOK.md` | **Create** | QA script |
| `docs/*.pdf` (9 files) | N | Source PRDs; no translation required |

---

### 7.3 Frontend — configuration

| File | Action | Notes |
|------|--------|-------|
| `frontend/package.json` | C | Add `next-intl` dependency |
| `frontend/tsconfig.json` | C | Path alias `@/messages/*` optional |
| `frontend/next.config.ts` | C | Register next-intl plugin |
| `frontend/next-env.d.ts` | N | Auto-generated |
| `frontend/postcss.config.mjs` | N | No change |
| `frontend/eslint.config.mjs` | C | Rule: no hardcoded JSX strings (eslint-plugin-i18next optional) |
| `frontend/playwright.config.ts` | C | Add hi locale project |
| `frontend/.env.local.example` | D | Document `NEXT_PUBLIC_DEFAULT_LOCALE` |
| `frontend/README.md` | D | i18n dev workflow |
| `frontend/AGENTS.md` | D | Tell agents to use `useTranslations` |
| `frontend/CLAUDE.md` | D | Same |
| `frontend/public/*.svg` | N | Icons only |

---

### 7.4 Frontend — i18n core (new + moved)

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/i18n/routing.ts` | **Create** C | Locale list, default |
| `frontend/src/i18n/request.ts` | **Create** C | Load messages for RSC |
| `frontend/src/i18n/navigation.ts` | **Create** C | Wrapped Link/router |
| `frontend/messages/en/*.json` | **Create** T | All English strings |
| `frontend/messages/hi/*.json` | **Create** T | Professional Hindi (not machine-only) |
| `frontend/src/middleware.ts` | C | Compose next-intl + auth middleware |
| `frontend/scripts/check-i18n-keys.ts` | **Create** C | CI parity check |

---

### 7.5 Frontend — app shell

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/app/layout.tsx` | C/T | `lang={locale}`, Devanagari font, `NextIntlClientProvider` if needed |
| `frontend/src/app/error.tsx` | T | Global error strings |
| `frontend/src/app/(public)/layout.tsx` | C | Move under `[locale]/`; locale switcher in header |
| `frontend/src/app/(dashboard)/layout.tsx` | C | Move under `[locale]/` |
| `frontend/src/app/globals.css` | C | Hindi font stack, line-height for Devanagari |

---

### 7.6 Frontend — public pages (`(public)/`)

| File | Action | Key namespaces |
|------|--------|----------------|
| `app/(public)/page.tsx` | T | `landing.*` — hero, CTAs, features |
| `app/(public)/login/page.tsx` | T | `auth.login.*` |
| `app/(public)/register/page.tsx` | T | `auth.register.*` |
| `app/(public)/register/distributor/page.tsx` | T | `auth.register.distributor.*` |
| `app/(public)/register/customer/page.tsx` | T | `auth.register.customer.*`, `address.*` |
| `app/(public)/forgot-password/page.tsx` | T | `auth.forgot.*` |
| `app/(public)/reset-password/page.tsx` | T | `auth.reset.*` |
| `app/(public)/activate/page.tsx` | T | `auth.activate.*` |

---

### 7.7 Frontend — admin pages (`(dashboard)/admin/`)

| File | Action | Key namespaces |
|------|--------|----------------|
| `admin/layout.tsx` | C | Wrap with admin nav translations |
| `admin/dashboard/page.tsx` | T | `admin.dashboard.*`, KPI labels |
| `admin/verification/page.tsx` | T | `admin.verification.*`, approve/reject |
| `admin/distributors/page.tsx` | T | `admin.distributors.*` |
| `admin/customers/page.tsx` | T | `admin.customers.*`, table headers |
| `admin/subscriptions/page.tsx` | T | `admin.subscriptions.*` |
| `admin/settings/page.tsx` | T | `admin.settings.*` |

---

### 7.8 Frontend — distributor pages (`(dashboard)/distributor/`)

| File | Action | Key namespaces |
|------|--------|----------------|
| `distributor/layout.tsx` | C | Nav labels from `distributor.nav.*` |
| `distributor/pending/page.tsx` | T | `distributor.pending.*` |
| `distributor/rejected/page.tsx` | T | `distributor.rejected.*` |
| `distributor/dashboard/page.tsx` | T | `distributor.dashboard.*`, setup steps |
| `distributor/setup/page.tsx` | T | `distributor.setup.*`, `address.*`, step labels |
| `distributor/products/page.tsx` | T | `distributor.products.*`, pricing |
| `distributor/delivery-slots/page.tsx` | T | `distributor.slots.*` |
| `distributor/customers/page.tsx` | T | `distributor.customers.*` |
| `distributor/customers/new/page.tsx` | T | `distributor.customers.new.*`, activation copy |
| `distributor/customers/[id]/page.tsx` | T | `distributor.customers.detail.*` |
| `distributor/subscriptions/page.tsx` | T | `distributor.subscriptions.*` |
| `distributor/subscriptions/create/page.tsx` | T | `distributor.subscriptions.create.*` |
| `distributor/settings/page.tsx` | T | `distributor.settings.*`, `address.*` |

---

### 7.9 Frontend — customer pages (`(dashboard)/customer/`)

| File | Action | Key namespaces |
|------|--------|----------------|
| `customer/layout.tsx` | C | Nav from `customer.nav.*` |
| `customer/profile/page.tsx` | T | `customer.profile.*`, `address.*` |
| `customer/find-distributor/page.tsx` | T | `customer.discovery.*`, radius, list/map |
| `customer/distributors/[id]/page.tsx` | T | `customer.distributorDetail.*` |
| `customer/subscribe/[distributorId]/page.tsx` | T | `customer.subscribe.*` |
| `customer/subscriptions/page.tsx` | T | `customer.subscriptions.list.*` |
| `customer/subscriptions/[id]/page.tsx` | T | `customer.subscriptions.detail.*`, edit, pause, extra |

---

### 7.10 Frontend — components

| File | Action | Notes |
|------|--------|-------|
| `components/layouts/dashboard-layout.tsx` | T | Nav items, portal titles, sign out, skip link |
| `components/providers.tsx` | C | Pass locale to toast if needed |
| `components/auth-guard.tsx` | T | Redirect messages (if any) |
| `components/locale-switcher.tsx` | **Create** T | EN / हिंदी |
| `components/admin/admin-customer-drawer.tsx` | T | Drawer section headings |
| `components/forms/product-select.tsx` | T | Label, placeholder, errors |
| `components/forms/delivery-slot-select.tsx` | T | Label, placeholder, errors |
| `components/subscription/delivery-schedule-preview.tsx` | T | Preview labels, paused hint |
| `components/address/address-form-fields.tsx` | T | Urban/rural labels, field labels, validation hints |
| `components/address/map-pin-picker.tsx` | T | Loading text |
| `components/address/MapPinPicker.tsx` | T | Map instructions, pin coords label |
| `components/discovery/discover-distributors-map.tsx` | T | Popup buttons, marker labels |
| `components/discovery/discover-distributors-map-loader.tsx` | T | Loading map |
| `components/ui/button.tsx` | N | No strings |
| `components/ui/input.tsx` | N | No strings |
| `components/ui/card.tsx` | N | No strings |
| `components/ui/label.tsx` | N | No strings |
| `components/ui/empty-state.tsx` | N | Receives translated props from parent |
| `components/ui/error-boundary.tsx` | T | Fallback title + body (or props) |

---

### 7.11 Frontend — hooks, lib, store, types

| File | Action | Notes |
|------|--------|-------|
| `hooks/use-auth.ts` | T/E | Toast messages; pass locale to API if needed |
| `hooks/use-admin.ts` | N | No UI strings |
| `hooks/use-customer.ts` | N | No UI strings |
| `hooks/use-distributor.ts` | N | No UI strings |
| `lib/api.ts` | C/E | Map API `code` → translated message; send `Accept-Language` |
| `lib/schemas.ts` | E | Zod messages → keys; use `createSchema(t)` factory pattern |
| `lib/address.ts` | E/T | `structuredAddressSchema` refine messages → keys |
| `lib/utils.ts` | L | `formatDate`, `formatCurrency` accept `locale` param |
| `store/auth-store.ts` | C | Persist `preferredLocale`; sync cookie |
| `types/index.ts` | C | Add `Locale`, `FREQUENCY_LABELS` → move to messages or `getFrequencyLabel(t)` |

**Important:** `FREQUENCY_LABELS`, `SETUP_STEP_LABELS` in `types/index.ts` must move to translation files — used across many pages.

---

### 7.12 Frontend — tests

| File | Action | Notes |
|------|--------|-------|
| `frontend/e2e/smoke.spec.ts` | C/T | Run against `/en/...`; add selectors stable across locales |
| `frontend/e2e/i18n-hi.spec.ts` | **Create** | Verify Hindi headings on login, landing, register |

---

### 7.13 Backend — configuration

| File | Action | Notes |
|------|--------|-------|
| `backend/package.json` | C | Optional `nestjs-i18n`; add `i18n:check` script |
| `backend/tsconfig.json` | N | No change |
| `backend/nest-cli.json` | C | Copy i18n JSON to dist if using nestjs-i18n |
| `backend/jest.config.js` | N | No change |
| `backend/.env.example` | D | `DEFAULT_LOCALE=en` |
| `backend/.env` | N | Local only |
| `backend/prisma/schema.prisma` | C | `User.preferredLocale` |
| `backend/prisma/seed.ts` | C | Locale on seed users |

---

### 7.14 Backend — bootstrap & modules

| File | Action | Notes |
|------|--------|-------|
| `backend/src/main.ts` | C | Optional nestjs-i18n resolver; exception filter |
| `backend/src/app.module.ts` | C | Register I18nModule + ApiExceptionFilter |

---

### 7.15 Backend — auth

| File | Action | Notes |
|------|--------|-------|
| `auth/auth.module.ts` | C | Import i18n if used |
| `auth/auth.controller.ts` | N | Swagger tags stay English |
| `auth/auth.service.ts` | E | Replace string exceptions with `ErrorCodes.*` |
| `auth/jwt.strategy.ts` | E | `Unauthorized` → code |
| `auth/dto/register.dto.ts` | E | class-validator message keys |
| `auth/dto/login.dto.ts` | E | Validation keys |
| `auth/dto/refresh.dto.ts` | E | Validation keys |
| `auth/dto/forgot-password.dto.ts` | E | Validation keys |
| `auth/dto/reset-password.dto.ts` | E | Validation keys |
| `auth/dto/activate.dto.ts` | E | Validation keys |

**User-facing auth strings to code:**

- Email already registered
- Invalid credentials
- Account suspended
- Invalid/expired refresh token
- Invalid/expired reset/activation token
- businessName required (distributor)

---

### 7.16 Backend — admin

| File | Action | Notes |
|------|--------|-------|
| `admin/admin.module.ts` | N | |
| `admin/admin.controller.ts` | N | |
| `admin/admin.service.ts` | E | NotFoundException messages → codes |
| `admin/dto/reject-distributor.dto.ts` | E | Validation keys |
| `admin/dto/suspend-distributor.dto.ts` | E | Validation keys |
| `admin/dto/update-settings.dto.ts` | E | Validation keys |

---

### 7.17 Backend — customer

| File | Action | Notes |
|------|--------|-------|
| `customer/customer.module.ts` | N | |
| `customer/customer.controller.ts` | N | |
| `customer/customer.service.ts` | E | ~20 business exceptions → codes |
| `customer/dto/subscription.dto.ts` | E | Validation keys |
| `customer/dto/update-profile.dto.ts` | E | Validation keys |
| `customer/dto/pause.dto.ts` | E | Validation keys |
| `customer/dto/extra.dto.ts` | E | Validation keys |

**Key customer error codes:** cutoff passed, distributor not live, invalid slot, product unavailable, subscription not found.

---

### 7.18 Backend — distributor

| File | Action | Notes |
|------|--------|-------|
| `distributor/distributor.module.ts` | N | |
| `distributor/distributor.controller.ts` | N | |
| `distributor/distributor.service.ts` | E | ~16 business exceptions → codes |
| `distributor/readiness.service.ts` | E | Go-live missing items → codes (FE maps to translated checklist) |
| `distributor/dto/*.ts` (8 files) | E | All DTO validation messages → keys |

---

### 7.19 Backend — shared / common

| File | Action | Notes |
|------|--------|-------|
| `common/common.module.ts` | C | Export exception filter |
| `common/address/address.util.ts` | E | Urban/rural validation throws → codes |
| `common/services/phone-validation.service.ts` | E | `PHONE_ALREADY_REGISTERED` |
| `common/services/audit.service.ts` | N | Audit codes stay English |
| `common/guards/jwt-auth.guard.ts` | E | Unauthorized code |
| `common/guards/roles.guard.ts` | E | Forbidden code |
| `common/guards/distributor-approved.guard.ts` | E | Approval pending/rejected codes |
| `common/dto/structured-address.dto.ts` | E | Swagger descriptions optional |
| `common/decorators/*.ts` (4 files) | N | |
| `common/types/auth-user.type.ts` | C | Optional `locale` in JWT payload |
| `common/errors/error-codes.ts` | **Create** E | Master enum |
| `common/errors/api-exception.filter.ts` | **Create** C | Response shape |

---

### 7.20 Backend — geocoding, products, subscription

| File | Action | Notes |
|------|--------|-------|
| `geocoding/geocoding.module.ts` | N | |
| `geocoding/geocoding.controller.ts` | N | |
| `geocoding/geocoding.service.ts` | N/E | External API errors → `GEOCODING_FAILED` code |
| `products/products.module.ts` | N | |
| `products/products.controller.ts` | N | |
| `products/products.service.ts` | N | Product names from DB |
| `subscription/subscription.module.ts` | N | |
| `subscription/subscription.controller.ts` | N | |
| `subscription/subscription-schedule.service.ts` | N | No user strings |
| `subscription/subscription-schedule.service.spec.ts` | N | |
| `subscription/dto/preview-schedule.dto.ts` | E | Validation keys |
| `prisma/prisma.module.ts` | N | |
| `prisma/prisma.service.ts` | N | |

---

## 8. Hindi translation guidelines

1. **Use formal Hindi (मानक)** for UI — suitable for pan-India SaaS.
2. **Keep dairy terms consistent:**

   | English | Hindi (recommended) |
   |---------|---------------------|
   | Distributor | वितरक |
   | Customer | ग्राहक |
   | Subscription | सदस्यता |
   | Delivery slot | डिलीवरी समय |
   | Pause | विराम |
   | Go live | लाइव करें |
   | Milk | दूध |

3. **Avoid literal translation** for UX idioms ("Get started" → "शुरू करें", not word-for-word).
4. **Numbers:** Use Devanagari digits optional — default keep Western digits (`1, 2, 3`) for data clarity; use `hi-IN` locale for grouping.
5. **Review:** Native Hindi speaker QA for agricultural/dairy context.

---

## 9. CI / quality gates

Add to `.github/workflows/ci.yml`:

1. `npm run i18n:check` — en/hi key parity
2. Playwright project `hi` — 3 smoke tests
3. Optional: screenshot diff for Hindi layout overflow (Devanagari is often longer)

**Definition of done (per screen):**

- [ ] All visible strings use `t()` or translation props
- [ ] Zod errors show Hindi when locale is `hi`
- [ ] API errors show Hindi when locale is `hi`
- [ ] No horizontal overflow on mobile (320px)
- [ ] `lang` attribute correct on `<html>`

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| String length breaks layout | Flexible layouts, `line-clamp`, test hi on mobile |
| Missing translation keys | CI key check; fallback to English |
| Middleware conflict (auth + locale) | Single composed middleware; integration tests |
| Route migration breaks bookmarks | Redirect `/login` → `/en/login` permanently |
| Product names only in English | Accept for v1; add `nameHi` in Phase 2 catalog |
| Zod + i18n complexity | Factory `createSchemas(t)` called inside client components |

---

## 11. Effort summary by file count

| Category | Files | Action type |
|----------|-------|-------------|
| Frontend pages | 32 | T |
| Frontend components | 18 | T / C |
| Frontend lib/hooks/store | 10 | E / L / C |
| Frontend config/new | 12 | C / Create |
| Backend services/guards | 12 | E |
| Backend DTOs | 18 | E |
| Backend config/new | 8 | C / Create |
| Docs | 12 | D / Create |
| Root/CI | 4 | C / D |
| **Total tracked** | **~126** | |

*(Excludes `node_modules`, `dist`, `.next`, PDFs, and generated Prisma client.)*

---

## 12. Recommended execution order

1. I18N-0: `next-intl` setup, `[locale]` folder move, `messages/en` skeleton, locale switcher on landing
2. I18N-1: Public + auth pages + `lib/utils` locale + fonts
3. I18N-3 (parallel): Backend `ErrorCodes` + axios mapper (unblocks translated toasts)
4. I18N-2: Dashboard pages by role (admin → distributor → customer)
5. Zod/address schema refactor with `createSchemas(t)`
6. I18N-4: Hindi E2E, UAT runbook, update `PHASE_1_Checklist.md`, stakeholder review

---

## 13. Link from master overview

Add to `docs/implementation/00_IMPLEMENTATION_OVERVIEW.md`:

- Cross-cutting: **Internationalization (en/hi)** — see [I18N_English_Hindi_Implementation_Plan.md](./I18N_English_Hindi_Implementation_Plan.md)
- Phase 1 exit: bilingual UI for all 32 routes
- Phase 3: Hindi OTP SMS templates

---

## 14. Decision log (pre-approved by product)

| Decision | Choice |
|----------|--------|
| Locales | `en`, `hi` only (extensible to `ta`, `mr` later) |
| URL strategy | Prefix `/en`, `/hi` |
| Default locale | English |
| DB product names | English in v1 |
| Token storage | Unchanged (localStorage) — unrelated to i18n |
| RTL | Not required for Hindi |

---

**Next step:** Create `I18N_Checklist.md` from Section 7 tables and begin I18N-0 infrastructure sprint.
