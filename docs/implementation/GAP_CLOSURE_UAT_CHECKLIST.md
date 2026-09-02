# Gap Closure UAT Checklist

**Env:** Postgres `localhost:5435` · API `:3001` · Web `:3000`  
**Admin:** `admin@milk.local` / `Admin@123`  
**Last code re-check:** 2 September 2026  

Legend: ✅ code verified in repo · ⬜ manual test still open

---

## Implementation status (code)

| Workstream | Code | Evidence (high level) |
|------------|------|------------------------|
| W0 Notifications | ✅ | `NotificationArrivalWatcher`, CTA inbox, unread poll + latest payload |
| W1 Start fresh | ✅ | `subscription-end-panel` Find distributor CTA; end notify `startFresh` |
| W2 Discovery | ✅ | Custom radius + `/customers/distributors/search` + name UI |
| W3 Skip day | ✅ | Skip card on customer subscription (same-day pause) |
| W4 Unavailable | ✅ | `unavailable-days` API/UI; generation skip; fan-out notify |
| W5 Journey | ✅ | `start-journey` / `complete-journey`; ETA notify |
| W6 Extra product | ❌ | Deferred stretch |

---

## Setup (one-time per machine)

- [x] Docker Postgres up on **5435**
- [x] `backend/.env` + schema sync + seed
- [x] Feature flags ON (`backend/.env` + `frontend/.env.local`)
- [x] API running — http://localhost:3001/api/docs (verified)
- [ ] Frontend restarted after `.env.local` (confirm flags in UI)

---

## Manual smoke tests

### A. Notifications (W0) — code ✅
- [ ] Log in → navbar **bell** visible
- [ ] Trigger event → **toast** within ~15s
- [ ] `/notifications` → unread styling + **CTA** navigates

### B. Start fresh after settlement (W1) — code ✅
- [ ] End request → both confirm → settlement
- [ ] Cancelled UI shows **Find a distributor**
- [ ] New subscribe works (no history transfer)

### C. Discovery (W2) — code ✅
- [ ] Custom km radius works
- [ ] **Search by name** returns live distributors

### D. Skip day (W3) — code ✅
- [ ] Customer **Skip a day** → distributor notified

### E. Unavailable day (W4) — code ✅
- [ ] Distributor **Mark unavailable**
- [ ] Customers notified
- [ ] Generate that day → empty / skipped

### F. Journey (W5) — code ✅
- [ ] Generate list → **Start journey**
- [ ] Customers get on-the-way + ETA message
- [ ] **Complete journey** succeeds

---

## Pass criteria

All A–F checked without API 500s.

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | | | |
| 2 | | | |

---

## After UAT pass

- [ ] Tick remaining Manual UAT boxes in `GAP_CLOSURE_IMPLEMENTATION_PLAN.md`
- [ ] Note any follow-ups (ETA card, W6, email) in gap analysis backlog
