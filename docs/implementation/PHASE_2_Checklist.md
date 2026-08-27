# Phase 2 — FE & BE Implementation Checklist

**Reference:** [PHASE_2_Delivery_Billing_Notifications.md](./PHASE_2_Delivery_Billing_Notifications.md)  
**Related (post-Phase 2):** [PHASE_2.0_Delivery_Journey_Email_Notifications.md](./PHASE_2.0_Delivery_Journey_Email_Notifications.md)  
**Duration:** 6–8 weeks (Sprint 3 + Sprint 4 + UAT buffer)  
**Prerequisite:** Phase 1 complete ([PHASE_1_Checklist.md](./PHASE_1_Checklist.md))  
**Stack:** Next.js · NestJS · PostgreSQL · Prisma · Zustand · TanStack Query  
**Last updated:** June 2026 — module-wise status synced with codebase

**Legend:** `[x]` implemented · `[ ]` not implemented · `[~]` partial / dev substitute

---

## Progress summary (module-wise)

| Module | Done | Total | % | Notes |
|--------|------|-------|---|-------|
| **0. Shared / DevOps** | 8 | 18 | 44% | Cron + PDF + hooks; README/seed/env pending |
| **1. Data model & migrations** | 22 | 22 | 100% | All tables, enums, indexes |
| **2. Delivery engine (BE)** | 24 | 38 | 63% | Core + APIs done; generation unit tests pending |
| **3. Distributor delivery UI** | 12 | 20 | 60% | List + mark delivered; no skip/drag reorder |
| **4. Customer delivery UI** | 6 | 8 | 75% | History page; HI + subscription link pending |
| **5. Billing engine (BE)** | 28 | 35 | 80% | Full cycle + payments; tests + overpayment pending |
| **6. Distributor billing UI** | 14 | 24 | 58% | List/detail/payment; filters/adjust/void UI pending |
| **7. Customer billing UI** | 6 | 9 | 67% | Bills + PDF; balance + HI pending |
| **8. Notifications (BE)** | 18 | 20 | 90% | All events wired; dedupe tests pending |
| **9. Notifications (FE)** | 6 | 13 | 46% | Bell + center; dropdown/deep links pending |
| **10. Admin operations** | 8 | 14 | 57% | Stats APIs; exception queue UI pending |
| **11. Phase 1 extensions** | 3 | 6 | 50% | Generation applies pause/extra; FE/tests pending |
| **12. Background jobs** | 6 | 8 | 75% | 4 crons live; job history + manual trigger pending |
| **13. Security & quality** | 3 | 18 | 17% | RBAC scoping; E2E/load/tests pending |
| **23. Product catalog governance** | 0 | 28 | 0% | **Not started** — admin catalog CRUD + distributor private products (see §23) |
| **14–17. UAT & release** | 0 | 30 | 0% | Not started |
| **Overall (excl. UAT)** | **~142** | **~269** | **~53%** | Core path functional; catalog governance pending |

**API endpoints:** 27 / 27 · **FE routes:** 10 / 11

---

## 0. Shared / DevOps (Sprint 3 Week 1)

### 0.1 Infrastructure & libraries

- [x] **BE** — NestJS modules: `delivery`, `billing`, `notification`, `jobs`
- [x] **BE** — Job scheduler (`@nestjs/schedule` in `jobs.module.ts`)
- [ ] **BE** — Job checkpointing / recovery for `generate_daily_deliveries` failure
- [x] **BE** — Decimal(10,2) for money fields (`bills`, `payments`, `bill_line_items`)
- [~] **BE** — PDF generation (`pdfkit` in `billing.service.ts`) — sync, not async for large bills
- [x] **BE** — CSV export (`delivery.service.exportCsv`)
- [~] **BE** — Distributor timezone on profile; cron jobs use server schedule (not per-TZ yet)
- [x] **BE** — Idempotency: unique `(subscription_id, product_id, delivery_date)` on `delivery_items`
- [x] **BE** — Notification dedupe via `event_id` + `@@unique([eventId, userId])`
- [ ] **Shared** — Env vars for jobs/PDF in `backend/.env.example`
- [ ] **Shared** — Seed extension: sample `delivery_items` + `bills`
- [ ] **Shared** — Root `README.md` Phase 2 modules + cron setup

### 0.2 Cross-cutting FE setup

- [x] **FE** — TanStack Query hooks: `use-delivery.ts`, `use-billing.ts`, `use-notifications.ts`
- [ ] **FE** — Zod schemas for delivery/billing DTOs in `lib/form-schemas.ts`
- [~] **FE** — i18n `delivery.*`, `billing.*`, `notifications.*` — **EN only** (`en.json`)
- [ ] **FE** — Shared `StatusBadge` for delivery/bill statuses (exists only in admin distributors page)
- [~] **FE** — Date/slot filters — inline on pages, not shared component
- [x] **FE** — Currency formatter `formatCurrency` in `lib/utils.ts` (used on billing pages)

---

## 1. Data model & migrations (Sprint 3 Week 1) — **100%**

### 1.1 Delivery tables

- [x] **BE** — `deliveries` migration (`delivery.module` / `schema.prisma`)
  - [x] `id`, `distributor_id`, `delivery_date`, `slot_id`, `status`, `generated_at`
- [x] **BE** — `delivery_items` migration
  - [x] `id`, `delivery_id`, `subscription_id`, `customer_id`, `product_id`
  - [x] `planned_qty`, `delivered_qty`, `status`, `notes`
  - [x] `route_order` (nullable)
  - [x] `delivery_date` denormalized on item
- [x] **BE** — Enum `DeliveryItemStatus` (`PENDING`, `DELIVERED`, `SKIPPED`, `FAILED`)
- [x] **BE** — Unique: `(subscription_id, product_id, delivery_date)`
- [x] **BE** — Index: `delivery_items (delivery_date, customer_id)` + join via `delivery`
- [~] **BE** — FK cascades — Prisma `onDelete: Cascade`; not documented in docs

### 1.2 Billing tables

- [x] **BE** — `bills` migration
  - [x] All fields: `cycle_start/end`, `subtotal`, `adjustments`, `total`, `amount_paid`, `status`, `due_date`, `issued_at`
- [x] **BE** — `bill_line_items` migration (all fields + `delivery_item_id`)
- [x] **BE** — `payments` migration (`payment_date`, `recorded_by`)
- [x] **BE** — `bill_adjustments` migration
- [x] **BE** — Enums: `BillStatus`, `PaymentMethod`, `BillAdjustmentType`, `BillingCycle`
- [x] **BE** — Index: `bills (customer_id, status)` + `distributor_id, status`
- [x] **BE** — Billing settings on `distributor_profiles`: `billing_cycle`, `bi_weekly_anchor_day`, `billing_due_days`, `timezone`

### 1.3 Notifications table

- [x] **BE** — `notifications` migration (all fields + `event_id`)
- [x] **BE** — Index: `notifications (user_id, read_at, created_at DESC)`
- [x] **BE** — `NotificationType` enum (all 8 Phase 2 types including `DELIVERY_REMINDER`)

### 1.4 Audit extensions

- [x] **BE** — Audit on delivery status change (`DELIVERY_ITEM_UPDATED`)
- [x] **BE** — Audit on bill cycle run, payment, adjustment, void

---

## 2. Delivery engine — Backend (Sprint 3) — **§2.1–2.4 core done**

### 2.1 Generation algorithm

- [x] **BE** — `DeliveryGenerationService` (`delivery-generation.service.ts`)
- [x] **BE** — Schedule resolution via `SubscriptionScheduleService`
- [x] **BE** — Formula: `planned_qty = base − pause + extra`
- [x] **BE** — Skip rows where `planned_qty = 0`
- [x] **BE** — Full-day pause only
- [x] **BE** — Multiple extras same day summed
- [x] **BE** — Regeneration idempotent (`upsert` on unique key)
- [x] **BE** — Group under `deliveries` per `(distributor_id, delivery_date, slot_id)`

### 2.2 Generation tests

- [ ] **BE** — Unit test: daily frequency
- [ ] **BE** — Unit test: alternate day
- [ ] **BE** — Unit test: weekdays only
- [ ] **BE** — Unit test: weekly same weekday
- [ ] **BE** — Unit test: monthly + month-end edge
- [ ] **BE** — Unit test: leap year boundaries
- [ ] **BE** — Unit test: pause reduces qty to 0
- [ ] **BE** — Unit test: extra increases qty
- [ ] **BE** — Unit test: pause + extra same date
- [ ] **BE** — Unit test: double generation → no duplicates

### 2.3 Delivery status rules

- [x] **BE** — State machine: `pending → delivered | skipped | failed`
- [x] **BE** — `skipped`/`failed` require `notes` (reason)
- [x] **BE** — `delivered` sets `delivered_qty` (defaults to `planned_qty`)
- [x] **BE** — No revert from `delivered` without admin (`UserRole.ADMIN` override)
- [~] **BE** — Admin override (`admin/delivery-items/:id/override`) — audit via standard log, no dedicated reason field

### 2.4 Delivery APIs

- [x] **BE** — `POST /api/distributor/deliveries/generate`
- [x] **BE** — `GET /api/distributor/deliveries?date=&slotId=`
- [x] **BE** — `PATCH /api/distributor/delivery-items/{id}`
- [x] **BE** — `PATCH /api/distributor/delivery-items/reorder`
- [x] **BE** — `POST /api/distributor/deliveries/bulk-status`
- [~] **BE** — `GET /api/distributor/deliveries/export` — CSV; `format=pdf` returns CSV text
- [x] **BE** — `GET /api/customers/deliveries?from=&to=`
- [ ] **BE** — `GET /api/customers/deliveries/{id}` — not implemented
- [x] **BE** — RBAC: scoped by distributor/customer profile
- [x] **BE** — DTO validation (`class-validator` on delivery DTOs)
- [x] **BE** — Swagger (`@ApiTags` on controllers)

### 2.5 Delivery list response shape

- [x] **BE** — Row: customer name, phone, product, planned qty, status
- [~] **BE** — Address in response (`formattedAddress` on customer include; not separate column)
- [x] **BE** — `route_order` included
- [ ] **BE** — Pause/extra flags on row (optional transparency)

---

## 3. Distributor — Delivery UI (Sprint 3 Weeks 3–4)

### 3.1 Pages & navigation

- [x] **FE** — Nav link: Deliveries (`dashboard-layout.tsx`)
- [x] **FE** — Route: `/distributor/deliveries`
- [~] **FE** — Route: `/distributor/deliveries/[date]` — date picker on main page instead

### 3.2 Daily list features

- [x] **FE** — Date picker (default today)
- [x] **FE** — Slot filter dropdown
- [~] **FE** — Table: customer, product, qty, status, phone — **no address column**
- [x] **FE** — Sort by `route_order` (API order)
- [ ] **FE** — Drag-and-drop reorder → reorder API
- [~] **FE** — Row actions: **Mark delivered only** — no skip/fail UI
- [ ] **FE** — Skipped/failed modal with required reason
- [ ] **FE** — Optional `delivered_qty` edit
- [x] **FE** — Bulk: Mark all delivered for slot
- [~] **FE** — Export CSV (`downloadDeliveryExport`); PDF export not separate
- [x] **FE** — Manual “Generate list” button
- [x] **FE** — Empty state
- [~] **FE** — Loading (`text`) + error banner — no skeletons
- [x] **FE** — `ResponsiveTable`

### 3.3 Dashboard integration

- [ ] **FE** — Dashboard widget: today’s pending delivery count
- [ ] **FE** — Quick link: “View today’s deliveries”

---

## 4. Customer — Delivery UI (Sprint 3 Week 4)

- [x] **FE** — Nav link: Delivery history
- [x] **FE** — Route: `/customer/deliveries`
- [x] **FE** — Date range filter (`from` / `to`)
- [x] **FE** — Columns: date, product, planned/delivered qty, status
- [~] **FE** — Status badges — plain text status, not colored badges
- [ ] **FE** — Link from subscription detail to filtered history
- [x] **FE** — Empty state + loading
- [~] **FE** — i18n EN (`delivery.*`); **HI not added**

---

## 5. Billing engine — Backend (Sprint 4)

### 5.1 Cycle configuration

- [x] **BE** — `GET /api/distributor/billing/settings`
- [x] **BE** — `PATCH /api/distributor/billing/settings`
- [~] **BE** — Weekly close logic in `getCycleWindow()` — server-time, not TZ-aware cron
- [x] **BE** — Bi-weekly: configurable `biWeeklyAnchorDay`
- [x] **BE** — Monthly: last day of previous month window

### 5.2 Bill generation

- [x] **BE** — `BillingService.runCycle` — aggregate delivered items by customer
- [x] **BE** — Only `DELIVERED` items billable
- [x] **BE** — Line total = `quantity × unit_price_at_delivery_date`
- [x] **BE** — Price lookup by `effectiveFrom` on delivery date
- [x] **BE** — Mid-cycle price change supported per line
- [x] **BE** — Total = subtotal + debit adjustments − credit adjustments
- [x] **BE** — `bill_line_items.delivery_item_id` linked
- [x] **BE** — Paused week → reduced/zero bill (via delivery generation)
- [x] **BE** — `POST /api/distributor/billing/run-cycle`
- [x] **BE** — Auto job `close_billing_cycles` (`JobsService` 01:00)

### 5.3 Bill lifecycle

- [x] **BE** — States: `draft → issued → partially_paid → paid` (+ `overdue`, `void`)
- [x] **BE** — `mark_overdue_bills` job daily 06:00
- [x] **BE** — `void` with reason (`voidReason` field)
- [x] **BE** — Partial payments update `amount_paid` + status
- [ ] **BE** — Overpayment validation (allows overpay → status `paid`)

### 5.4 Payments & adjustments

- [x] **BE** — `POST /api/distributor/bills/{id}/payments`
- [x] **BE** — `POST /api/distributor/bills/{id}/adjustments`
- [ ] **BE** — Admin approval flag for large adjustments
- [x] **BE** — `POST /api/distributor/bills/{id}/void`
- [x] **BE** — Payment → `PAYMENT_RECORDED` notification

### 5.5 Billing APIs — list & reports

- [~] **BE** — `GET /api/distributor/bills` — filters: `customerId`, `status` (no date range)
- [x] **BE** — `GET /api/distributor/bills/{id}` — detail + lines + payments + adjustments
- [x] **BE** — `GET /api/distributor/bills/{id}/pdf`
- [x] **BE** — `GET /api/distributor/billing/dues`
- [x] **BE** — `GET /api/customers/bills`
- [x] **BE** — `GET /api/customers/bills/{id}`
- [x] **BE** — `GET /api/customers/bills/{id}/pdf`
- [x] **BE** — RBAC on billing endpoints
- [x] **BE** — Swagger on billing controllers

### 5.6 Billing tests

- [ ] **BE** — Unit test: bill from delivered items only
- [ ] **BE** — Unit test: price change mid-cycle
- [ ] **BE** — Unit test: partial payment → `partially_paid`
- [ ] **BE** — Unit test: full payment → `paid`
- [ ] **BE** — Unit test: credit adjustment reduces total
- [ ] **BE** — Unit test: overdue transition
- [ ] **BE** — Unit test: paused week → zero bill

---

## 6. Distributor — Billing UI (Sprint 4 Weeks 5–7)

### 6.1 Pages & navigation

- [x] **FE** — Nav link: Billing
- [x] **FE** — Route: `/distributor/billing`
- [x] **FE** — Route: `/distributor/billing/settings`
- [x] **FE** — Route: `/distributor/billing/dues`
- [x] **FE** — Route: `/distributor/bills/[id]`

### 6.2 Invoice list

- [ ] **FE** — Filters: customer, status (API supports; no FE filter UI)
- [~] **FE** — Columns: customer, cycle, total, paid, status — **missing due date, issued date**
- [~] **FE** — “Run billing cycle” — no confirmation dialog
- [x] **FE** — Row link to detail

### 6.3 Bill detail

- [x] **FE** — Line items table (product, date, qty, line total)
- [ ] **FE** — Link line item → delivery record
- [~] **FE** — Subtotal/total/paid/balance — total + paid + balance shown; adjustments summary partial
- [ ] **FE** — Payments history section
- [x] **FE** — Record payment form (amount, method)
- [ ] **FE** — Add adjustment form
- [ ] **FE** — Void bill action
- [x] **FE** — Download PDF button

### 6.4 Billing settings

- [x] **FE** — Cycle type selector (weekly / bi-weekly / monthly)
- [ ] **FE** — Bi-weekly anchor day picker
- [x] **FE** — Due days after issue
- [x] **FE** — Save settings (auto-save on change)

### 6.5 Dues report

- [x] **FE** — Table: customer, outstanding amount
- [~] **FE** — Oldest due bill column — API returns `oldestDue` but FE table omits it
- [ ] **FE** — Export CSV
- [ ] **FE** — Dashboard widget: total outstanding

---

## 7. Customer — Billing UI (Sprint 4 Week 6)

- [x] **FE** — Nav link: Bills
- [x] **FE** — Route: `/customer/bills`
- [x] **FE** — Route: `/customer/bills/[id]`
- [ ] **FE** — Running balance / due amount on dashboard or bills header
- [~] **FE** — Bill list: cycle, total, status — **missing paid, due date**
- [x] **FE** — Detail: line items with delivery dates
- [x] **FE** — Download PDF invoice
- [ ] **FE** — Link bill lines → delivery history
- [~] **FE** — i18n EN; **HI not added**

---

## 8. Notifications — Backend (Sprint 4 Week 8)

### 8.1 Notification service

- [x] **BE** — `NotificationService.create()` with `eventId` dedupe
- [x] **BE** — At-least-once + dedupe by `(eventId, userId)`
- [x] **BE** — `createMany()` for fan-out (subscription activated)
- [x] **BE** — Stub `dispatchExternalChannel()` for email/sms/whatsapp

### 8.2 Notification APIs

- [x] **BE** — `GET /api/notifications` (paginated + `type` filter)
- [x] **BE** — `GET /api/notifications/unread-count`
- [x] **BE** — `PATCH /api/notifications/{id}/read`
- [x] **BE** — `POST /api/notifications/mark-all-read`
- [x] **BE** — RBAC: user-scoped queries
- [x] **BE** — Swagger on `NotificationController`

### 8.3 Event wiring (in-app)

| Event | Recipient | Trigger | Done |
|-------|-----------|---------|------|
| `subscription_activated` | Customer + Distributor | `createSubscription` (customer + distributor services) | [x] |
| `pause_applied` | Distributor | `pauseSubscription` | [x] |
| `extra_milk_request` | Distributor | `extraSubscription` | [x] |
| `bill_generated` | Customer | `runCycle` | [x] |
| `payment_recorded` | Customer | `recordPayment` | [x] |
| `distributor_approved` | Distributor | `approveDistributor` | [x] |
| `delivery_failed_skipped` | Customer | `updateItem` status PATCH | [x] |

- [~] **BE** — Dedupe verified in tests — implemented in code, **no automated test**
- [x] **BE** — `payload_json` includes `billId`, `subscriptionId`, `deliveryItemId` where applicable

### 8.4 Distributor delivery reminder job

- [x] **BE** — Job `delivery_reminder_notifications` — cron `0 7 * * *`
- [x] **BE** — In-app notify distributor with today's count
- [~] **BE** — Deep link in payload (`date`); FE does not auto-navigate

---

## 9. Notifications — Frontend (Sprint 4 Week 8)

- [x] **FE** — Bell icon in header (`NotificationBell`)
- [x] **FE** — Unread badge (`unread-count` API, 60s refetch)
- [ ] **FE** — Notification dropdown (latest 5–10) — links to full page only
- [x] **FE** — Route: `/notifications`
- [x] **FE** — Paginated list (via API `page` param)
- [ ] **FE** — Filter by notification type
- [x] **FE** — Mark single read
- [x] **FE** — Mark all read button
- [ ] **FE** — Deep links from notification click:
  - [ ] Bill generated → bill detail
  - [ ] Payment recorded → bill detail
  - [ ] Delivery failed/skipped → delivery history
  - [ ] Extra / pause → subscription
  - [ ] Subscription activated → subscription detail
- [x] **FE** — Server-sent English title/body strings

---

## 10. Admin — Operations (Sprint 3–4)

### 10.1 Backend

- [x] **BE** — `GET /api/admin/operations/deliveries` — success rate + by status
  - [x] Optional `from`/`to` date range
  - [ ] By distributor breakdown
- [x] **BE** — `GET /api/admin/operations/billing` — billed, collected, outstanding
- [x] **BE** — `GET /api/admin/operations/exceptions` — failed deliveries + credit adjustments
- [x] **BE** — `PATCH /api/admin/delivery-items/{id}/override`
- [x] **BE** — Swagger on `AdminOperationsController`

### 10.2 Frontend

- [x] **FE** — Nav link: Operations
- [x] **FE** — Route: `/admin/operations`
- [~] **FE** — Delivery monitor — KPI cards (no charts)
- [~] **FE** — Billing oversight — numeric summary (no charts)
- [ ] **FE** — Exception queue table with filters
- [ ] **FE** — Link exception rows to distributor/customer context

---

## 11. Phase 1 extensions for Phase 2 (Sprint 3 Week 2)

- [x] **BE** — Pause API cutoff enforcement (Phase 1 `assertBeforeCutoffForDate`)
- [x] **BE** — Pause applied in `DeliveryGenerationService` (qty → 0)
- [x] **BE** — Extra milk applied in generation (sum extras)
- [ ] **FE** — Subscription detail: “affects delivery on {date}” after pause/extra
- [ ] **BE** — Integration test: pause before cutoff → not on list
- [ ] **BE** — Integration test: pause after cutoff → rejected

---

## 12. Background jobs (Sprint 3–4)

| Job | Schedule | Status |
|-----|----------|--------|
| `generate_daily_deliveries` | `30 0 * * *` | [x] Implemented · [ ] Tested · [x] Idempotent · [x] Logged |
| `close_billing_cycles` | Daily 01:00 | [x] Implemented · [ ] Tested · [x] Issues bills · [x] Notifies |
| `mark_overdue_bills` | Daily 06:00 | [x] Implemented · [ ] Tested |
| `delivery_reminder_notifications` | Daily 07:00 | [x] Implemented · [ ] Tested |

- [ ] **BE** — Job run history / last success timestamp UI
- [ ] **BE** — Manual job trigger endpoints for staging

---

## 13. Security & quality (Sprint 3–4 + buffer)

### 13.1 Backend

- [x] **BE** — RBAC: distributor scoped to own `distributorId`
- [x] **BE** — RBAC: customer scoped to own `customerId`
- [ ] **BE** — Validate payment amount ≤ outstanding
- [~] **BE** — Void rejects `PAID` bills; allows `ISSUED`/`OVERDUE`
- [ ] **BE** — Rate limit on PDF endpoints (global throttler only)
- [ ] **BE** — Integration tests: delivery generation E2E
- [ ] **BE** — Integration tests: billing cycle E2E
- [ ] **BE** — Integration tests: notification on bill issue
- [ ] **BE** — Load test: 10k subscriptions < 15 min

### 13.2 Frontend

- [ ] **FE** — Loading skeletons on delivery + billing pages
- [~] **FE** — Error handling — inline error text; global `error.tsx` exists
- [ ] **FE** — E2E: mark delivered → customer history
- [ ] **FE** — E2E: billing cycle → bill + notification
- [ ] **FE** — E2E: record payment → customer notified
- [ ] **FE** — Playwright smoke extended for Phase 2

### 13.3 Non-functional

- [~] **BE** — Billing amounts as Prisma `Decimal` (JSON may serialize as string/number)
- [ ] **Shared** — Invoice PDF async for large bills (> N lines)
- [ ] **Shared** — Delivery generation checkpointing on failure

---

## 14. User stories traceability

| ID | Story | Modules | Done |
|----|-------|---------|------|
| US-7 | Distributor sees today's delivery list | §2, §3 | [x] |
| US-8 | Distributor marks delivered → billable qty | §2.3, §3 | [x] |
| US-9 | Customer pause before cutoff → not billed | §11, §5.2 | [x] |
| US-10 | Customer receives bill | §5, §7 | [x] |
| US-11 | Distributor records cash payment | §5.4, §6.3 | [x] |
| US-12 | In-app notification on new bill | §8, §9 | [x] |

---

## 15. Sprint 3 exit gate (Delivery)

- [x] **BE** — All delivery tables migrated
- [~] **BE** — Generation algorithm + unit tests — algorithm [x], tests [ ]
- [x] **BE** — Pause/extra integration in generation
- [x] **BE** — Cron `generate_daily_deliveries` (`JobsService`)
- [x] **BE** — Delivery APIs in Swagger
- [~] **FE** — Distributor delivery list UI — core [x], skip/drag [ ]
- [x] **FE** — Customer delivery history
- [x] **FE+BE** — Mark delivered updates `delivered_qty`
- [~] **FE+BE** — Route reorder API [x], FE drag [ ]; bulk mark [x]
- [~] **FE+BE** — CSV export [x]; PDF export [~]
- [x] **FE+BE** — Admin delivery monitor (basic stats)

---

## 16. Sprint 4 exit gate (Billing + Notifications)

- [x] **BE** — All billing tables migrated
- [~] **BE** — Billing cycle engine + tests — engine [x], tests [ ]
- [x] **BE** — Cron billing + overdue jobs
- [x] **BE** — Billing APIs in Swagger
- [~] **FE** — Distributor billing UI — list/detail/payment [x]; adjust/void/filters [ ]
- [x] **FE** — Customer bills UI + PDF
- [~] **FE** — Notification bell + center [x]; deep links [ ]
- [x] **BE** — All 7 notification events wired
- [~] **FE+BE** — E2E subscribe → deliver → bill → pay — **manual only, no automated E2E**

---

## 17. UAT & Beta release (Sprint 4 buffer)

- [ ] **Shared** — UAT runbook (`PHASE_2_UAT_RUNBOOK.md`)
- [ ] **Shared** — Seed pilot distributor + 10+ customers
- [ ] **QA** — Delivery generation each frequency type
- [ ] **QA** — Pause/extra combinations on same date
- [ ] **QA** — Double cron run → no duplicate rows
- [ ] **QA** — Price change mid-cycle on invoice
- [ ] **QA** — Partial payments and bill status transitions
- [ ] **QA** — Paused week → zero/reduced bill
- [ ] **QA** — Each notification event fires once
- [ ] **QA** — Path A + Path B through bill payment
- [ ] **QA** — RBAC cross-tenant blocked
- [ ] **QA** — PDF invoice matches line items
- [ ] **Shared** — Beta deploy with 1–2 pilot distributors
- [ ] **Shared** — PM/stakeholder UAT sign-off
- [ ] **Shared** — Security review billing + PII in PDFs
- [ ] **Shared** — Phase 2.0 backlog groomed

---

## 18. Phase 2 exit criteria (final)

- [x] Daily delivery lists generated automatically for all active distributors
- [x] Pause and extra requests correctly alter delivery quantities
- [x] Billing cycles produce accurate invoices from delivery records
- [x] Manual payments update bill status
- [x] In-app notifications for all Phase 2 events
- [x] Admin operations dashboard live (basic KPIs)
- [ ] Beta release with 1–2 pilot distributors
- [ ] Product Document v1 milestone: complete E2E delivery + billing testing
- [x] Schemas frozen: `bills.total`, `payments`, `delivery_items.delivered_qty`

---

## 19. API endpoint checklist (BE quick reference)

| # | Method | Endpoint | Sprint | Done |
|---|--------|----------|--------|------|
| 1 | POST | `/api/distributor/deliveries/generate` | 3 | [x] |
| 2 | GET | `/api/distributor/deliveries` | 3 | [x] |
| 3 | PATCH | `/api/distributor/delivery-items/{id}` | 3 | [x] |
| 4 | PATCH | `/api/distributor/delivery-items/reorder` | 3 | [x] |
| 5 | POST | `/api/distributor/deliveries/bulk-status` | 3 | [x] |
| 6 | GET | `/api/distributor/deliveries/export` | 3 | [x] |
| 7 | GET | `/api/customers/deliveries` | 3 | [x] |
| 8 | GET/PATCH | `/api/distributor/billing/settings` | 4 | [x] |
| 9 | POST | `/api/distributor/billing/run-cycle` | 4 | [x] |
| 10 | GET | `/api/distributor/bills` | 4 | [x] |
| 11 | GET | `/api/distributor/bills/{id}` | 4 | [x] |
| 12 | GET | `/api/distributor/bills/{id}/pdf` | 4 | [x] |
| 13 | POST | `/api/distributor/bills/{id}/payments` | 4 | [x] |
| 14 | POST | `/api/distributor/bills/{id}/adjustments` | 4 | [x] |
| 15 | POST | `/api/distributor/bills/{id}/void` | 4 | [x] |
| 16 | GET | `/api/distributor/billing/dues` | 4 | [x] |
| 17 | GET | `/api/customers/bills` | 4 | [x] |
| 18 | GET | `/api/customers/bills/{id}` | 4 | [x] |
| 19 | GET | `/api/customers/bills/{id}/pdf` | 4 | [x] |
| 20 | GET | `/api/notifications` | 4 | [x] |
| 21 | GET | `/api/notifications/unread-count` | 4 | [x] |
| 22 | PATCH | `/api/notifications/{id}/read` | 4 | [x] |
| 23 | POST | `/api/notifications/mark-all-read` | 4 | [x] |
| 24 | GET | `/api/admin/operations/deliveries` | 3–4 | [x] |
| 25 | GET | `/api/admin/operations/billing` | 4 | [x] |
| 26 | GET | `/api/admin/operations/exceptions` | 4 | [x] |
| 27 | PATCH | `/api/admin/delivery-items/{id}/override` | 4 | [x] |

**Phase 2 APIs: 27 / 27 implemented**

---

## 20. FE page checklist (quick reference)

| # | Route | Role | Sprint | Done |
|---|-------|------|--------|------|
| 1 | `/distributor/deliveries` | Distributor | 3 | [x] |
| 2 | `/distributor/deliveries/[date]` | Distributor | 3 | [~] |
| 3 | `/distributor/billing` | Distributor | 4 | [x] |
| 4 | `/distributor/billing/settings` | Distributor | 4 | [x] |
| 5 | `/distributor/billing/dues` | Distributor | 4 | [x] |
| 6 | `/distributor/bills/[id]` | Distributor | 4 | [x] |
| 7 | `/customer/deliveries` | Customer | 3 | [x] |
| 8 | `/customer/bills` | Customer | 4 | [x] |
| 9 | `/customer/bills/[id]` | Customer | 4 | [x] |
| 10 | `/admin/operations` | Admin | 3–4 | [x] |
| 11 | `/notifications` | All | 4 | [x] |

**Phase 2 routes: 10 / 11** (`[date]` route deferred — date picker on main deliveries page)

---

## 21. Out of scope (deferred — do not implement in Phase 2)

- [x] **Deferred** — Payment gateway → Phase 3
- [x] **Deferred** — Wallet balances → Phase 3
- [x] **Deferred** — SMS / WhatsApp / Email send → stub only; email → Phase 2.0
- [x] **Deferred** — Route optimization → Phase 4
- [x] **Deferred** — Delivery staff mobile app → Phase 3+
- [x] **Deferred** — Journey start ETA → Phase 2.0

---

## 23. Multi-tier product catalog (Admin global + Distributor private) — **0% · NOT STARTED**

**Goal:** Admin manages the default platform catalog. Distributors can add products **not** in the catalog; those stay visible only to that distributor and their customers until admin chooses to promote them to the global catalog.

**Current gap (Phase 1):** Products are seeded in `prisma/seed.ts` only. `GET /api/products` is read-only. No admin product UI. Distributors can only enable/disable master products and set pricing — they cannot create new catalog entries.

**Design reference:** See product vision in [00_IMPLEMENTATION_OVERVIEW.md](./00_IMPLEMENTATION_OVERVIEW.md) §7.5; extends Phase 1 §6 Master Product Catalog.

### 23.1 Data model & migrations

- [ ] **BE** — `ProductScope` enum: `GLOBAL` | `DISTRIBUTOR`
- [ ] **BE** — `Product` columns: `scope`, `ownerDistributorId` (nullable FK), `createdByRole`, `promotionStatus` (`NONE` | `PRIVATE` | `PENDING_REVIEW` | `PROMOTED` | `REJECTED`)
- [ ] **BE** — SKU rule: `GLOBAL` → unique platform-wide; `DISTRIBUTOR` → unique per `(ownerDistributorId, sku)` (or auto `PVT-{distributorId}-{slug}`)
- [ ] **BE** — Migrate existing seed products → `scope = GLOBAL`, `ownerDistributorId = null`
- [ ] **BE** — Index: `products (scope, active)`, `products (owner_distributor_id, active)`
- [ ] **BE** — Soft-delete / deactivate only when product referenced by subscriptions, deliveries, or bills

### 23.2 Visibility & authorization rules

- [ ] **BE** — **Admin:** full CRUD on `GLOBAL` products; read all `DISTRIBUTOR` products; promote / reject / keep-private
- [ ] **BE** — **Distributor:** enable/disable `GLOBAL` products (existing `distributor_products`); CRUD own `DISTRIBUTOR` products only
- [ ] **BE** — **Customer:** product lists scoped to **their distributor** — enabled globals + that distributor's private products with active pricing
- [ ] **BE** — **Other distributors / public:** no access to private products
- [ ] **BE** — Block cross-tenant access: distributor A never sees distributor B private products (403 on ID lookup)
- [ ] **BE** — Subscription / pricing validation uses scoped product list (no orphan private product from another distributor)

### 23.3 Backend APIs

- [ ] **BE** — `GET/POST/PATCH/DELETE /api/admin/products` — global catalog CRUD
- [ ] **BE** — `GET /api/admin/products/distributor-submissions` — private + `PENDING_REVIEW` with distributor context
- [ ] **BE** — `POST /api/admin/products/{id}/promote` — set `scope = GLOBAL`, clear owner, assign platform SKU if needed
- [ ] **BE** — `POST /api/admin/products/{id}/reject-promotion` — keep private or archive
- [ ] **BE** — `POST /api/distributor/products/custom` — create private product (+ optional first pricing row)
- [ ] **BE** — `PATCH/DELETE /api/distributor/products/custom/{id}` — edit/deactivate own private products
- [ ] **BE** — `POST /api/distributor/products/custom/{id}/request-promotion` — optional flag for admin review
- [ ] **BE** — Update `GET /api/distributor/products` — return `{ global: [...], custom: [...] }` or unified list with `scope` badge
- [ ] **BE** — Update customer discovery / subscribe endpoints to filter by distributor scope
- [ ] **BE** — Deprecate or restrict public `GET /api/products` to `GLOBAL` only (admin seed remains bootstrap, not runtime source of truth)

### 23.4 Admin frontend

- [ ] **FE** — Nav: **Products** under admin (`/admin/products`)
- [ ] **FE** — Global catalog table: name, SKU, category, unit, active, actions (edit / deactivate)
- [ ] **FE** — Create / edit global product form (name, SKU, category, species, unit)
- [ ] **FE** — **Distributor submissions** tab: private products + promotion requests
- [ ] **FE** — Actions: **Promote to catalog** (visible to all distributors) | **Keep private** | **Reject**
- [ ] **FE** — Promotion confirm modal: explain impact (all distributors can enable; existing subs for owner unchanged)

### 23.5 Distributor frontend

- [ ] **FE** — `/distributor/products` — split UI: **Platform catalog** (checkboxes, existing) + **My products** (custom list)
- [ ] **FE** — **Add custom product** form: name, category, unit, optional species, price / fat %
- [ ] **FE** — Edit / deactivate custom product (disabled if active subscriptions exist — show message)
- [ ] **FE** — Optional: **Request listing in platform catalog** button → flags product for admin review
- [ ] **FE** — Setup wizard step 2 updated for custom product creation (same rules as products page)
- [ ] **FE** — Subscribe / create-subscription flows show custom products alongside enabled globals (with visual badge)

### 23.6 Customer frontend

- [ ] **FE** — Distributor detail + subscribe pages show only that distributor's enabled globals + private products
- [ ] **FE** — Subscription edit product dropdown respects same scoped list (existing page, update data source)

### 23.7 Promotion workflow (admin decision)

- [ ] **Shared** — **Promote to global:** product becomes available in every distributor's catalog toggles (not auto-enabled); owner keeps it enabled
- [ ] **Shared** — **Keep private:** no change; only owner + their customers see it
- [ ] **Shared** — **Reject promotion request:** notify distributor; product stays private
- [ ] **BE** — Audit log: `PRODUCT_PROMOTED`, `PRODUCT_CREATED_PRIVATE`, `PRODUCT_PROMOTION_REJECTED`

### 23.8 Tests & QA

- [ ] **BE** — Unit: visibility filters per role
- [ ] **BE** — Integration: distributor creates private product → customer subscribes → other distributor cannot see product
- [ ] **BE** — Integration: admin promotes → second distributor can enable → customer of second distributor can subscribe
- [ ] **QA** — Billing / delivery line items still resolve product name after promotion
- [ ] **QA** — Seed + admin CRUD replaces manual `seed.ts` edits for day-to-day catalog changes

### 23.9 API quick reference (planned)

| # | Method | Endpoint | Role | Done |
|---|--------|----------|------|------|
| 28 | GET/POST | `/api/admin/products` | Admin | [ ] |
| 29 | PATCH/DELETE | `/api/admin/products/{id}` | Admin | [ ] |
| 30 | GET | `/api/admin/products/distributor-submissions` | Admin | [ ] |
| 31 | POST | `/api/admin/products/{id}/promote` | Admin | [ ] |
| 32 | POST | `/api/admin/products/{id}/reject-promotion` | Admin | [ ] |
| 33 | POST | `/api/distributor/products/custom` | Distributor | [ ] |
| 34 | PATCH/DELETE | `/api/distributor/products/custom/{id}` | Distributor | [ ] |
| 35 | POST | `/api/distributor/products/custom/{id}/request-promotion` | Distributor | [ ] |

### 23.10 FE routes (planned)

| # | Route | Role | Done |
|---|-------|------|------|
| 12 | `/admin/products` | Admin | [ ] |
| 13 | `/admin/products/submissions` | Admin | [ ] |

**Status:** Achievable on current architecture (`Product`, `DistributorProduct`, `Pricing`, `Subscription` already share `product_id`). Requires schema extension + scoped queries — no parallel catalog table needed.

---

## 22. Handoff to Phase 3

- [x] `bills.total`, `payments`, `delivery_items.delivered_qty` schemas stable
- [ ] Bill outstanding balance query pattern documented for gateway settlement
- [ ] Payment history unified ledger design noted for Phase 3
- [ ] Phase 2 checklist 100% or explicit defer sign-off

---

## Remaining backlog (priority order)

1. **Tests** — delivery generation unit tests (§2.2), billing unit tests (§5.6), integration/E2E (§13)
2. **Distributor delivery UI** — skip/fail modal, drag reorder (§3.2)
3. **Distributor billing UI** — filters, adjustments, void, payment history (§6.2–6.3)
4. **Notifications FE** — dropdown preview + click deep links (§9)
5. **Admin** — exception queue table UI (§10.2)
6. **i18n** — Hindi for `delivery.*`, `billing.*`, `notifications.*`
7. **DevOps** — README, `.env.example`, seed data, job manual triggers
8. **UAT** — runbook, pilot seed, sign-off (§17)
9. **Phase 2.0** — journey ETA + email
10. **Product catalog governance** — admin CRUD + distributor private products + promotion (§23)

---

**Owner tracking:** Labels: `phase-2`, `delivery`, `billing`, `notifications`, `frontend`, `backend`, `qa`.

**Status:** Core modules implemented module-wise; polish, tests, and UAT pending sign-off.
