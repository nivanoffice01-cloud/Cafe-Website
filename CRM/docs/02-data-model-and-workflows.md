# Mangosteen CRM — Functional Data Model

The local functional release replaces browser-only demo state with SQLite. The
database is created automatically in `data/mangosteen_crm.sqlite3` and is not
committed to source control.

## Core records

- **customers** — identity, consent, tier, visits, spending, points and notes
- **reservations** — date/time, party, table, occasion, status and requests
- **feedback** — source, rating, message and recovery status
- **tasks** — operational and service-recovery work
- **rewards** — points cost, eligibility, expiry and redemption activity
- **activities** — recent CRM timeline events
- **monthly_metrics** — time-series reporting snapshots
- **settings** — configurable cafe and guest-experience rules
- **menu_items** — sellable items, categories, prices and availability
- **inventory_items** — ingredient balance, unit and reorder threshold
- **recipes** — ingredient quantity consumed by each menu item
- **orders / order_items** — table ticket, line items, value and preparation state
- **payments** — Cash, UPI and Card settlements
- **inventory_movements** — order consumption and manual stock adjustments
- **expenses** — dated operating costs and category
- **vendors** — supplier contacts and outstanding balances
- **staff / attendance** — roster, shifts, salary and daily status

## Implemented workflows

1. Creating a customer writes to SQLite and records an activity.
2. Creating a reservation persists the booking and connects it to an existing
   customer when the phone number matches.
3. Creating an order stores a draft with current menu prices.
4. Sending an order to the kitchen checks the recipe requirements, blocks
   shortages, deducts inventory and creates stock movements in one transaction.
5. Kitchen staff move tickets from waiting to preparing to ready.
6. Billing records Cash, UPI or Card and closes the order as paid.
7. Expense, vendor, staff and attendance changes persist immediately and feed
   the operating reports.
8. Resolving negative feedback updates the case and creates a recovery task.
9. Completing a task persists its completion state.
10. Editing cafe settings updates the settings table.
11. Resetting demo data rebuilds the sample database deliberately.

## Security boundary

The server binds to `127.0.0.1`, so it is available only on the local computer.
It includes authenticated sessions and server-enforced roles. Before real guest
data is used on a network, add HTTPS, managed sessions and secrets, encrypted
off-device backups, retention policies and deployment monitoring.
