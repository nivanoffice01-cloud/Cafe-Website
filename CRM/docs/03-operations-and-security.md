# Mangosteen CRM operations and security

## Staff roles

- **Owner:** full access, team accounts, backups, restore and demo reset.
- **Manager:** campaigns, loyalty, CSV import, communication and business settings.
- **Host:** dashboard, customers, reservations, feedback and reports.

Permissions are checked by the local API. Hiding a navigation item is only a
usability feature and is not the security boundary.

## Authentication

Passwords use PBKDF2-HMAC-SHA256 with a unique random salt and 240,000 rounds.
Successful sign-in creates a random, HTTP-only, SameSite session cookie that
expires after 12 hours. Change the seeded owner password before using real data.

## Customer CSV/POS import

The importer accepts UTF-8 CSV files up to 5 MB. It detects common column names
for name, mobile/phone, email, visits, total spend, loyalty points, marketing
consent, birthday and notes. Name and phone are required. Duplicate phone
numbers can be updated or skipped.

Always review the consent field before importing marketing permission. An empty
or unknown consent value is treated as not opted in.

## Backups

On startup, the server creates at most one automatic SQLite backup per day when
automatic backups are enabled. Backups are stored in `backups/`, and retention
defaults to 30 days. Owners can create, download and restore backups from
Settings. A pre-restore safety backup is created automatically.

Copy the `backups/` directory to a second encrypted device or managed backup
location for disaster recovery. Local backups on the same Mac do not protect
against device loss.

## Email and WhatsApp

Without provider credentials, delivery uses the local demo outbox. This is safe
for client demonstrations because no message leaves the device. SMTP and Meta
WhatsApp Cloud API credentials are read only from environment variables.

Marketing messages are rejected when the selected customer does not have a
recorded opt-in. Transactional messages remain available for reservations and
service recovery.

## Public deployment checklist

Before exposing the CRM outside the Mac:

- Put it behind HTTPS and a production reverse proxy.
- Move sessions to durable server-side storage.
- Store credentials in a managed secret service.
- Add rate limiting, CSRF protection and account lockout.
- Encrypt backups and verify restore drills.
- Confirm Indian privacy, consent and retention requirements with counsel.
- Add monitoring, error reporting and an incident response owner.

## Website reservation integration

The website submits reservation requests to `/api/public/reservations` with an
idempotency key. The endpoint validates the date, party size, contact details and
selected seats, then creates a pending CRM reservation and customer profile.
Repeated delivery of the same request key returns the original reference instead
of creating a duplicate. Staff can open the pending reservation in the CRM and
confirm it; the status change is stored and added to the activity history.

The local Vite server proxies `/crm-api` to the CRM on port 4173. In production,
configure the same reverse-proxy route or build the website with
`VITE_CRM_API_URL` pointing to the deployed CRM origin. Public submissions are
limited per IP address; production infrastructure should add proxy-level rate
limiting and abuse monitoring as well.
