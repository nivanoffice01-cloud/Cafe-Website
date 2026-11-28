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

## Live tables and reservations

Use **Live tables** to view the saved table configuration. Existing QR table
definitions are preserved; a fresh local demo starts with the website seating
groups and Table 4 QR. The board refreshes every 15 seconds and shows Available, Reserved,
Occupied, and Cleaning, assigned roster staff, guest counts, and open bills.
Select a known table name when creating a POS order to link its running bill.
Older orders with other free-text table names remain visible under Orders and
are called out above the board.

Under **Reservations**, create or edit a booking, change its date/time/table,
confirm, cancel, check in, mark a no-show, or check out. The default duration is
90 minutes and can be changed. Confirmation rejects table capacity violations
and overlapping confirmed visits. Pending website requests do not hold a table.
Legacy free-text preferences can be assigned to a table through Edit before
confirmation. Every change records the staff member and time in booking history.

Check-in occupies the assigned table. Checkout requires settled table bills and
moves the table to Cleaning; **Mark available** finishes the cleaning cycle.
No-show is allowed after the arrival time, and terminal bookings are retained.
Calendar/List views, date navigation, and status filters are supported. On mobile,
use the page selector in the top bar. Customer message automation is separate.

Reservation revisions reject stale booking forms after another saved edit.
Local SQLite uses a write transaction for each table/booking change. The hosted
demo retains its existing single-JSON Vercel Blob storage; it is not an atomic
multi-user database. Use database transactions when migrating to MongoDB for
production service.

## Walk-in waiting list

Open **Waiting list** to add a party with guest name, optional phone, party size,
quoted wait in minutes, and notes. Arrival time is recorded automatically. The
queue shows actual waiting time and highlights parties past their quoted wait;
it refreshes every 15 seconds. Estimated wait is staff-entered, not a guarantee.

Use **Mark called** after calling the guest in person. **Seat party** checks
capacity, table occupancy/cleaning and the next 90 minutes of confirmed bookings,
then moves the party to History and starts a visit on Live tables. Guest left
and Cancel entry also retain their history. Previous-day waiting entries remain
visible but must be closed and re-added if the party returns today. Staff can
filter History by arrival date. Automatic customer messaging is separate.

Owner, Manager, Cashier and Host can manage the list; Kitchen cannot access it.
Queue records use the existing cloud store in Vercel and floor metadata in local
SQLite. New entries have retry keys and edits check record revisions.

## Kitchen and service alerts

Keep the CRM open on the kitchen and floor devices. Click **Enable sound** once
after opening or refreshing each tab; browsers require this gesture before
playing a chime. **Desktop alerts** optionally asks for browser notification
permission. These alerts work while the CRM is open, not as push messages after
the browser is closed. Live service data is checked every five seconds; browsers
may slow background tabs, and returning to the tab refreshes immediately.

Kitchen hears new orders and sees orange delayed tickets. Defaults are 15 minutes
for preparation and five minutes waiting at the pass. Owner/Manager can adjust
them using **Alert timing**. Existing backlog is highlighted on sign-in without
playing a storm of old alerts. Events are deduplicated within the tab session.

**Floor service** shows ready food, assigned table staff, any collection claim,
and paid/prepaid status. **I’ll serve this** claims collection and **Mark served**
removes the ticket after delivery. A claimed order is handled by that staff member
or a manager/owner. Kitchen can prepare food but cannot mark it served.

Owner can create a **Floor Staff** account in Settings → Team access. That role
sees food service only. Existing floor staff accounts remain valid. Host/Cashier
also receive ready-food alerts. Claims and served timestamps persist in the
existing cloud store or local SQLite service metadata.

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

### WhatsApp reservation confirmations

When staff confirm a reservation, the CRM submits a WhatsApp utility template if
the guest opted in for that booking. The website collects this separately from
offers. For phone bookings, staff can record the guest's choice in the reservation
editor. The confirmation includes the date, time in IST, party size and booking
reference.

Create a **Utility** template in WhatsApp Manager, for example
`mangosteen_reservation_confirmed`, with five positional body variables and no
header or button variables. Use a body like:

> Hi {{1}}, your reservation at Mangosteen Café, Indore is confirmed for {{2}} at {{3}} IST for {{4}} guests. Your booking reference is {{5}}. We look forward to seeing you!

Once Meta approves the template, set these server-side variables in the Vercel
project's Production environment and redeploy. For the standalone Python CRM,
export the same variables before starting the server.

| Variable | Value |
| --- | --- |
| `MANGOSTEEN_WHATSAPP_PHONE_ID` | Meta's sending **Phone Number ID** |
| `MANGOSTEEN_WHATSAPP_TOKEN` | A token for the sender with `whatsapp_business_messaging` |
| `MANGOSTEEN_WHATSAPP_RESERVATION_TEMPLATE` | Approved template name |
| `MANGOSTEEN_WHATSAPP_TEMPLATE_LANGUAGE` | Approved language code, defaults to `en` |
| `MANGOSTEEN_WHATSAPP_GRAPH_VERSION` | Optional Graph API version, defaults to `v25.0` |

Open the reservation details to see the submission status. **Submitted to
WhatsApp** means Meta accepted the request. Use **Send confirmation** on an
upcoming confirmed booking after correcting the phone or completing setup.
For an unverified submission, check with the guest before sending again.
