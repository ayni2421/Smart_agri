# SAMIC — Smart Agricultural Market Intelligence and Supply Chain Coordination Platform

Debre Markos University, Institute of Technology — Software Engineering Project

---

## Quick start

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### 1. Backend

```bash
cd backend
cp .env.example .env       # fill in MONGODB_URI and JWT_SECRET
npm install
npm run seed               # bootstrap: creates admin account + commodities + markets
npm run dev                # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:3000
```

---

## Getting started — first login

After bootstrapping, one account exists:

| Role  | Email            | Password      |
|-------|------------------|---------------|
| Admin | addis@gmail.com   | Admin123      |

**Change the admin password after your first login.**

---

## Creating accounts for each role

### Option A — Register at /register (self-service)

Go to `http://localhost:3000/register` and select a role:

| Role            | Auto-approved? |
|-----------------|----------------|
| Buyer           | Yes — active immediately |
| Farmer          | No — admin must approve |
| Supplier        | No — admin must approve |
| Agent           | No — admin must approve |
| Transporter     | No — admin must approve |
| Data Reviewer   | No — admin must approve |

After registering a non-buyer role, log in as admin and approve the account:
1. Go to `http://localhost:3000/admin/users`
2. Find the pending account
3. Click **Approve**

### Option B — Admin creates accounts directly

1. Log in as admin → go to `/admin/users`
2. Click **Create user**
3. Select any role — the account is active immediately

---

## Workflow to populate real data

Once you have accounts for each role, follow this order:

```
1. Admin      → Add commodities and markets if needed (/admin/commodities, /admin/markets)

2. Agent      → Submit price observations (/prices → submit)
   or Admin   → Submit price observations (/admin/prices → submit observation)

3. Data Rev.  → Review and approve submitted prices (/anomalies or /admin/anomalies)

4. Supplier   → Create inventory records (/inventory → add inventory)

5. Buyer      → Browse prices, rank suppliers, create orders (/prices, /orders)

6. Supplier   → Accept the order (/orders → accept)

7. Admin      → Create a delivery and assign transporter (/admin/deliveries)

8. Transporter→ Update delivery status (/deliveries)

9. Buyer      → Confirm delivery complete, mark order completed (/orders)
```

---

## Admin panel

The full admin dashboard is at `http://localhost:3000/admin` (admin role required).

Modules:
- **Dashboard** — KPIs, price trends chart, recent orders, anomaly alerts
- **Users / Farmers / Suppliers** — account management and approvals
- **Market Prices** — submit, review, and approve price observations
- **Commodities** — manage commodity records
- **Inventory** — view stock levels and low-stock alerts
- **Orders** — view and manage order lifecycle transitions
- **Deliveries** — manage delivery assignments and status
- **Intelligence & Anomalies** — review flagged price submissions
- **Reports** — market summary and supply/demand charts
- **Roles & Permissions** — RBAC reference matrix
- **Audit Logs** — full audit trail of all actions
- **System Settings** — feature status and configuration

---

## Reset to clean state

```bash
cd backend
node scripts/seed.js --reset
```

This wipes all data and re-creates the admin account, commodities, and markets.

---

## Running tests

```bash
cd backend
npm run test:unit    # 42 unit tests (state machine, ranking, anomaly detection, units)
npm run test:api     # API integration tests (requires MongoDB)
```

---

## API documentation

OpenAPI specification: [`docs/openapi.yaml`](docs/openapi.yaml)

Open in [Swagger Editor](https://editor.swagger.io/) to browse interactively.

---

## Conditional features (SRS Section 2.6.1)

| Feature | Status | Trigger required |
|---------|--------|-----------------|
| Price forecasting (FR-INT-10) | Not implemented | 12 months eligible data |
| Payment gateway (FR-PAY-05)   | FR-PAY-09 fallback active | Provider sandbox credentials |
| SMS notifications (FR-NOT-05) | Not implemented | Provider confirmed |
| CSV export (FR-INT-09)        | Not implemented | Phase 4 design review |
