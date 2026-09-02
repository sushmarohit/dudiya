# Product Requirements Gap Analysis

**Product:** Milk Distribution SaaS (Distributor ↔ Customer subscription delivery)  
**Stack:** NestJS API + Next.js web (no native mobile app yet)  
**Audit date:** 2 September 2026  
**Last re-check:** 2 September 2026 (post gap-closure W0–W5 implementation)  
**Auditor lens:** Senior / Principal TPM + Full-stack (16+ yrs)  
**Method:** Requirement → API/service/UI function mapping (codebase walkthrough)  
**Related plan:** [`implementation/GAP_CLOSURE_IMPLEMENTATION_PLAN.md`](./implementation/GAP_CLOSURE_IMPLEMENTATION_PLAN.md) · UAT: [`implementation/GAP_CLOSURE_UAT_CHECKLIST.md`](./implementation/GAP_CLOSURE_UAT_CHECKLIST.md)

---

## Executive verdict

| Area | Status | Coverage (approx.) |
|------|--------|-------------------|
| Distributor core ops (signup, business, customers, subs, bills, deliveries, export) | **Built** | ~90% |
| Customer core ops (signup, KYC, radius/name find, subscribe, pause/skip/extra, bills, deliveries) | **Built** | ~90% |
| Notifications (in-app + toast + CTA inbox) | **Built** | ~90% |
| Journey-start / day-unavailable / name search / start-fresh after settle | **Built (code)** | ~95% |
| **Overall vs your stated basic requirements** | **~90–92% code-complete** | Remaining: KYC depth, location optional vs go-live, ad-hoc extra *product*, email/SMS, manual UAT |

**Bottom line:** Gap-closure workstreams **W0–W5 are implemented in code**. Manual UAT still pending. Deferred by design: history transfer, email/SMS/FCM, ad-hoc second product for one day (W6 stretch), live GPS.

| Workstream | Code | Manual UAT |
|------------|------|------------|
| W0 Notification UX | ✅ | ⬜ |
| W1 Start fresh after settlement | ✅ | ⬜ |
| W2 Custom radius + name search | ✅ | ⬜ |
| W3 Skip-day CTA | ✅ | ⬜ |
| W4 Unavailable days | ✅ | ⬜ |
| W5 Journey start + ETA (in-app) | ✅ | ⬜ |
| W6 Extra product (stretch) | ❌ Deferred | — |

---

## How to read status badges

| Badge | Meaning |
|-------|---------|
| ✅ **DONE** | End-to-end in API + UI (usable today) |
| 🟡 **PARTIAL** | Exists but incomplete vs your wording / missing edge / UX gap |
| ❌ **MISSING** | Not implemented in code |
| ➕ **ADVANCED** | Beyond your basic list; already in product |

---

# 1. Distributor requirements

## 1.1 Signup with valid document

| Item | Detail |
|------|--------|
| **Your ask** | Distributor comes, signs up with valid document |
| **Status** | 🟡 **PARTIAL** |
| **What works** | Register as `DISTRIBUTOR` → create profile → upload identity docs (Aadhaar / PAN / OTHER) → name-match verification → admin approval → setup wizard → go-live |
| **Backend** | `auth.service.register` · `identity.service` (upload/list/verify) · `admin.service` approve/reject · `readiness.service` + `go-live` |
| **Frontend** | `/register/distributor` · setup wizard `/distributor/setup` · identity panel · `/distributor/pending` / `/rejected` |
| **Gap** | Signup itself does **not** require docs at register time. Docs are uploaded later in setup. Verification is **self-declared name match** (OCR matcher stub exists, not production OCR). Admin still gates go-live via approval. |

---

## 1.2 Set business

| Item | Detail |
|------|--------|
| **Your ask** | Set their business |
| **Status** | ✅ **DONE** |
| **What works** | Business name, owner, address (urban/rural), service lat/lng, service radius, products, fat pricing, delivery slots |
| **Backend** | `PATCH /distributor/profile` · setup steps · products/pricing/slots CRUD |
| **Frontend** | `/distributor/setup` · `/distributor/products` · `/distributor/delivery-slots` · `/distributor/settings` |
| **➕ Advanced** | Multi-step readiness checklist; fat-% pricing; custom distributor products; admin product promotion path |

---

## 1.3 Allow location (optional)

| Item | Detail |
|------|--------|
| **Your ask** | Allow location (optional) |
| **Status** | 🟡 **PARTIAL** |
| **What works** | UI has `LocationOptIn` (Yes/No GPS). Address can be entered without GPS; geocoding resolve/reverse available |
| **Gap vs go-live** | `ReadinessService` **requires** `serviceLat`, `serviceLng`, and `serviceRadiusKm` to go live. So location is optional in the form UX, but **mandatory for marketplace discovery + go-live**. Without coords, distributor cannot appear in customer radius search. |

---

## 1.4 Add customers

| Item | Detail |
|------|--------|
| **Your ask** | Can add their customer |
| **Status** | ✅ **DONE** |
| **What works** | Distributor creates customer (name, phone, email, address) → activation token → customer sets password (Path A) |
| **Backend** | `POST/GET/PATCH /distributor/customers` · `DistributorCustomer` link (`DISTRIBUTOR_LED`) |
| **Frontend** | `/distributor/customers` · `/new` · `/[id]` |
| **➕ Advanced** | Search customers by name/phone/email; dual onboard (also Path B self-service customers linked after subscribe) |

---

## 1.5 Start subscription (weekly / daily / monthly, etc.)

| Item | Detail |
|------|--------|
| **Your ask** | Start subscription with customer — weekly, daily, monthly, etc. |
| **Status** | ✅ **DONE** |
| **Frequencies in code** | `DAILY` · `ALTERNATE_DAY` · `WEEKDAYS` · `WEEKLY` · `MONTHLY` |
| **Backend** | `POST /distributor/subscriptions` · schedule preview · `SubscriptionScheduleService` |
| **Frontend** | `/distributor/subscriptions` · `/create` · `/[id]` + delivery schedule preview |
| **➕ Advanced** | Alternate-day & weekdays; fat percent on subscription; preview before create; feature flag to disable create |

---

## 1.6 Cancel subscription

| Item | Detail |
|------|--------|
| **Your ask** | Can cancel the subscription |
| **Status** | ✅ **DONE** (mutual confirm model) |
| **What works** | Either party raises end request → other confirms/rejects → status `PENDING_CANCEL` → both confirm → settlement bill → `CANCELLED` |
| **Backend** | `SubscriptionEndService` · `end-request` / `end-confirm` / `end-reject` / `end-status` |
| **Frontend** | `subscription-end-panel` on distributor & customer subscription detail |
| **Note** | Not a one-click hard cancel; designed as **bilateral settlement cancel** (stronger than basic cancel). |

---

## 1.7 Generate invoice / generate bill

| Item | Detail |
|------|--------|
| **Your ask** | Generate invoice, generate bill |
| **Status** | ✅ **DONE** (product uses **Bill**, not separate “Invoice” entity) |
| **What works** | Billing cycle settings (WEEKLY / BI_WEEKLY / MONTHLY) · run cycle · dues · bill list/detail · PDF download · record payments · adjustments · void · settlement bill on cancel |
| **Backend** | `billing.service` · `GET/POST /distributor/bills...` · PDF via PDFKit · cron close cycles / overdue |
| **Frontend** | `/distributor/billing` · settings · dues · `/bills/[id]` · customer `/customer/bills` |
| **➕ Advanced** | Usage-based from **delivered** qty; settlement invoice on end; payment methods CASH/UPI/BANK/OTHER; feature flag for billing |

---

## 1.8 Notification when distributor starts journey

| Item | Detail |
|------|--------|
| **Your ask** | When distributor starts journey, proper notification to customer |
| **Status** | ✅ **DONE** (in-app; email still deferred) |
| **What works** | `POST /distributor/deliveries/start-journey` · ETA per stop (`estimatedArrivalAt`) · `DELIVERY_JOURNEY_STARTED` fan-out · Complete journey · Deliveries UI buttons · toast/inbox CTA |
| **Backend** | `delivery.service.startJourney` / `completeJourney` |
| **Frontend** | `/distributor/deliveries` Start / Complete journey |
| **Remaining** | No dedicated customer “Today’s ETA” card (ETA is in notification body). No email/SMS. |

---

## 1.9 Customer variation / extra product before journey

| Item | Detail |
|------|--------|
| **Your ask** | If customer wants variation (extra milk / this or that), it should reach distributor **before** journey starts |
| **Status** | 🟡 **PARTIAL** |
| **What works** | Extra **quantity** (`SubscriptionExtra`) + notify + pause/skip cutoff · journey start now exists so ops can treat start as soft gate |
| **Gap** | Still no one-day **different product** request (W6 stretch). No hard API block of extras after journey started. |

---

## 1.10 Distributor not available for specific day → notify customers

| Item | Detail |
|------|--------|
| **Your ask** | Notification from distributor if not available for a specific day |
| **Status** | ✅ **DONE** |
| **What works** | `DistributorUnavailableDay` · CRUD APIs · fan-out `DISTRIBUTOR_UNAVAILABLE` · pending items skipped · generation returns empty for that day · Deliveries UI “Mark unavailable” |
| **Backend** | `distributor.service.createUnavailableDay` · `delivery-generation` unavailable check |
| **Frontend** | `/distributor/deliveries` unavailable panel |

---

## 1.11 See all deliveries of the day + export

| Item | Detail |
|------|--------|
| **Your ask** | See all delivery of the day and export them |
| **Status** | ✅ **DONE** |
| **What works** | List by date / month / date range · filter by slot · generate deliveries · mark delivered / skip / fail · bulk mark · CSV export |
| **Backend** | `GET /distributor/deliveries` · `GET /distributor/deliveries/export` · `POST generate` · `bulk-status` |
| **Frontend** | `/distributor/deliveries` + export download helper |
| **➕ Advanced** | Month view; reorder items API; admin delivery override; daily auto-generation cron |

---

## 1.12 Customer-specific delivery + export

| Item | Detail |
|------|--------|
| **Your ask** | See a customer-specific delivery and also export them |
| **Status** | ✅ **DONE** |
| **What works** | Same list/export APIs accept `customerId` filter; UI has customer dropdown filter |
| **Backend** | Query + CSV scoped by `customerId` |
| **Frontend** | Deliveries page customer filter + export with customer in filename |

---

# 2. Customer requirements

## 2.1 Signup with valid document

| Item | Detail |
|------|--------|
| **Your ask** | Signup with valid document |
| **Status** | 🟡 **PARTIAL** |
| **What works** | Register as customer → upload docs → identity verified (name match) → unlocks discovery/subscribe |
| **Gap** | Docs not mandatory at register moment; Path A invited customers may arrive via distributor create. Same KYC model as distributor (self-declared match). |

---

## 2.2 Search distributor via radius / custom radius

| Item | Detail |
|------|--------|
| **Your ask** | Search via radius, or custom radius |
| **Status** | ✅ **DONE** |
| **What works** | Nearby Haversine API + UI presets **1/3/5/10** + **custom km** input (clamped 1–50) |
| **Frontend** | `/customer/find-distributor` Near me mode |
| **Note** | Customer still needs delivery lat/lng set. |

---

## 2.3 Search distributor by name

| Item | Detail |
|------|--------|
| **Your ask** | Search by name if customer knows distributor is registered |
| **Status** | ✅ **DONE** |
| **What works** | `GET /customers/distributors/search?q=` (live + verified + pricing + slots) · UI “Search by name” tab |
| **Frontend** | `/customer/find-distributor` |

---

## 2.4 Subscribe to distributor

| Item | Detail |
|------|--------|
| **Your ask** | They subscribe the distributor |
| **Status** | ✅ **DONE** |
| **What works** | View distributor detail (products, pricing, slots) → choose product/qty/frequency/slot → create subscription → both sides notified `SUBSCRIPTION_ACTIVATED` |
| **Backend** | `POST /customers/subscriptions` · `GET /customers/distributors/:id` |
| **Frontend** | `/customer/distributors/[id]` · `/customer/subscribe/[distributorId]` |

---

## 2.5 Change distributor after proper settlement

| Item | Detail |
|------|--------|
| **Your ask** | End subscription → proper settlement → customer **starts fresh** (new subscribe). **No** transfer of history/pauses/extras/bills. |
| **Status** | ✅ **DONE** (per clarified product rule) |
| **What works** | Mutual end + settlement bill → cancelled panel with **Find a distributor** + bills link · end notification copy mentions start fresh · **no** history transfer |
| **Frontend** | `subscription-end-panel` customer cancelled state |

---

## 2.6 Notification if distributor not available on specific day

| Item | Detail |
|------|--------|
| **Your ask** | Notification if distributor not available on specific day |
| **Status** | ✅ **DONE** |
| **What works** | Tied to §1.10 — customers with active subs get `DISTRIBUTOR_UNAVAILABLE` + inbox CTA to deliveries |

---

## 2.7 Raise more product / extra quantity to distributor

| Item | Detail |
|------|--------|
| **Your ask** | Want more product or extra quantity → raise to distributor |
| **Status** | 🟡 **PARTIAL** |
| **What works** | Extra quantity for a date + notify distributor; cutoff enforced |
| **Gap** | No one-off “add another product for tomorrow” request without creating a full second subscription. “More product” in catalog sense = new subscription, not a variation ticket. |

---

## 2.8 Skip delivery but notify early

| Item | Detail |
|------|--------|
| **Your ask** | Can skip delivery but notify early |
| **Status** | ✅ **DONE** (in-app) |
| **What works** | **Skip a day** CTA (same-date pause) + multi-day pause · distributor notified (`PAUSE_APPLIED` / skip copy) · cutoff enforced |
| **Frontend** | Customer subscription detail |
| **Note** | Still in-app only (no SMS/email). |

---

## 2.9 See distributor’s full details

| Item | Detail |
|------|--------|
| **Your ask** | Can see their distributor’s full details |
| **Status** | ✅ **DONE** |
| **What works** | Business name, city, products, pricing (incl. fat), delivery slots, distance (on search) |
| **Frontend** | Distributor detail + subscribe pages; subscription detail shows linked distributor |

---

# 3. Cross-cutting: notifications matrix

| Event | In-app | Email/SMS | Status |
|-------|--------|-----------|--------|
| Subscription activated | Yes | No | ✅ |
| Pause applied / skip (to distributor) | Yes | No | ✅ |
| Extra milk request (to distributor) | Yes | No | ✅ |
| Bill generated | Yes | No | ✅ |
| Payment recorded | Yes | No | ✅ |
| Distributor approved | Yes | No | ✅ |
| Delivery failed/skipped | Yes | No | ✅ |
| Delivery reminder (cron) | Yes | No | ✅ |
| Subscription end request / confirm / reject | Yes | No | ✅ |
| **Journey started + ETA** | Yes | No | ✅ |
| **Distributor unavailable day** | Yes | No | ✅ |
| Inbox UX (toast on arrive, CTA buttons, unread) | Yes | — | ✅ |
| Push (FCM) | No | — | ❌ Phase 5 |

Inbox UI: `/notifications` + navbar bell + `NotificationArrivalWatcher` toast (~15s poll).

---

# 4. Advanced features already in product (beyond your basic list)

These are **already applied** and go past the basic requirement set:

1. **Dual onboarding** — distributor-led invite (Path A) + customer self-discovery (Path B)  
2. **Admin platform** — approve/reject/suspend distributors, KPIs, operations overrides, platform settings (pause cutoff, default radius)  
3. **Frequencies beyond daily/weekly/monthly** — `ALTERNATE_DAY`, `WEEKDAYS`  
4. **Fat-% pricing** and subscription fat selection  
5. **Urban + rural structured address** + geocoding  
6. **i18n** — English / Hindi (`next-intl`)  
7. **Bilateral cancel + settlement bill** (stronger than simple cancel)  
8. **Billing cycle automation** + overdue cron + PDF bills  
9. **CSV delivery export** with customer/slot filters  
10. **Delivery reorder API** + bulk status updates  
11. **Feature flags** for subscription create / billing  
12. **Identity document storage** with mime/size limits and download  
13. **Schedule preview** before committing subscription  
14. **Product catalog layers** — global catalog + distributor enablement + custom products (admin promote path in progress per Phase 2 checklist)  
15. **Swagger API docs** at `/api/docs`  
16. **JWT + refresh rotation**, role guards, distributor-approved guard  
17. **Notification arrival toast** + deep-link CTAs on inbox  
18. **Delivery journey** start/complete with static ETA fan-out  
19. **Distributor unavailable calendar** with customer broadcast  

---

# 5. Requirement checklist (quick view)

## Distributor

| # | Requirement | Status |
|---|-------------|--------|
| D1 | Signup + valid document | 🟡 Partial |
| D2 | Set business | ✅ Done |
| D3 | Location optional | 🟡 Partial (optional UX, required for go-live) |
| D4 | Add customers | ✅ Done |
| D5 | Start subscription (daily/weekly/monthly…) | ✅ Done |
| D6 | Cancel subscription | ✅ Done |
| D7 | Generate invoice/bill | ✅ Done |
| D8 | Notify customers on journey start | ✅ Done (in-app) |
| D9 | Receive variation/extra before journey | 🟡 Partial (extra qty; not ad-hoc product) |
| D10 | Notify if unavailable specific day | ✅ Done |
| D11 | Day deliveries + export | ✅ Done |
| D12 | Customer-specific deliveries + export | ✅ Done |

## Customer

| # | Requirement | Status |
|---|-------------|--------|
| C1 | Signup + valid document | 🟡 Partial |
| C2 | Search by radius / custom radius | ✅ Done |
| C3 | Search by name | ✅ Done |
| C4 | Subscribe to distributor | ✅ Done |
| C5 | End → settle → start fresh | ✅ Done |
| C6 | Notify if distributor unavailable | ✅ Done |
| C7 | Raise extra qty / more product | 🟡 Partial (extra qty only) |
| C8 | Skip delivery + notify early | ✅ Done (in-app) |
| C9 | See distributor full details | ✅ Done |

---

# 6. What is left (prioritized backlog)

## Done in gap closure (W0–W5) — pending manual UAT only

| Item | Notes |
|------|-------|
| Unavailable day + notify | Code ✅ — run UAT E |
| Journey start + ETA notify | Code ✅ — run UAT F |
| Name search + custom radius | Code ✅ — run UAT C |
| Start-fresh after settlement | Code ✅ — run UAT B |
| Skip-day CTA + notification UX | Code ✅ — run UAT A/D |

## Still open

| Priority | Feature | Notes |
|----------|---------|-------|
| P1 | **Ad-hoc product variation (W6)** | One-day different product without full second subscription |
| P1 | **Customer ETA card** | Show today’s window on deliveries page (ETA already in notification) |
| P1 | **Stronger KYC** | OCR / admin doc review vs self-declared name match |
| P1 | **Email / WhatsApp** | Channel beyond in-app |
| P2 | **Location truly optional for go-live** | Or clearer UX that coords are required for discovery |
| P2 | Phase 3 payments / mobile | See phase docs |

## P2 — Product roadmap (docs already exist)

| Phase doc | Content | Gap-closure note |
|-----------|---------|------------------|
| Phase 2.0 | Journey ETA + email | **In-app journey done**; email still open |
| Phase 3 | Payments gateway, wallets, OTP, mobile UX | Future |
| Phase 4 | Route optimization, analytics, loyalty | Future |
| Phase 5 | IoT, push, enterprise | Future |

---

# 7. Function-level map (key services)

| Domain | Primary functions | Requirement coverage |
|--------|-------------------|----------------------|
| Auth | `register`, `login`, `activate`, password reset | Signup ✅ (docs later) |
| Identity | `uploadDocument`, `getStatus`, name matcher | KYC 🟡 |
| Distributor | profile, setup, customers, subscriptions, **unavailable-days** | D2–D6, D10 ✅ |
| Readiness | `checkReadiness` / `assertGoLiveEligible` | Forces lat/lng (D3 gap) |
| Customer | nearby, **search by name**, subscribe, pause/skip, extra | C2–C4, C8 ✅; C7 🟡 |
| Subscription end | request / confirm / reject / settlement + start-fresh UX | D6 · C5 ✅ |
| Delivery | generate, list, export, **start/complete journey** | D8, D11–D12 ✅ |
| Billing | run cycle, bills, PDF, payments, settlement bill | D7 ✅ |
| Notifications | create + inbox + toast + CTAs | ✅ (in-app) |
| Jobs | daily delivery gen, reminders, billing close | Ops automation ➕ |
| Geocoding | resolve / reverse | Address ➕ |

---

# 8. Coverage scorecard

```
Distributor requirements:  9 done · 3 partial · 0 missing   ≈ 90%
Customer requirements:     7 done · 2 partial · 0 missing   ≈ 90%
Shared notifications:      journey + unavailable + inbox UX done (in-app)
Advanced extras:           substantial + journey + unavailable calendar
Manual UAT:                still open (see GAP_CLOSURE_UAT_CHECKLIST.md)
```

**Ship readiness for your written “basic” scope:** **code-complete for MVP asks** pending UAT pass. Remaining product gaps are KYC depth, optional location vs go-live, ad-hoc extra product (W6), and out-of-app messaging.

---

# 9. Recommended next steps (TPM view)

1. **Run manual UAT** — [`GAP_CLOSURE_UAT_CHECKLIST.md`](./implementation/GAP_CLOSURE_UAT_CHECKLIST.md) A→F  
2. Fix any UAT bugs  
3. Optional polish: customer ETA card; W6 ad-hoc product  
4. **Email channel** for journey / unavailable / bill  
5. Phase 3 payments / mobile  

---

# 10. Related docs in repo

| Doc | Purpose |
|-----|---------|
| `docs/implementation/00_IMPLEMENTATION_OVERVIEW.md` | Vision, dual path, phase roadmap |
| `docs/implementation/PHASE_1_Core_Platform.md` | Auth, setup, subscriptions |
| `docs/implementation/PHASE_2_Delivery_Billing_Notifications.md` | Delivery, billing, in-app notify |
| `docs/implementation/PHASE_2.0_Delivery_Journey_Email_Notifications.md` | Journey + email plan (in-app portion shipped) |
| `docs/implementation/GAP_CLOSURE_IMPLEMENTATION_PLAN.md` | W0–W5 plan + master checklist |
| `docs/implementation/GAP_CLOSURE_UAT_CHECKLIST.md` | Manual smoke tests |
| `docs/implementation/PHASE_2_Checklist.md` | Granular done/todo vs Phase 2 |
| `docs/implementation/PHASE_3_Payments_Mobile.md` | Future payments/mobile |
| **This file** | Your product requirements vs actual code |

---

*Re-checked 2 Sep 2026 against W0–W5 code. Update again after UAT and any W6/email work.*
