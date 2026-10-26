# SAMIC Platform — Requirements

## Source document
SRS v1.1 — Smart Agricultural Market Intelligence and Supply Chain Coordination Platform
Debre Markos University, Institute of Technology

## Scope summary

The platform provides:
1. Agricultural market price collection, validation, and comparison
2. Anomaly detection and review workflow for submitted price data
3. Rule-based supplier ranking for procurement decisions
4. Procurement order lifecycle management (10-state machine)
5. Inventory and produce-batch traceability
6. Delivery coordination and status tracking
7. Transaction and payment-status record-keeping
8. Role-based access control (7 roles, scoped review permissions)
9. Audit logging for all significant actions
10. In-app notifications

## Confirmed decisions (SRS Gap Addendum)

- Account creation: buyers self-register (auto-approved); farmers self-register (pending approval); staff created by admin
- Supplier ranking: deterministic weighted scoring — price 40%, quantity 30%, location 20%, history 10%
- Order states: 10 states — draft, pending, accepted, rejected, confirmed, in_fulfillment, delivered, completed, cancelled, disputed
- Units: canonical storage in kg; display in quintal (÷100) or tonne (÷1000)
- Data reviewer scope: system-wide OR scoped to assigned markets/commodities

## Must Have requirements
FR-AUTH-01 through FR-AUTH-11, FR-COM-01 through FR-COM-07,
FR-DATA-01 through FR-DATA-10, FR-ORD-01 through FR-ORD-11,
FR-INV-01 through FR-INV-10, FR-DEL-01 through FR-DEL-09,
FR-PAY-01 through FR-PAY-04, FR-PAY-09, FR-NOT-01 through FR-NOT-04,
FR-NOT-06, FR-REP-01 through FR-REP-07

## Conditional requirements (not yet implemented)
- FR-INT-10: Price forecasting — trigger: 12 months eligible data
- FR-PAY-05 through FR-PAY-08: Payment gateway — trigger: provider credentials
- FR-NOT-05: SMS notifications — trigger: provider access confirmed
- FR-INT-09: CSV export — trigger: Phase 4 design review
