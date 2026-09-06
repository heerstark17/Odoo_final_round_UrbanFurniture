# Urban Furniture Accounting System

Urban Furniture is a full-stack double-entry accounting and financial management application built for the Odoo Hackathon. It provides an internal accounting workspace for administrators and accountants, plus a customer/vendor portal.

The application is split into:

- `backend/`: Node.js, Express, PostgreSQL REST API, authentication, accounting rules, PDF generation, and database setup.
- `frontend/`: React 19 and Vite single-page application with role-based navigation and API integration.

## Features

- JWT authentication and role-based access for `admin`, `accountant`, and `contact` users.
- Contact, product, chart of accounts, journal, tax, and analytic-account management.
- Sales orders, customer invoices, payments, purchase orders, and vendor bills.
- Automatic balanced journal entries for posted invoices, bills, and payments.
- Manual journal-entry inspection with debit and credit totals.
- Budgets with planned, committed, achieved, remaining, and variance values.
- Profit and loss, balance-sheet, budget, dashboard, and horizontal bar-graph views.
- PDF downloads for customer invoices and vendor bills.
- Customer/vendor portal for viewing own documents and registering payments.

## Architecture

```text
UrbanFurniture/
├── backend/
│   ├── config/          PostgreSQL connection pool
│   ├── controllers/     HTTP request handlers
│   ├── middleware/      JWT, roles, and error handling
│   ├── models/          Database queries
│   ├── routes/          Express route definitions
│   ├── services/        Business rules and transaction workflows
│   ├── sql/             schema.sql and seed.sql
│   ├── utils/           PDF generation
│   ├── server.js        API entry point
│   └── setup-db.js      Schema and seed runner
└── frontend/
    ├── src/api/         Axios client and auth interceptor
    ├── src/components/  Shared layout and UI components
    ├── src/context/     Authentication state
    ├── src/pages/       Dashboard, accounting, sales, purchases, portal, reports
    ├── src/App.jsx      React Router configuration
    └── src/index.css    Shared visual system
```

## Technology Stack

### Backend

- Node.js CommonJS application
- Express 5
- PostgreSQL with `pg`
- JWT with `jsonwebtoken`
- Password hashing with `bcryptjs`
- PDF generation with `pdfkit`
- CORS and JSON request parsing

### Frontend

- React 19
- Vite
- React Router
- Axios
- Lucide React icons
- Oxlint

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL 14 or newer
- A PostgreSQL database and a user with permission to create tables and reset the `public` schema

## Environment Setup

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/urban_furniture
JWT_SECRET=replace-with-a-long-random-secret
```

Use a long random value for `JWT_SECRET`. Do not commit `.env` or real credentials.

The frontend uses relative `/api` requests. During development, Vite proxies those requests from `http://localhost:5173` to `http://localhost:5000`; this is configured in `frontend/vite.config.js`.

## Installation and Running

Use two terminals from the repository root.

### Terminal 1: Backend

```bash
cd backend
npm install
npm run db:setup
npm run dev
```

The backend listens on `http://localhost:5000` by default.

For a normal non-watch process:

```bash
npm start
```

### Terminal 2: Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:5173`.

## Database Setup Workflow

All database commands run from the `backend` directory.

### `npm run db:setup`

Runs `node setup-db.js`.

1. Reads and executes `backend/sql/schema.sql`.
2. Reads and executes `backend/sql/seed.sql`.
3. Leaves existing tables and rows in place.
4. Uses the schema and seed scripts' `IF NOT EXISTS` and conflict protections where provided.

Use this for a first-time setup or to apply the current schema and seed data to an existing database. It is not a complete data reset.

### `npm run db:reset`

Runs `node setup-db.js --reset`.

1. Drops the entire `public` schema with `CASCADE`.
2. Recreates the empty `public` schema.
3. Executes `schema.sql`.
4. Executes `seed.sql`.

This is destructive. All application tables and data in that database are removed. Use it only for a disposable development or test database.

## Database Schema Overview

The schema is defined in `backend/sql/schema.sql`. Monetary values use `NUMERIC(14,2)` and date/time audit columns are added to primary business tables.

### Identity and master data

- `users`: login identity, password hash, role, active status, and optional contact link.
- `contacts`: customers, vendors, or contacts that are both, including address and communication fields.
- `products`: goods, services, or combo products with sales and purchase prices.
- `chart_of_accounts`: ledger accounts grouped as asset, liability, expense, income, or capital.
- `taxes`: tax rates mapped to sales-tax and purchase-tax accounts.
- `journals`: sales, purchase, bank, and cash books with default accounts.
- `analytic_accounts`: income or expense dimensions for departmental/project analysis.

### Planning

- `budgets`: budget period, status, responsible user, and optional revision link.
- `budget_lines`: planned amount per budget and analytic account.

### Sales and receivables

- `sales_orders`: customer order header and status.
- `sales_order_lines`: product, quantity, price, tax, analytic account, and calculated totals.
- `customer_invoices`: invoice header, customer, source sales order, status, and payment state.
- `customer_invoice_lines`: invoice products, tax, accounts, analytic dimensions, and calculated totals.

### Purchases and payables

- `purchase_orders`: vendor order header and status.
- `purchase_order_lines`: product, quantity, price, tax, analytic account, and calculated totals.
- `vendor_bills`: vendor bill header, source purchase order, status, and payment state.
- `vendor_bill_lines`: bill products, tax, accounts, analytic dimensions, and calculated totals.

### Payments and general ledger

- `payments`: incoming or outgoing payment, linked invoice/bill, partner, journal, and amount.
- `journal_entries`: accounting header, journal, date, source document, status, and creator.
- `journal_entry_lines`: account-level debit/credit lines with optional partner and analytic account.

Journal-entry line constraints require exactly one positive side per line: a line must have either a debit or a credit, never both. Posted entries are validated so total debits equal total credits and are greater than zero. Reports calculate their values from posted journal-entry lines.

### Main relationships

```text
contacts ──< sales_orders ──< sales_order_lines >── products
contacts ──< purchase_orders ──< purchase_order_lines >── products
sales_orders ──1 customer_invoices ──< customer_invoice_lines
purchase_orders ──1 vendor_bills ──< vendor_bill_lines
customer_invoices / vendor_bills ──< payments
journals ──< journal_entries ──< journal_entry_lines >── chart_of_accounts
budgets ──< budget_lines >── analytic_accounts
```

Foreign keys and `ON DELETE CASCADE` rules protect document-line relationships. Generated columns calculate order, invoice, and bill subtotals, taxes, and totals from quantity, price, and tax rate.

## API Overview

The API base path is `/api`. Authentication is handled with a Bearer JWT in the `Authorization` header.

Public endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register`

Health endpoints:

- `GET /`
- `GET /db-test`

Authenticated route groups:

- `/api/contacts`
- `/api/products`
- `/api/chart-of-accounts`
- `/api/taxes`
- `/api/journals`
- `/api/analytic-accounts`
- `/api/budgets`
- `/api/sales-orders`
- `/api/invoices`
- `/api/purchase-orders`
- `/api/vendor-bills`
- `/api/payments`
- `/api/journal-entries`
- `/api/reports`
- `/api/dashboard`

Administrators and accountants can access accounting, master-data, journal, report, and dashboard routes according to the route-level role rules. Contact users are restricted to their own portal data where enforced by the service layer and route middleware.

## Core Business Workflows

### Sales

1. Create a draft sales order.
2. Add product lines, prices, taxes, accounts, and analytic accounts.
3. Confirm the order.
4. Convert it to a customer invoice.
5. Confirm/post the invoice, which creates a balanced journal entry.
6. Register an incoming cash or bank payment.
7. Download the invoice PDF or inspect the ledger entry.

### Purchases

1. Create a draft purchase order.
2. Add product lines, prices, taxes, accounts, and analytic accounts.
3. Confirm the order.
4. Convert it to a vendor bill.
5. Confirm/post the bill, which creates a balanced journal entry.
6. Register an outgoing cash or bank payment.
7. Download the bill PDF or inspect the ledger entry.

### Reporting

The Financial Reports page requests the profit and loss, balance sheet, and budget report together. Date filters are passed to all three report endpoints. The dashboard and report charts are derived from posted ledger data and budget calculations.

## Frontend Routes

- `/login`: authentication and registration
- `/`: dashboard for staff, portal redirect for contacts
- `/contacts`, `/products`, `/chart-of-accounts`, `/journals`, `/taxes`
- `/sales-orders`, `/invoices`, `/purchase-orders`, `/vendor-bills`, `/payments`
- `/journal-entries`, `/budgets`, `/reports`
- `/portal`: customer/vendor self-service portal

Role protection is implemented by `ProtectedRoute`, and the backend remains the final authorization boundary.

## Validation and Production Build

Run frontend checks from `frontend`:

```bash
npm run lint
npm run build
```

The production bundle is written to `frontend/dist/`.

Backend JavaScript syntax can be checked from `backend`:

```bash
node --check server.js
```

Before deploying, use a production PostgreSQL database, a strong `JWT_SECRET`, HTTPS, restricted CORS settings, and a process manager such as systemd, Docker, or PM2. Do not run `db:reset` against production data.

## Troubleshooting

### Backend cannot connect to PostgreSQL

- Confirm PostgreSQL is running.
- Confirm `DATABASE_URL` is valid.
- Confirm the database exists and the configured user can connect.
- Run `npm run db:setup` from `backend`.

### Frontend API requests fail

- Confirm the backend is running on port 5000, or update the Vite proxy target.
- Confirm the browser is using `http://localhost:5173` rather than opening the built HTML directly.
- Check the browser console and backend logs for authentication or role errors.

### Seed data needs to be recreated

Use a development database and run:

```bash
cd backend
npm run db:reset
```

Remember that this deletes all existing data in the configured database.
