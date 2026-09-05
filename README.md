# DealFlow360

**Intelligent, Self-Governing Sales Operations Platform**

DealFlow360 is a full-stack sales operations platform that automates the entire deal lifecycle — from quotation and discount governance through multi-level approvals, risk scoring, fulfillment, billing, and customer negotiation. Business rules are enforced by dedicated rule engines, so pricing decisions, approval chains, and deal health monitoring run consistently without manual oversight.

---

## Features

- **Quotation Lifecycle Management** — Full pipeline from draft to confirmed order, including expiry and status history tracking.
- **Discount Governance Engine** — Tier-based discount limits (Bronze / Silver / Gold) per product category, with automatic escalation when discounts exceed approval thresholds.
- **Risk Scoring Engine** — Every deal is scored against configurable rules and classified as `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- **Multi-Level Approval Chains** — Risk- and discount-based approval routing across `SALES_MANAGER`, `FINANCE`, and `ADMIN` roles.
- **Fulfillment & Allocation Engine** — Warehouse-aware stock allocation by shipping priority, with partial allocation and automatic backordering.
- **Billing Engine** — One-time, recurring, and mixed invoicing with billing schedules, payments, and credit notes.
- **Product Recommendation Engine** — Upsell / cross-sell suggestions surfaced while a quotation is being built.
- **Deal Health Monitoring** — Rule-driven alerts for stalled deals, discount anomalies, delivery slippage, and high-risk quotations.
- **Customer Portal & Negotiation** — Customers can view quotations, request discount / quantity changes, and negotiate line items with the sales team.
- **Audit Logging** — Full audit trail of entity changes with old/new values, reasons, and IP addresses.
- **Role-Based Access** — Dedicated workspaces for Sales, Managers, Finance, Operations, Admins, and Customers.

## Roles

| Role | Workspace |
|---|---|
| `SALES_REP` | Create and manage quotations, view recommendations |
| `SALES_MANAGER` | Approval queue, deal monitoring, deal details |
| `FINANCE` | Billing, invoices, approvals |
| `OPERATIONS` | Warehouses, fulfillment |
| `ADMIN` | Products, customers, discount rules, audit log |
| `CUSTOMER` | Customer portal, negotiations |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 4, MySQL 2 (`mysql2/promise`), JWT, bcryptjs |
| Frontend | React 18, Vite 6, React Router 6, Axios, Tailwind CSS 3, Lucide Icons |
| Database | MySQL 8+ |
| Auth | JWT Bearer tokens (stored in `localStorage` on the client) |

## Repository Layout

```
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/           # env config, MySQL connection pool
│   │   ├── controllers/      # request handlers
│   │   ├── engines/          # business rule engines (risk, approval, discount, billing, fulfillment, recommendation)
│   │   ├── middleware/       # auth + error handling
│   │   ├── models/           # data access layer
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # business logic
│   │   └── utils/            # JWT, response helpers
│   └── server.js             # entry point (port 5000)
├── frontend/                 # React SPA (Vite)
│   └── src/
│       ├── components/       # shared UI components
│       ├── context/          # auth context
│       ├── pages/            # role-based pages (sales, manager, finance, operations, customer, admin)
│       ├── routes/           # protected routes
│       └── services/         # axios API client
├── database/
│   ├── schema.sql            # full schema (39 tables)
│   └── seed.sql              # sample catalog, warehouses, stock, discount rules
├── docs/
│   ├── architecture.png      # architecture diagram
│   ├── database-schema.png   # database schema diagram
│   ├── api-documentation.md  # API reference
│   └── business-rules.md     # business rules documentation
└── create-test-deal.js       # dev utility that generates a test quotation
```

## Getting Started

### Prerequisites

- **Node.js** 18+ (backend uses `node --watch` for dev mode)
- **MySQL** 8+
- npm

### 1. Set Up the Database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

`schema.sql` creates the `dealflow360` database and all tables; `seed.sql` loads a sample catalog (products, variants, warehouses, stock, and discount rules).

### 2. Run the Backend

```bash
cd backend
npm install
cp .env.example .env   # or create backend/.env manually (see below)
npm run dev            # http://localhost:5000
```

> There is no committed `.env.example` in `backend/` yet — create `.env` with the variables below.

### 3. Run the Frontend

```bash
cd frontend
npm install
cp .env.example .env   # sets VITE_API_BASE_URL
npm run dev            # http://localhost:3000
```

> The Vite dev server proxies `/api` requests to `http://localhost:5000`, so the frontend works out of the box even with `VITE_API_BASE_URL=/api`.

### 4. Create a User & Try It

Customer self-registration is available at the login screen (only `CUSTOMER` self-registration is exposed via the API). For internal roles (`SALES_REP`, `SALES_MANAGER`, `FINANCE`, `OPERATIONS`, `ADMIN`), insert users directly into the `users` table with a bcrypt-hashed password, then sign in.

To quickly exercise the full flow, generate a test deal:

```bash
node create-test-deal.js
```

This picks a random customer, sales rep, and products, then creates a quotation with line items, totals, and a computed risk score.

## Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | API server port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `dealflow360` | Database name |
| `DB_CONNECTION_LIMIT` | `10` | MySQL pool size |
| `JWT_SECRET` | `dealflow360_secret` | Secret used to sign JWTs |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` (proxied to `http://localhost:5000`) | Backend API base URL |

## API Overview

The API is served from `http://localhost:5000/api` and returns JSON responses shaped as `{ success: true, data }` or `{ success: false, error }`. Most endpoints require a `Authorization: Bearer <token>` header.

| Prefix | Purpose |
|---|---|
| `/api/auth` | Login, customer self-registration, current user |
| `/api/users` | User management |
| `/api/customers` | Customer management |
| `/api/products` | Products, categories, variants |
| `/api/quotations` | Quotation CRUD, items, status transitions |
| `/api/discounts` | Discount rule evaluation |
| `/api/approvals` | Approval chains, queue, decisions |
| `/api/warehouses` | Warehouses and stock |
| `/api/orders` | Orders and fulfillment |
| `/api/negotiations` | Customer negotiation threads |
| `/api/customer` | Customer portal data |
| `/api/billing` | Invoices, billing schedules, payments |
| `/api/recommendations` | Upsell / cross-sell suggestions |
| `/api/dashboard` | Aggregated dashboards |
| `/api/audit` | Audit log queries |

Health checks: `GET /` and `GET /health`.

## Business Rule Engines

The engines under `backend/src/engines/` enforce the platform's governance logic:

- **`risk/`** — Computes a weighted risk score from discount depth, deal value, and other factors, and derives a risk level plus whether approval is required.
- **`approval/`** — Maps quotations to the matching approval chain (by risk score), creates the approval steps per role, and transitions deal status as approvers decide.
- **`discount/`** — Validates each line item against tier/category discount rules, flags violations, and flags approval-required deals.
- **`billing/`** — Recomputes quotation totals and generates one-time / recurring / mixed invoices.
- **`fulfillment/`** — Allocates order quantities from warehouses by shipping priority in a transaction, reserving stock and backordering shortfalls.
- **`recommendation/`** — Returns active upsell / cross-sell rules for a quotation or product.

## Scripts

| Script | Location | Purpose |
|---|---|---|
| `npm run dev` | `backend/` | Start API with file watching |
| `npm start` | `backend/` | Start API (production) |
| `npm run dev` | `frontend/` | Start Vite dev server |
| `npm run build` | `frontend/` | Production frontend build |
| `node create-test-deal.js` | project root | Insert a random test quotation with risk scoring |

## Documentation

- [`docs/api-documentation.md`](docs/api-documentation.md) — API reference
- [`docs/business-rules.md`](docs/business-rules.md) — Business rules & engine behavior
- [`docs/architecture.png`](docs/architecture.png) — System architecture diagram
- [`docs/database-schema.png`](docs/database-schema.png) — Database schema diagram

## License

This project is private and does not currently specify a license. Contact the project owners for usage terms.