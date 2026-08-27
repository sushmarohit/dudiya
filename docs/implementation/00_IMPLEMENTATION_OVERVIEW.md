# Milk Distribution SaaS � Implementation Overview

**Document status:** Consolidated from Product Document v1, PRD v2, Master PRD v3, Product Bible v4/v5, Enterprise PRD v6, Implementation Guide v7, and Enterprise Execution Book v8.

**Last updated:** June 2026

---

## 1. Product Vision

Build a scalable, multi-tenant SaaS platform for milk distributors, dairy businesses, and consumers across India. The platform digitizes subscription-based dairy delivery: distributor operations, customer self-service, delivery list generation, usage-based billing, and platform administration.

## 2. Business Objectives

| Objective | Success Signal |
|-----------|----------------|
| Digitize distributor operations | Paper ledgers replaced by digital customer/subscription records |
| Subscription automation | Daily/alternate/weekday/weekly/monthly plans run without manual scheduling |
| Billing automation | Invoices generated from delivered quantities with pause/extra adjustments |
| Distributor growth | Verified distributors onboard and go live via setup wizard |
| Customer retention | Pause/extra requests, notifications, transparent billing |

## 3. Stakeholders & Roles

| Role | Description |
|------|-------------|
| **Platform Owner / Super Admin** | Verification, platform KPIs, SaaS plans, lifecycle oversight |
| **Distributor** | Pricing, slots, customer onboarding, subscriptions, delivery lists, billing, collections |
| **Customer** | Distributor discovery, subscriptions, pause/extra requests, billing |
| **Delivery Staff** | Future role � route execution, delivery status updates |

## 4. Customer Onboarding � Dual Path (Confirmed)

Both onboarding paths are **in scope** and must be supported from Phase 1.

### Address model (Urban + Rural)

Structured addresses support flat/building/enterprise (urban) and village/landmark (rural), with map pin for exact coordinates. See `backend/src/common/address/` and `frontend/src/components/address/`.

### Path A � Distributor-Led Onboarding

```
Distributor registers ? Admin approves ? Setup wizard ? Go live
    ? Distributor adds customer (name, phone, address, slot)
    ? Distributor creates subscription on behalf of customer
    ? Customer receives invite / first login to view account
```

**Use case:** Existing walk-in customers, phone orders, field sales, legacy ledger migration.

### Path B � Customer Self-Onboarding (Discovery)

```
Customer registers ? Sets delivery address (lat/lng or geocoded)
    ? Find Distributor: filter by distance radius (e.g. 1 / 3 / 5 / 10 km)
    ? View distributor profile, products, fat-based pricing, slots
    ? Select slot ? Start subscription (if distributor is live + ready)
```

**Use case:** New customers searching for nearby milk vendors; marketplace-style discovery.

**Readiness gate (both paths):** Customer may subscribe only when distributor has:
- Admin approval status = `approved`
- Active product catalog with pricing
- At least one active delivery slot
- Setup wizard completion = `go_live`

## 5. Phase Roadmap Summary

| Phase | Focus | Duration (est.) | Doc |
|-------|--------|-----------------|-----|
| **Phase 1** | Core platform: Auth, RBAC, distributor setup, dual onboarding, subscriptions | 8�10 weeks | [Plan](./PHASE_1_Core_Platform.md) � [Checklist](./PHASE_1_Checklist.md) |
| **Phase 2** | Delivery engine, billing automation, in-app notifications | 6�8 weeks | [Plan](./PHASE_2_Delivery_Billing_Notifications.md) · [Checklist](./PHASE_2_Checklist.md) |
| **Phase 2.0** | Journey start ETAs, arrival notifications, email | 2–3 weeks | [PHASE_2.0_Delivery_Journey_Email_Notifications.md](./PHASE_2.0_Delivery_Journey_Email_Notifications.md) |
| **Phase 3** | Payments, wallets, OTP login, mobile-responsive UX | 6�8 weeks | [PHASE_3_Payments_Mobile.md](./PHASE_3_Payments_Mobile.md) |
| **Phase 4** | Route optimization, analytics, loyalty programs | 8�10 weeks | [PHASE_4_Analytics_Route_Loyalty.md](./PHASE_4_Analytics_Route_Loyalty.md) |
| **Phase 5** | IoT dairy ecosystem, enterprise integrations, scale | 12+ weeks | [PHASE_5_IoT_Enterprise.md](./PHASE_5_IoT_Enterprise.md) |

## 6. Release Strategy

```
Alpha (internal) ? Beta (select distributors) ? Pilot (1�3 cities) ? Production rollout
```

Each phase completes with: unit + integration + E2E tests, UAT sign-off, security review, and deployment checklist.

## 7. Cross-Cutting Concerns (All Phases)

### 7.1 Security

- JWT access tokens + refresh token rotation
- RBAC enforced at API and UI layer
- Input validation on all endpoints
- Audit trails for approval workflows and billing changes
- Secrets via environment configuration (never committed)

### 7.2 Database Domains (Core)

`Users`, `DistributorProfiles`, `CustomerProfiles`, `Products`, `Pricing`, `DeliverySlots`, `Subscriptions`, `Deliveries`, `Bills`, `Payments`, `Notifications`

### 7.3 API Domains

`Auth`, `Admin`, `Distributor`, `Customer`, `Subscription`, `Delivery`, `Billing`, `Notification`

### 7.4 Non-Functional Requirements

- **Performance:** API p95 < 500ms for read-heavy dashboards
- **Availability:** 99.5% uptime target for production
- **Scalability:** Multi-tenant isolation; horizontal scaling of API tier
- **Observability:** Structured logging, metrics, alerting, backup/restore drills

### 7.5 Product Catalog (Baseline)

Milk (Cow, Buffalo, Goat, Camel + fat % variants), Curd, Paneer, Eggs, Lassi, Ghee, Butter, Khoya

### 7.6 Subscription Frequencies

Daily, Alternate Day, Weekdays, Weekly, Monthly � future: custom schedules, vacation mode

## 8. Sprint Mapping (v8 Execution Book)

| Sprint | Phase alignment | Deliverable |
|--------|-----------------|-------------|
| Sprint 1 | Phase 1 | Core auth, RBAC, registration flows |
| Sprint 2 | Phase 1 | Subscriptions + distributor setup wizard |
| Sprint 3 | Phase 2 | Delivery list generation |
| Sprint 4 | Phase 2 | Billing engine |
| Sprint 5 | Phase 3 | Payments foundation |

Phases 4�5 extend beyond initial sprints into quarterly milestones.

## 9. KPIs (Platform)

- Active subscriptions (count, MRR equivalent)
- Distributor growth (verified, go-live rate)
- Delivery success rate
- Billing collection rate / dues aging
- Customer churn and pause frequency
- Self-onboarding vs distributor-led ratio

## 10. Document Index

| Source PDF | Primary contribution |
|------------|---------------------|
| Product Document v1 | MVP status, core flow, readiness rules |
| PRD v2 | Module inventory, onboarding flows |
| Master PRD v3 | Milk variants, pause/extra logic, phase roadmap |
| Product Bible v4 | Engine rules, development phases |
| Enterprise Product Bible v5 | Business model, MVP?Enterprise roadmap |
| Enterprise PRD v6 | RBAC matrix, API inventory, NFRs, testing |
| Implementation Guide v7 | Screen specs, user stories, acceptance criteria |
| Enterprise Execution Book v8 | Sprint roadmap, deployment checklist, decision trees |

### Implementation plans (Markdown)

| Document | Focus |
|----------|--------|
| [PHASE_1_Core_Platform.md](./PHASE_1_Core_Platform.md) | Auth, onboarding, subscriptions |
| [PHASE_2_Delivery_Billing_Notifications.md](./PHASE_2_Delivery_Billing_Notifications.md) | Delivery lists, billing, notifications |
| [PHASE_2_Checklist.md](./PHASE_2_Checklist.md) | Phase 2 FE/BE implementation checklist |
| [PHASE_2.0_Delivery_Journey_Email_Notifications.md](./PHASE_2.0_Delivery_Journey_Email_Notifications.md) | Journey start ETAs, email notifications |
| [I18N_English_Hindi_Implementation_Plan.md](./I18N_English_Hindi_Implementation_Plan.md) | English + Hindi UI |
| [KYC_Inclusive_Implementation_Plan.md](./KYC_Inclusive_Implementation_Plan.md) | Tiered KYC — inclusive of small farmers (planning only) |

---

**Next step:** Execute [Phase 1](./PHASE_1_Core_Platform.md) before any downstream phase. Phase 2 depends on subscription and onboarding data model stability from Phase 1.
