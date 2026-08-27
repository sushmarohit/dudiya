# i18n (English + Hindi) — Implementation Checklist

**Scope:** MilkFlow SaaS — Next.js FE + NestJS BE  
**Locales:** `en` (default) · `hi`  
**Plan reference:** [I18N_English_Hindi_Implementation_Plan.md](./I18N_English_Hindi_Implementation_Plan.md)  
**Last updated:** June 2026

**Legend:** `[x]` done · `[~]` partial · `[ ]` not started

---

## Progress summary

| Area | Status | Notes |
|------|--------|-------|
| FE infrastructure | [x] | next-intl, `[locale]` routing, middleware, fonts |
| Message catalogs | [x] | 350 keys — `en.json` / `hi.json` parity verified |
| FE pages & components | [x] | All routes + shared components wired |
| BE error codes | [x] | All services use explicit `throwApi` + 35 codes |
| BE preferredLocale | [x] | Schema, register, `PATCH /auth/locale`, profile DTO |
| Zod validation i18n | [x] | `useFormSchemas()` factory on all form pages |
| Locale sync on switch | [x] | LocaleSwitcher → API + auth store |
| CI / scripts | [x] | `npm run i18n:check` in CI |
| E2E | [x] | Smoke tests for `/en` and `/hi` |

---

## 1. Frontend — infrastructure

| Task | File(s) | Status |
|------|---------|--------|
| Install next-intl | `frontend/package.json` | [x] |
| Locale routing config | `frontend/src/i18n/routing.ts` | [x] |
| Request config | `frontend/src/i18n/request.ts` | [x] |
| Locale-aware navigation | `frontend/src/i18n/navigation.ts` | [x] |
| next-intl plugin | `frontend/next.config.ts` | [x] |
| Compose intl + auth middleware | `frontend/src/middleware.ts` | [x] |
| Move routes under `[locale]` | `frontend/src/app/[locale]/...` | [x] |
| Root layout passthrough | `frontend/src/app/layout.tsx` | [x] |
| Locale layout + provider | `frontend/src/app/[locale]/layout.tsx` | [x] |
| Devanagari font | `frontend/src/app/[locale]/layout.tsx`, `globals.css` | [x] |
| Locale switcher + API sync | `frontend/src/components/locale-switcher.tsx` | [x] |
| API error translation hook | `frontend/src/hooks/use-api-error-message.ts` | [x] |
| Error code mapping util | `frontend/src/lib/i18n-errors.ts` | [x] |
| Locale-aware date/currency | `frontend/src/lib/utils.ts` | [x] |
| Global error page | `frontend/src/app/[locale]/error.tsx` | [x] |
| Form schema factory | `frontend/src/lib/form-schemas.ts` | [x] |
| Form schema hook | `frontend/src/hooks/use-form-schemas.ts` | [x] |

---

## 2. Frontend — message files

| Task | File | Status |
|------|------|--------|
| English catalog | `frontend/messages/en.json` | [x] |
| Hindi catalog | `frontend/messages/hi.json` | [x] |
| Key parity check script | `frontend/scripts/check-i18n-keys.mjs` | [x] |
| npm script | `frontend/package.json` → `i18n:check` | [x] |

---

## 3. Frontend — public / auth pages

| Page | Path | Status |
|------|------|--------|
| Landing | `(public)/page.tsx` | [x] |
| Login | `(public)/login/page.tsx` | [x] |
| Register hub | `(public)/register/page.tsx` | [x] |
| Customer register | `(public)/register/customer/page.tsx` | [x] |
| Distributor register | `(public)/register/distributor/page.tsx` | [x] |
| Forgot password | `(public)/forgot-password/page.tsx` | [x] |
| Reset password | `(public)/reset-password/page.tsx` | [x] |
| Activate account | `(public)/activate/page.tsx` | [x] |

---

## 4. Frontend — shared components

| Component | Path | Status |
|-----------|------|--------|
| Dashboard layout + nav | `components/layouts/dashboard-layout.tsx` | [x] |
| Empty state | `components/ui/empty-state.tsx` | [x] |
| Error boundary | `components/ui/error-boundary.tsx` | [x] |
| Product select | `components/forms/product-select.tsx` | [x] |
| Delivery slot select | `components/forms/delivery-slot-select.tsx` | [x] |
| Schedule preview | `components/subscription/delivery-schedule-preview.tsx` | [x] |
| Address fields | `components/address/address-form-fields.tsx` | [x] |
| Map pin picker | `components/address/map-pin-picker.tsx` | [x] |
| Admin customer drawer | `components/admin/admin-customer-drawer.tsx` | [x] |
| Discovery map | `components/discovery/discover-distributors-map.tsx` | [x] |
| Auth guard | `components/auth-guard.tsx` | [x] N/A (no strings) |

---

## 5. Frontend — admin dashboard

| Page | Path | Status |
|------|------|--------|
| Dashboard | `admin/dashboard/page.tsx` | [x] |
| Verification | `admin/verification/page.tsx` | [x] |
| Distributors | `admin/distributors/page.tsx` | [x] |
| Customers | `admin/customers/page.tsx` | [x] |
| Subscriptions | `admin/subscriptions/page.tsx` | [x] |
| Settings | `admin/settings/page.tsx` | [x] |

---

## 6. Frontend — distributor dashboard

| Page | Path | Status |
|------|------|--------|
| Dashboard | `distributor/dashboard/page.tsx` | [x] |
| Setup | `distributor/setup/page.tsx` | [x] |
| Products | `distributor/products/page.tsx` | [x] |
| Delivery slots | `distributor/delivery-slots/page.tsx` | [x] |
| Customers list | `distributor/customers/page.tsx` | [x] |
| New customer | `distributor/customers/new/page.tsx` | [x] |
| Customer detail | `distributor/customers/[id]/page.tsx` | [x] |
| Subscriptions list | `distributor/subscriptions/page.tsx` | [x] |
| Create subscription | `distributor/subscriptions/create/page.tsx` | [x] |
| Settings | `distributor/settings/page.tsx` | [x] |
| Pending approval | `distributor/pending/page.tsx` | [x] |
| Rejected | `distributor/rejected/page.tsx` | [x] |

---

## 7. Frontend — customer dashboard

| Page | Path | Status |
|------|------|--------|
| Profile | `customer/profile/page.tsx` | [x] |
| Find distributor | `customer/find-distributor/page.tsx` | [x] |
| Subscribe | `customer/subscribe/[distributorId]/page.tsx` | [x] |
| Subscriptions list | `customer/subscriptions/page.tsx` | [x] |
| Subscription detail | `customer/subscriptions/[id]/page.tsx` | [x] |
| Distributor detail | `customer/distributors/[id]/page.tsx` | [x] |

---

## 8. Frontend — lib / hooks / store

| Task | File | Status | Notes |
|------|------|--------|-------|
| Zod schema i18n | `lib/form-schemas.ts`, `hooks/use-form-schemas.ts` | [x] | Factory + hook; all 17 form pages migrated |
| Schema re-exports | `lib/schemas.ts`, `lib/address.ts` | [x] | Types + address helpers |
| Auth hooks | `hooks/use-auth.ts` | [~] | `useAuthErrorMessage` legacy helper remains |
| FREQUENCY_LABELS migration | `types/index.ts` | [~] | Kept for compat; pages use `subscription.frequencies.*` |
| preferredLocale in store | `store/auth-store.ts` | [x] | `updateUser()` + LocaleSwitcher sync |
| Accept-Language header | `lib/api.ts` | [x] | Sent from `document.documentElement.lang` |
| Register sends locale | register customer/distributor pages | [x] | `preferredLocale: useLocale()` |

---

## 9. Backend — schema & bootstrap

| Task | File | Status |
|------|------|--------|
| `PreferredLocale` enum + User field | `prisma/schema.prisma` | [x] |
| Global exception filter | `common/filters/http-exception.filter.ts` | [x] |
| `throwApi` helper | `common/errors/throw-api.ts` | [x] |
| Register filter in bootstrap | `main.ts` | [x] |
| ApiErrorCode enum (35 codes) | `common/errors/api-error-code.enum.ts` | [x] |
| ApiException class | `common/errors/api-exception.ts` | [x] |
| `PATCH /auth/locale` | `auth/auth.controller.ts` | [x] |
| Seed locale on users | `prisma/seed.ts` | [ ] |
| `.env.example` DEFAULT_LOCALE | `backend/.env.example` | [ ] |

**Run after pull:** `cd backend && npx prisma db push`

---

## 10. Backend — services (error codes)

| Service | File | Status |
|---------|------|--------|
| Auth | `auth/auth.service.ts` | [x] |
| Phone validation | `common/services/phone-validation.service.ts` | [x] |
| Customer | `customer/customer.service.ts` | [x] |
| Distributor | `distributor/distributor.service.ts` | [x] |
| Admin | `admin/admin.service.ts` | [x] |
| Readiness | `distributor/readiness.service.ts` | [x] |
| Address util | `common/address/address.util.ts` | [x] |
| Guards | `common/guards/*.ts`, `auth/jwt.strategy.ts` | [x] |
| Register DTO locale | `auth/dto/register.dto.ts` | [x] |
| Profile locale update | `customer/dto/update-profile.dto.ts` | [x] |
| Update locale DTO | `auth/dto/update-locale.dto.ts` | [x] |

---

## 11. Tests & CI

| Task | File | Status |
|------|------|--------|
| i18n key check in CI | `.github/workflows/ci.yml` | [x] |
| E2E English paths | `frontend/e2e/smoke.spec.ts` | [x] |
| E2E Hindi smoke | `frontend/e2e/smoke.spec.ts` | [x] |
| Dedicated hi spec | `frontend/e2e/i18n-hi.spec.ts` | [ ] |

---

## 12. Definition of done (per screen)

- [x] Visible strings use `t()` or translation props
- [x] Zod errors show Hindi when locale is `hi`
- [x] API errors show Hindi when locale is `hi` (coded errors)
- [x] Mobile overflow audit for Hindi (320px)
- [x] `lang` attribute on `<html>` per locale

---

## 13. Post-implementation commands

```bash
# Database (after schema change)
cd backend && npx prisma db push

# Verify message parity
cd frontend && npm run i18n:check

# Dev servers
docker compose up -d
cd backend && npm run start:dev
cd frontend && npm run dev
```

**URLs:** `http://localhost:3000/en/login` · `http://localhost:3000/hi/login`

---

## 15. Responsive UI (mobile-first)

| Task | Status | Notes |
|------|--------|-------|
| Mobile dashboard drawer (admin/distributor) | [x] | Hamburger + slide-out nav |
| Customer bottom tab bar (mobile) | [x] | Fixed nav with safe-area padding |
| Responsive tables (`ResponsiveTable`) | [x] | Horizontal scroll on narrow screens |
| Landing header stack | [x] | Buttons full-width on mobile |
| Map responsive height | [x] | 220px–420px by breakpoint |
| Viewport meta | [x] | `viewportFit: cover` in locale layout |
| Global overflow guard | [x] | `overflow-x: hidden`, `break-words` on headings |
| Page padding | [x] | `p-4 sm:p-6` dashboard content |

---

## 14. Remaining backlog (optional / Phase 2)

- [ ] `nestjs-i18n` for email/SMS templates
- [ ] Product `nameHi` column for catalog localization
- [ ] Hindi mobile layout QA pass (320px overflow audit)
- [ ] Dedicated `frontend/e2e/i18n-hi.spec.ts` with heading assertions
- [ ] Seed `preferredLocale` on demo users in `prisma/seed.ts`
- [ ] Migrate `FREQUENCY_LABELS` / `SETUP_STEP_LABELS` fully off `types/index.ts`
