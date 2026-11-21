# Mangosteen Cafe CRM

Planning and implementation workspace for Mangosteen Cafe's customer relationship management system.

## Current stage

Functional local CRM using SQLite persistence, staff authentication, role-based
permissions, CSV/POS import, backups, audit history and consent-aware messaging.

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

## Demo owner sign-in

- Email: `owner@mangosteen.local`
- Password: `Mangosteen@123`

Change the password from **Settings → Privacy & security** before entering real
customer data. Set `MANGOSTEEN_OWNER_EMAIL` and `MANGOSTEEN_OWNER_PASSWORD`
before the first run to seed different credentials.

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

Do not commit real credentials. The application binds to `127.0.0.1` and is
intended for a single Mac or local network development. Public deployment still
requires HTTPS, managed secrets, monitoring and an infrastructure review.
