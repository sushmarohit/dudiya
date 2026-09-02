# Gap Closure Implementation Plan

**Source:** [`docs/REQUIREMENTS_GAP_ANALYSIS.md`](../REQUIREMENTS_GAP_ANALYSIS.md)  
**Principle:** Reuse what exists. Ship thin slices. No history transfer on distributor change.  
**Stack:** NestJS · Prisma · Next.js · TanStack Query · existing `NotificationService` · existing `showToast`  
**Out of scope here:** Email/SMS/WhatsApp, FCM push, live GPS, payment gateway (Phase 3+)  

**Implementation status (2 Sep 2026):** W0–W5 **code complete**. Manual UAT open. W6 deferred.

| ID | Workstream | Code | UAT |
|----|------------|------|-----|
| W0 | Notification UX | ✅ | ⬜ |
| W1 | Start fresh after settlement | ✅ | ⬜ |
| W2 | Custom radius + name search | ✅ | ⬜ |
| W3 | Skip-day CTA | ✅ | ⬜ |
| W4 | Unavailable days | ✅ | ⬜ |
| W5 | Journey start + ETA (in-app) | ✅ | ⬜ |
| W6 | Extra product (stretch) | ❌ Deferred | — |

---

## Clarified product rules

| Topic | Decision |
|-------|----------|
| **Change distributor (C2.5)** | Customer ends subscription → mutual confirm → **settlement bill** → subscription `CANCELLED`. Then customer **starts fresh** (find distributor → new subscribe). **No** history/pause/extra/bill transfer. |
| **Notifications** | Every critical event: clear **title + body**, actionable **button** where useful, solid **notifications page**, and an **arrival alert** (toast + unread badge) when a new notification lands. |

---

## Reuse inventory (do not rebuild)

| Existing asset | Reuse for |
|----------------|-----------|
| `SubscriptionEndService` + `subscription-end-panel` | End → settlement → cancelled |
| `BillingService.createSettlementBill` / preview | Settlement only |
| `NotificationService.create` + `eventId` dedupe | All new events |
| `GET/PATCH /notifications*` + hooks | Inbox + read state |
| `NotificationBell` + unread count | Badge |
| `showToast` in `providers.tsx` | Arrival alert |
| `findNearbyDistributors` | Discovery after cancel |
| `SubscriptionPause` + cutoff | Skip day + unavailable day pattern |
| `DeliveryGenerationService` pause skip | Also skip distributor holidays |
| `DeliveryService` list/export/`SKIPPED` | Journey list + mark status |
| Phase 2.0 doc (ETA formula) | Journey slice only (in-app, no email yet) |

---

## Workstreams overview

| ID | Workstream | Effort | Depends on |
|----|------------|--------|------------|
| **W0** | Notification UX polish (page, copy, CTA, arrival alert) | S | — |
| **W1** | End → settle → start fresh (customer UX) | S | W0 copy |
| **W2** | Custom radius + name search | S | — |
| **W3** | Customer skip-day CTA | S | W0 |
| **W4** | Distributor unavailable days | M | W0, reuse pause gen |
| **W5** | Journey start + ETA notify (in-app only) | M | W0 |
| **W6** | Extra product / variation (optional stretch) | M | W0 |

**Suggested order:** W0 → W1 → W2 → W3 → W4 → W5 → (W6 if needed)

---

# W0 — Notification UX (foundation)

### Goal
Reuse the engine; make notifications feel finished: badge, toast on arrive, clean page, proper messages + buttons.

### Current baseline
- API: create / list / unread-count / mark-read / mark-all-read ✅  
- UI: bell → `/notifications` list ✅ (basic)  
- Poll: unread every 60s ✅  
- Gap: no arrival toast, weak copy, no deep-link CTA, page sparse

### Design

```
New notification persisted
        ↓
Client polls unread-count (shorten interval while dashboard open)
        ↓
count increased → showToast(title or short body) + bump badge
        ↓
User opens /notifications → typed rows → primary CTA button → mark read
```

### Backend (minimal)
- [ ] Add new `NotificationType` values only when a workstream needs them (see W4/W5)
- [ ] Keep titles/bodies **user-facing English** for now; add i18n keys on FE for display where possible
- [ ] Ensure every `create()` call includes useful `payload` (`subscriptionId`, `billId`, `deliveryId`, `date`, etc.) for deep links
- [ ] Optional: `GET /notifications/unread-count` returns `{ count, latestCreatedAt }` to detect “new since last poll” without listing

### Frontend
- [ ] **Arrival alert:** in `useUnreadNotificationCount` (or thin `useNotificationArrivalWatcher`), compare previous count / `latestCreatedAt`; on increase call `showToast(..., "success"|"info")`
- [ ] Poll interval: **15–20s** while authenticated dashboard mounted; keep 60s elsewhere if needed
- [ ] Upgrade `NotificationBell`: clear hit target, aria-label, badge
- [ ] Upgrade `/notifications` page:
  - [ ] Empty state
  - [ ] Unread vs read visual
  - [ ] Type icon / label
  - [ ] Relative time
  - [ ] **CTA button** per type (see table)
  - [ ] Tap row or CTA → navigate + mark read
- [ ] Shared helper: `getNotificationAction(n) → { label, href } | null`
- [ ] i18n keys under `notifications.*` for titles fallbacks + CTA labels (en/hi)

### CTA map (reuse existing routes)

| Type | CTA label | Href |
|------|-----------|------|
| `SUBSCRIPTION_ACTIVATED` | View subscription | `/customer/subscriptions/:id` or distributor equivalent |
| `PAUSE_APPLIED` | View subscription | distributor sub detail |
| `EXTRA_MILK_REQUEST` | View subscription | distributor sub detail |
| `BILL_GENERATED` | View bill | role bills detail |
| `PAYMENT_RECORDED` | View bill | role bills detail |
| `DISTRIBUTOR_APPROVED` | Continue setup | `/distributor/setup` or dashboard |
| `DELIVERY_FAILED_SKIPPED` | View deliveries | role deliveries |
| `DELIVERY_REMINDER` | View deliveries | customer deliveries |
| `SUBSCRIPTION_END_*` | Review end / settlement | sub detail (end panel) |
| *(W4)* unavailable | OK / View deliveries | customer deliveries |
| *(W5)* journey started | Today's delivery | customer deliveries |

### Acceptance
- [ ] New notification → toast within one poll cycle  
- [ ] Badge matches unread  
- [ ] Page shows message + button when action exists  
- [ ] Mark read / mark all still work  

### Files (likely)
- `frontend/src/hooks/use-notifications.ts`
- `frontend/src/components/notifications/notification-bell.tsx`
- `frontend/src/components/notifications/notification-list-item.tsx` *(new, thin)*
- `frontend/src/lib/notification-actions.ts` *(new)*
- `frontend/src/app/.../notifications/page.tsx`
- `frontend` message catalogs `en` / `hi`

---

# W1 — End subscription → settlement → start fresh

### Goal
Satisfy **C2.5** without transfer history.

### Product flow

```
Active sub → Request end → Other party confirms
    → Settlement bill created → status CANCELLED
    → Customer sees “Start fresh” → Find distributor → New subscribe
```

**Explicit non-goals:** migrate pauses, extras, old bills, or delivery history to the new distributor.

### Backend
- [ ] No new transfer APIs  
- [ ] Harden copy in end-confirm notifications: mention settlement + that a **new** subscription is required to continue  
- [ ] Gate (already expected): customer cannot create a second active sub with same distributor+product if business rules already forbid — keep existing rules; do **not** auto-cancel siblings  

### Frontend (reuse `SubscriptionEndPanel`)
- [ ] After `CANCELLED` + settlement present, show clear panel:
  - Settlement amount + link to bill (existing)
  - Primary button: **Find a distributor** → `/customer/find-distributor`
  - Secondary: **View bills**
- [ ] Short helper text: *“Your previous subscription is closed. Choose a distributor to start a new subscription.”*
- [ ] Optional: on find-distributor, soft banner if user has zero `ACTIVE` subscriptions  

### Acceptance
- [ ] Cancel path unchanged functionally  
- [ ] No transfer of history  
- [ ] Cancelled customer can subscribe to same or different distributor as a **new** sub  
- [ ] Notifications use W0 CTA → end panel / bill  

### Files
- `frontend/.../subscription-end-panel.tsx`
- `frontend/.../customer/subscriptions/[id]/page.tsx`
- `backend/.../subscription-end.service.ts` (message text only)

---

# W2 — Discovery: custom radius + name search

### Goal
Close C2 radius custom + C3 name search. Reuse nearby eligibility rules.

### Backend
- [ ] `GET /customers/distributors/search?q=&page=`  
  - Same eligibility as nearby: `GO_LIVE`, identity verified, active pricing + slots  
  - `businessName` / city `ILIKE %q%` (min 2 chars)  
  - Return same shape fields as nearby items (without distance if no lat/lng)  
- [ ] Keep `GET .../nearby` as-is; allow any `radiusKm` (already)

### Frontend (`find-distributor`)
- [ ] Radius: keep presets **+** custom number input (1–50 km clamp)  
- [ ] Tabs or toggle: **Near me** | **Search by name**  
- [ ] Name search box → call search API → reuse result card component  

### Acceptance
- [ ] Custom 7 km works  
- [ ] Name “Mohan” returns live distributors only  
- [ ] Unverified customer still gated (existing identity gate)  

### Files
- `backend/src/customer/customer.controller.ts` / `customer.service.ts`
- `frontend/.../customer/find-distributor/page.tsx`
- `frontend/src/hooks/use-customer.ts`

---

# W3 — Customer skip delivery (early notify)

### Goal
Clear **Skip day** UX on top of `SubscriptionPause` (no new table).

### Backend
- [ ] Optional thin endpoint `POST /customers/subscriptions/:id/skip` with `{ date }` → creates pause `start=end=date` via existing pause logic + `PAUSE_APPLIED` notify  
- [ ] Or: FE only posts pause with same start/end — prefer **FE-only** if API already validates range  

### Frontend
- [ ] On customer subscription detail: **Skip a day** card (date picker + submit)  
- [ ] Keep existing pause range for vacations  
- [ ] Success toast + distributor gets existing pause notification (improve copy: “Customer skipped delivery on {date}”)  

### Acceptance
- [ ] Skip before cutoff → no delivery item that day  
- [ ] After cutoff → error (existing)  
- [ ] Distributor notified  

---

# W4 — Distributor unavailable day + notify customers

### Goal
Close D10 + C6.

### Data (lean)
- [ ] New model `DistributorUnavailableDay`  
  - `id`, `distributorId`, `date`, `reason?`, `createdAt`  
  - `@@unique([distributorId, date])`

### Backend
- [ ] CRUD: `POST/GET/DELETE /distributor/unavailable-days`  
- [ ] On create: fan-out `NotificationService.createMany` to customers with **ACTIVE** subs for that distributor (dedupe `eventId`: `dist-unavailable:{distributorId}:{date}:{customerUserId}`)  
- [ ] New enum: `DISTRIBUTOR_UNAVAILABLE`  
- [ ] `DeliveryGenerationService`: if date is unavailable for distributor → **skip generating items** (same as pause)  
- [ ] If items already generated: bulk mark `SKIPPED` + notify (reuse skip notify path) or block create after generation with clear error — pick one rule and document it (**prefer:** allow create → cancel pending items + notify)

### Frontend
- [ ] Distributor deliveries or settings: **Mark day unavailable** (date + optional reason + confirm)  
- [ ] List upcoming unavailable days + delete  
- [ ] Customer notification CTA → deliveries page  

### Acceptance
- [ ] Mark tomorrow unavailable → all active customers notified  
- [ ] No deliveries generated that day  
- [ ] Export/list empty or skipped consistently  

### Files
- `backend/prisma/schema.prisma` + migration  
- `backend/src/distributor/*`  
- `backend/src/delivery/delivery-generation.service.ts`  
- `frontend` distributor UI + W0 type/CTA  

---

# W5 — Journey start notification (in-app only)

### Goal
Close D8 / variation timing gate. Lean slice of Phase 2.0 **without email**.

### Data (lean)
- [ ] Extend `Delivery` (run) or add `DeliveryJourney`:  
  - `status`: `PLANNED | IN_PROGRESS | COMPLETED`  
  - `startedAt`, `completedAt`  
  - reuse existing `routeOrder` on items  

### Backend
- [ ] `POST /distributor/deliveries/start-journey` `{ date, slotId }`  
  - Require items exist (generate if empty)  
  - Set journey `IN_PROGRESS` + `startedAt`  
  - Compute ETA per stop: `startedAt + (order-1) * minutesPerStop` (default 8; optional profile field later)  
  - Persist ETA on item (`estimatedArrivalAt`) or payload-only for v1  
  - Fan-out `DELIVERY_JOURNEY_STARTED` per customer with ETA in body + payload  
- [ ] `POST .../complete-journey`  
- [ ] Optional: block W3/W4/extra after journey started for that date/slot (cutoff = journey start) — document as rule  

### Frontend
- [ ] Distributor deliveries page: **Start journey** button (confirm) → **Complete journey**  
- [ ] Customer: toast + notification CTA; optional small “Today’s ETA” on deliveries page  

### Acceptance
- [ ] Start → each pending customer gets notification with ETA window text  
- [ ] Arrival toast via W0  
- [ ] Complete journey closes run  

### Files
- Reuse Phase 2.0 ETA formula; ignore email section  
- `delivery.controller/service` · deliveries page · schema  

---

# W6 — Stretch: one-day extra product (optional)

Only if “need this or that also” must mean a **different product**, not more qty.

- [ ] Reuse `SubscriptionExtra` **or** add `SubscriptionExtra.productId?` + qty  
- [ ] Generation folds extra product as additional `DeliveryItem`  
- [ ] Notify distributor (`EXTRA_MILK_REQUEST` or new `EXTRA_PRODUCT_REQUEST`)  
- Prefer deferring if extra qty + second subscription covers MVP.

---

## Master checklist (track here)

### W0 Notification UX
- [x] Arrival toast watcher  
- [x] Faster unread poll on dashboard  
- [x] Bell polish  
- [x] Notifications page empty/unread/CTA  
- [x] `getNotificationAction` deep links  
- [x] i18n CTA labels  
- [x] Unread-count returns latestCreatedAt / title / body  

### W1 Start fresh after settlement
- [x] Post-cancel CTA → find distributor  
- [x] Copy: no history transfer  
- [x] End notification messages updated  
- [ ] Manual UAT: end → settle → new subscribe  

### W2 Discovery
- [x] Search-by-name API  
- [x] Custom radius UI  
- [x] Name search UI  
- [x] Shared result card  

### W3 Skip day
- [x] Skip-day UI (pause same day)  
- [x] Copy for distributor notify  

### W4 Unavailable days
- [x] Schema + migration  
- [x] Distributor CRUD API  
- [x] Fan-out notify  
- [x] Generation respects unavailable  
- [x] Distributor UI  
- [x] FE types + CTA  

### W5 Journey
- [x] Schema fields  
- [x] Start / complete APIs  
- [x] ETA + fan-out notify  
- [x] Distributor buttons  
- [ ] Customer ETA display (minimal) — ETA in notification body for now  

### W6 Stretch
- [ ] Decide go / no-go  
- [ ] Implement only if go  

### Cross-cutting QA
- [ ] Role smoke: distributor + customer  
- [ ] Unread badge accuracy  
- [ ] No duplicate notifies (`eventId`)  
- [x] en/hi strings for new UI  
- [x] Update `REQUIREMENTS_GAP_ANALYSIS.md` statuses after ship  
- [x] Local DB synced (`prisma db push` on port **5435**; migration history marked applied)  

---

## Definition of done (gap closure MVP)

| Requirement | Done when | Status |
|-------------|-----------|--------|
| C2.5 change distributor | End + settlement; UI guides **start fresh**; no transfer | ✅ Code |
| Notifications | Toast on arrive; badge; page with message + button | ✅ Code |
| D10 / C6 unavailable | Distributor marks day; customers notified; no deliveries | ✅ Code |
| D8 journey notify | Start journey notifies customers with ETA (in-app) | ✅ Code |
| C2/C3 discovery | Custom radius + name search | ✅ Code |
| C8 skip early | Skip-day CTA + distributor notify before cutoff | ✅ Code |
| Manual UAT A–F | Checklist pass | ⬜ Open |

---

## Effort sketch

| Slice | Dev days (1 eng) |
|-------|------------------|
| W0 | 1.5–2 |
| W1 | 0.5–1 |
| W2 | 1–1.5 |
| W3 | 0.5 |
| W4 | 2–3 |
| W5 | 2.5–3.5 |
| **MVP total** | **~8–12 days** |

---

## Explicitly deferred

- Email / SMS / WhatsApp  
- History transfer between distributors  
- Live GPS / dynamic ETA  
- Payment gateway  
- Native mobile / FCM  

---

*Plan aligns with gap analysis; C2.5 clarified as settlement then start fresh (no transfer).*
