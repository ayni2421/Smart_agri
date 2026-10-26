# SAMIC Platform — Implementation Tasks

## Phase 1 — Foundation (COMPLETE ✓)
All Phase 1 tasks have been implemented in the initial scaffold.

- [x] 1.1 SRS gap decisions documented (account creation, ranking formula, order states, units, reviewer scope)
- [x] 1.2 Backend project structure (Express, Mongoose, middleware, error handling)
- [x] 1.3 MongoDB models: User, Commodity, Market, PriceObservation, Order, SupplierProfile, Inventory, ProduceBatch, Delivery, Transaction, Notification, AuditLog
- [x] 1.4 Authentication middleware (JWT, role authorization, account status check)
- [x] 1.5 Order state machine with validated transitions and history (FR-ORD-07, FR-ORD-11)
- [x] 1.6 Unit conversion utility: kg ↔ quintal ↔ tonne (FR-COM-04)
- [x] 1.7 Supplier ranking service — weighted deterministic formula (FR-SUP)
- [x] 1.8 Anomaly detection service — 6 rules (FR-ANOM)
- [x] 1.9 Audit logging utility (FR-REP-04)
- [x] 1.10 Seed script — 3 commodities, 3 markets, 21 users, 6 months synthetic prices, 5 orders (Section 5.5.1)
- [x] 1.11 Unit tests — state machine (15 cases), ranking (9 cases), anomaly (12 cases), units (6 cases) = 42 tests passing
- [x] 1.12 API tests — auth register, login, me (12 cases)
- [x] 1.13 OpenAPI specification (docs/openapi.yaml — NFR-MNT-04)
- [x] 1.14 Frontend scaffold — React + Vite, router, auth context, API client
- [x] 1.15 Core UI pages: Login, Register, Dashboard, Prices, Orders, Inventory, Anomalies, Admin

---

## Phase 2 — Complete UI and API integration
Dependencies: Phase 1 complete, MongoDB running

- [ ] 2.1 Price submission form with anomaly feedback display
- [ ] 2.2 Price comparison view with descriptive statistics and charts (Recharts)
- [ ] 2.3 Supplier ranking UI — show score breakdown per supplier (FR-SUP-04)
- [ ] 2.4 Order detail page with full state history timeline
- [ ] 2.5 Produce batch creation and traceability view (FR-INV-08, FR-INV-09)
- [ ] 2.6 Delivery management page for transporters
- [ ] 2.7 Transaction record management page
- [ ] 2.8 Notifications panel with unread count
- [ ] 2.9 Reports page — market summary and supply/demand charts
- [ ] 2.10 Admin: commodity and market management forms
- [ ] 2.11 Admin: data reviewer scope assignment UI (FR-AUTH-11)
- [ ] 2.12 Mobile-responsive layout improvements (NFR-COMP-02)

**Acceptance criteria:**
- All Must Have functional requirements have corresponding UI flows
- Synthetic data labeled clearly throughout (FR-DATA-05, BR-03)
- All forms show required-field indicators and validation errors (NFR-USE-02)

---

## Phase 3 — Testing, security, and quality
Dependencies: Phase 2 complete

- [ ] 3.1 API tests for orders (create, all valid transitions, invalid transition returns 422)
- [ ] 3.2 API tests for price submission (accepted, rejected, flagged, agent-mediated)
- [ ] 3.3 API tests for supplier ranking (returns ranked list, baseline, handles no eligible suppliers)
- [ ] 3.4 API tests for inventory and batch traceability
- [ ] 3.5 API tests for delivery state transitions
- [ ] 3.6 API tests for audit log (admin reads, no modification routes)
- [ ] 3.7 Security tests: unauthorized access returns 401/403 for all protected routes
- [ ] 3.8 Security tests: data_reviewer out-of-scope review returns 403
- [ ] 3.9 Traceability test: reconstruct batch → inventory → order → delivery chain (FR-INV-10)
- [ ] 3.10 Validation tests: missing required fields return 400 with field details
- [ ] 3.11 FR-DATA-09 test: confirm re-review of already-reviewed observation returns 409
- [ ] 3.12 Performance measurement: document 95th-percentile response times under seeded dataset (NFR-PERF-01, NFR-PERF-02)
- [ ] 3.13 Requirements-to-test traceability matrix (NFR-TST-01) — link each FR to its test case and result

**Acceptance criteria:**
- All Must Have security requirements verified (NFR-SEC-01 through -05, -07, -11)
- State machine: all documented valid transitions tested; all documented invalid transitions tested
- Traceability chain reconstructed for at least 3 seed records

---

## Phase 4 — Analytical evaluation and conditional features
Dependencies: Phase 3 complete, advisor decisions recorded

- [ ] 4.1 Data availability assessment report (Section 5.5, Section 2.6.1)
  - Document observation period, coverage, missingness for each commodity-market pair
  - Determine whether forecasting trigger is met
- [ ] 4.2 Supplier ranking evaluation — compare ranked result against lowest-price baseline for 3 test cases (FR-SUP-08)
- [ ] 4.3 Anomaly detection evaluation — document rule precision using known test cases; note FR-ANOM-09 applies only if labeled dataset available
- [ ] 4.4 Confirm or record decision on CSV export (FR-INT-09 trigger — Phase 4 design review)
- [ ] 4.5 If forecasting trigger met: implement descriptive time-series analysis; record MAE/RMSE only if evaluation dataset exists
- [ ] 4.6 If payment gateway trigger met: implement sandbox integration per FR-PAY-05 through FR-PAY-08
- [ ] 4.7 If SMS trigger met: implement provider integration per FR-NOT-05

---

## Phase 5 — Final report and documentation
Dependencies: All prior phases complete or documented as not implemented

- [ ] 5.1 Final project report
  - Implemented features and evidence
  - Not-implemented conditional features with unmet-trigger documentation (BR-14)
  - Limitations, risks, and future enhancements
- [ ] 5.2 Update OpenAPI spec to reflect any Phase 2–4 additions (NFR-MNT-04)
- [ ] 5.3 User and developer setup documentation (NFR-MNT-03)
- [ ] 5.4 Seed data restoration instructions verified (NFR-REL-05)
- [ ] 5.5 Finalize requirements-to-test traceability matrix (Section 10.5)
- [ ] 5.6 Usability review with representative users if available (NFR-USE-07)
- [ ] 5.7 Document any compatibility limitations found during testing (NFR-COMP-04)

---

## Blocked / waiting on advisor

- [ ] Confirm initial commodity and market set (SRS Section 13)
- [ ] Approve assumption A-09 (agent-mediated farmer access)
- [ ] Review and approve SRS Gap Decisions Addendum (FR-AUTH-10, FR-AUTH-11, FR-ORD-11, FR-COM-04 revised, FR-SUP formula)
- [ ] Data source review — approve synthetic data strategy
- [ ] Decision on payment gateway and SMS inclusion triggers

---

## Test coverage summary (Phase 1 baseline)

| Area | Tests | Status |
|---|---|---|
| Unit conversion | 6 | ✓ All passing |
| Order state machine | 15 | ✓ All passing |
| Supplier ranking | 9 | ✓ All passing |
| Anomaly detection | 12 | ✓ All passing |
| Auth API | 12 | Implemented — requires MongoDB to run |
| Orders API | 0 | Phase 3 |
| Prices API | 0 | Phase 3 |
| Traceability | 0 | Phase 3 |
