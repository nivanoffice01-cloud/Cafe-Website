# Mangosteen Cafe Operating CRM

A premium, local-first operating system for Mangosteen Cafe. It combines the
day-to-day cafe workflow with customer relationship management in one secured
workspace.

## Current stage

Functional local suite using SQLite persistence, staff authentication,
role-based permissions, order-to-kitchen workflow, billing, inventory,
expenses, vendors, attendance, reporting, CSV import, backups, audit history
and consent-aware messaging.

## Included modules

- Owner dashboard with live sales, profit, orders and stock alerts
- Table orders and point of sale
- Kitchen display system with waiting, preparing and ready stages
- Cash, UPI and card billing with daily closing totals
- Recipe-linked inventory deduction and manual stock ledger
- Expenses, vendor balances and supplier payments
- Staff roster, shifts, attendance and salary totals
- Actual-profit, top-product and guest relationship reporting
- Customers, reservations, loyalty, feedback and website reservation intake

- Discovery draft: [docs/01-discovery-and-scope.md](docs/01-discovery-and-scope.md)
- Frontend: `dist/`
- Local API and database server: `server.py`
- Data model: [docs/02-data-model-and-workflows.md](docs/02-data-model-and-workflows.md)
- Operations and security: [docs/03-operations-and-security.md](docs/03-operations-and-security.md)

## Run locally

```bash
cd CRM
./run-local.sh
```

Then open <http://127.0.0.1:4173>. The SQLite database is created automatically
inside `data/` on the first run.

Do not open `dist/index.html` directly. The CRM needs its local Python server for
login and database requests. Direct file opens automatically redirect to the
default local URL.

The cafe website connects through `POST /api/public/reservations`. Website
requests create or link a customer, store the selected seating preference, and
appear in the CRM as **Pending**. Public submissions are validated, idempotent,
rate-limited and do not require a staff session.

## Vercel deployment

The production Vercel build publishes both experiences from one project:

- Public website: `/`
- CRM: `/crm/`
- Shared Vercel Functions API: `/api/*`
- Website reservation bridge: `/crm-api/api/*`

Run `npm run build:vercel` from the repository root to build the website and
copy the CRM client into `dist/crm`. The hosted adapter stores demo records,
sessions and backups in a private Vercel Blob store. Local development
continues to use the Python/SQLite server.

## Demo owner sign-in

- Email: `owner@mangosteen.local`
- Password: `Mangosteen@123`

Change the password from **Settings → Privacy & security** before entering real
customer data. Set `MANGOSTEEN_OWNER_EMAIL` and `MANGOSTEEN_OWNER_PASSWORD`
before the first run to seed different credentials.

Run the repository checks with `npm run check` from the repository root. The
suite builds the public website and exercises reservation validation,
idempotency, persistent sessions, CSRF enforcement and role boundaries against
a temporary CRM database.

## Demo role accounts

All demo accounts use `Mangosteen@123` until changed:

- Owner: `owner@mangosteen.local`
- Manager: `manager@mangosteen.local`
- Cashier: `cashier@mangosteen.local`
- Kitchen: `kitchen@mangosteen.local`

The Kitchen account sees only the kitchen display. Cashier access is limited to
orders, billing and the guest desk. Manager and Owner roles receive wider
operating access; Owner alone controls accounts, backups and demo reset.

## Communication modes

Email and WhatsApp operate in **Demo** mode by default, recording messages in
the local outbox without contacting customers. Live delivery is enabled only
when the required environment variables are present:

```bash
export MANGOSTEEN_SMTP_HOST="smtp.example.com"
export MANGOSTEEN_SMTP_PORT="465"
export MANGOSTEEN_SMTP_FROM="cafe@example.com"
export MANGOSTEEN_SMTP_USERNAME="..."
export MANGOSTEEN_SMTP_PASSWORD="..."

export MANGOSTEEN_WHATSAPP_PHONE_ID="..."
export MANGOSTEEN_WHATSAPP_TOKEN="..."
```

Do not commit real credentials. Local Python development binds to `127.0.0.1`.
The hosted client demo uses HTTPS and a private Vercel Blob store, but real customer data still
requires managed secrets, monitoring, rate limiting and an infrastructure review.
