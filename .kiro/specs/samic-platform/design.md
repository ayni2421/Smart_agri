# SAMIC Platform — Architecture and Design

## Architecture
Modular monolith (SRS Section 9.1)

```
React (port 3000)
    │ REST JSON over HTTP
Node.js + Express.js (port 5000)
    │ Mongoose ODM
MongoDB
```

## Backend modules

| Module | Routes | Models |
|---|---|---|
| Auth & Users | /api/auth, /api/users | User |
| Commodities & Markets | /api/commodities, /api/markets | Commodity, Market |
| Market data | /api/prices, /api/anomalies | PriceObservation |
| Supplier ranking | /api/suppliers | SupplierProfile, Inventory |
| Orders | /api/orders | Order |
| Inventory & Batches | /api/inventory, /api/batches | Inventory, ProduceBatch |
| Delivery | /api/deliveries | Delivery |
| Transactions | /api/transactions | Transaction |
| Notifications | /api/notifications | Notification |
| Reports | /api/reports | (aggregation over existing models) |
| Audit | /api/audit | AuditLog |

## Key design decisions

### Unit conversion (FR-COM-04)
- All quantities stored in kg
- API accepts kg / quintal (100 kg) / tonne (1000 kg)
- Conversion in `src/utils/units.js`

### Order state machine (FR-ORD-07)
- Implemented in `src/models/Order.js` (VALID_TRANSITIONS map + validateTransition)
- Enforced by `src/middleware/orderTransition.js` before controller executes
- Transition history stored in `order.stateHistory[]` (FR-ORD-11)

### Supplier ranking (FR-SUP)
- Implemented in `src/services/supplierRanking.js`
- Weights: price 0.40, quantity 0.30, location 0.20, history 0.10
- Baseline comparison included in response (FR-SUP-08)

### Anomaly detection (FR-ANOM)
- Implemented in `src/services/anomalyDetection.js`
- 6 rules: positive price, ceiling, floor, 30-day deviation, future date, positive quantity
- Flagged observations routed to data reviewers (scoped by FR-AUTH-11)

### Data reviewer scoping (FR-AUTH-11)
- Enforced in `src/middleware/auth.js` (checkReviewScope)
- Stored in user.reviewScope: { systemWide, markets[], commodities[] }

### Audit logging (FR-REP-04 through FR-REP-07)
- `src/utils/audit.js` — fire-and-forget, no read/write routes for ordinary users
- AuditLog model has no update/delete routes

## API documentation
File: `docs/openapi.yaml` (NFR-MNT-04)
