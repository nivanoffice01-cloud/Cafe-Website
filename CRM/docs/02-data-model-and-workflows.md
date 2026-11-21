# Mangosteen CRM — Functional Data Model

The local functional release replaces browser-only demo state with SQLite. The
database is created automatically in `data/mangosteen_crm.sqlite3` and is not
committed to source control.

## Core records

- **customers** — identity, consent, tier, visits, spending, points and notes
- **reservations** — date/time, party, table, occasion, status and requests
- **campaigns** — channel, audience, delivery, redemption and attributed revenue
- **feedback** — source, rating, message and recovery status
- **tasks** — operational and service-recovery work
- **rewards** — points cost, eligibility, expiry and redemption activity
- **activities** — recent CRM timeline events
- **monthly_metrics** — time-series reporting snapshots
- **settings** — configurable cafe and guest-experience rules

## Implemented workflows

1. Creating a customer writes to SQLite and records an activity.
2. Creating a reservation persists the booking and connects it to an existing
   customer when the phone number matches.
3. Creating a campaign stores a real draft rather than a temporary card.
4. Resolving negative feedback updates the case and creates a recovery task.
5. Completing a task persists its completion state.
6. Editing cafe settings updates the settings table.
7. Resetting demo data rebuilds the sample database deliberately.

## Security boundary

The current server binds to `127.0.0.1`, so it is available only on the local
computer. It intentionally has no production authentication. Before real guest
data is used on a network, add secure authentication, HTTPS, role enforcement,
encrypted backups, retention policies and deployment monitoring.
