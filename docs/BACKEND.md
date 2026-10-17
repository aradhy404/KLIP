# Klip — Backend Design and Engineering Specification

**Version:** 0.2
**Status:** Auth and entry creation/listing implemented. Lifecycle endpoints in progress.

## 1. Objectives

Authentication, authorization, entry management, counterparty linking, balance calculation, validation, error handling and API security.

## 2. Technology Stack (as built)

| Area | Technology |
|---|---|
| Runtime | Node.js (ES modules) |
| Framework | Express 5 |
| Database | PostgreSQL (Neon), accessed with `pg` and raw SQL |
| Auth | JWT (`jsonwebtoken`), passwords hashed with `bcrypt` |
| Security middleware | `cors`, `express-rate-limit` |
| Config | `dotenv` |
| Validation | Hand-written checks today; Zod planned |
| Migrations | Custom runner `src/utils/migrate.js` |
| Hosting | API on Render, DB on Neon, client on Vercel |

No ORM is used. SQL is written by hand so constraints, transactions and joins stay explicit.

## 3. Architecture

```text
Client (React/Vite on Vercel)
        │  HTTPS REST
        ▼
Routes → Middleware → Controllers → Services → pg Pool → PostgreSQL (Neon)
```

- **Routes:** map URLs to controllers and attach middleware.
- **Middleware:** `reqAuth` (JWT verification), rate limiter, CORS.
- **Controllers:** validate and normalize input, shape responses, translate errors to status codes.
- **Services:** business rules and transactions.
- **Utils:** `phone.js`, `amount.js`, `migrate.js`.

## 4. Repository Layout

```text
KLIP-SERVER/
├── docs/
│   ├── PRD.md
│   └── BACKEND.md
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/db.js
│   │   ├── controllers/entry.controller.js
│   │   ├── middleware/reqAuth.js
│   │   ├── routes/{auth,entry}.routes.js
│   │   ├── services/entry.serivce.js
│   │   ├── utils/{phone,amount,migrate}.js
│   │   └── migrations/{001_int.sql, 002_contacts.sql, ...}
│   ├── .env.example
│   ├── package.json
│   └── README.md
└── .gitignore
```

Migration files live in `server/src/migrations/` because `migrate.js` resolves `../migrations` relative to `src/utils/`.

## 5. Data Model

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| name | TEXT NOT NULL | 1 to 100 characters |
| phone | TEXT UNIQUE NOT NULL | normalized 10-digit Indian number, no `+91` |
| pass_hashed | TEXT NOT NULL | bcrypt hash |
| created_at | TIMESTAMPTZ | default `now()` |

### entries
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| creator_id | UUID FK users | the lender |
| counterparty_id | UUID FK users, nullable | set when the counterparty is registered |
| counterparty_phone | TEXT | always stored, used for auto-linking |
| type | ENUM `money`, `favour` | |
| amount_paise | BIGINT, CHECK > 0 | required for money |
| description | TEXT | max 500 characters |
| status | ENUM `pending`, `confirmed`, `dispute`, `settled` | default `pending` |
| created_at | TIMESTAMPTZ | |

Constraints: `no_self_entry` (creator cannot equal counterparty), `money_requires_amount`.
Indexes: creator, counterparty, counterparty_phone.

### entry_events (append-only)
`id BIGSERIAL, entry_id, actor_id, action, created_at`. A trigger blocks `UPDATE` and `DELETE`, so history cannot be rewritten.

### entry_photos
Exists, unused until post-MVP.

### contacts (migration 002)
| Column | Type | Notes |
|---|---|---|
| owner_id | UUID FK users | the lender |
| phone | TEXT | counterparty phone |
| name | TEXT NOT NULL | private label |
| created_at | TIMESTAMPTZ | |

Primary key `(owner_id, phone)`. One label per counterparty per owner.

### Planned additions
- `entries.settled_at TIMESTAMPTZ` and `entries.updated_at TIMESTAMPTZ`.
- A `cancelled` status. Entries are **not hard-deleted**, because `entry_events` references `entries(id)` and its trigger blocks deletes. Cancel instead.

## 6. Identity and Linking

- Phone numbers are normalized by `utils/phone.js`: trim, strip spaces and dashes, strip `+91` or a leading `0`, require exactly 10 digits.
- When creating an entry, the service looks up a user with that phone. If found, `counterparty_id` is set immediately.
- When a user registers, inside the same transaction, all entries with `counterparty_phone = new phone AND counterparty_id IS NULL` are linked to the new user.

## 7. Authentication

**Register** `POST /api/auth/register`: validate → insert user and link waiting entries in one transaction → return JWT and safe user.
**Login** `POST /api/auth/login`: normalize phone → compare bcrypt hash → return JWT.

- JWT payload: `{ id }`, signed with `MY_JWT_SECRET`, expires in 7 days, sent as `Authorization: Bearer <token>`.
- Logout is client-side (delete the token). JWTs are stateless; there is no server-side revocation yet.
- Password rule: 8 characters minimum, 72 bytes maximum (bcrypt limit).
- Auth routes are limited to 10 requests per 15 minutes per IP. `trust proxy` is set to 1 because Render sits behind a proxy.
- The same error message is returned for unknown phone and wrong password.

## 8. Authorization Rules

| Action | Who may do it | Allowed from status |
|---|---|---|
| Read an entry | creator or counterparty | any |
| Confirm / dispute | counterparty only | `pending` |
| Edit / cancel | creator only | `pending`, `dispute` |
| Settle | creator only | `pending`, `confirmed` |

Ownership always comes from `req.user.id` in the verified JWT, never from request bodies. A user who is not part of an entry receives **404**, not 403, so existence is not leaked.

Every status change inserts an `entry_events` row inside the same transaction as the update.

## 9. API Contract

### Implemented

```text
POST /api/auth/register   { name, phone, password }
POST /api/auth/login      { phone, password }
POST /api/entry           { type, amount, description, counterpartyPhone }
GET  /api/entry?limit=20&offset=0
```

- `amount` is a string of whole rupees (e.g. `"500"`), converted to paise. Decimals are not accepted yet.
- `GET /api/entry` returns `id, type, amount_paise, status, description, created_at, role, other_party`. `role` is `lender` or `borrower` from the caller's point of view. `other_party` is the contact name or the phone for the lender, and the lender's registered name for the borrower.

### Planned

```text
GET   /api/auth/me
POST  /api/entry                (adds counterpartyName, upserts contact)
GET   /api/entry/:id
PATCH /api/entry/:id            creator, pending/dispute
POST  /api/entry/:id/confirm    counterparty
POST  /api/entry/:id/dispute    counterparty
POST  /api/entry/:id/settle     creator
POST  /api/entry/:id/cancel     creator
GET   /api/entry/:id/events
GET   /api/dashboard            totals
GET   /api/people               entries grouped by counterparty with balances
```

The earlier `/api/people` CRUD and `/api/obligations` routes are removed. People are derived from entries and contacts.

## 10. Dashboard Semantics

Computed in SQL, never trusted from the client:

- **owedToYou:** `SUM(amount_paise)` where `creator_id = me` and status in (`pending`, `confirmed`) and type `money`.
- **youOwe:** `SUM(amount_paise)` where `counterparty_id = me` and status = `confirmed` and type `money`.
- **net:** `owedToYou - youOwe`.
- **openFavours:** count of non-settled favours per side.
- **pendingReview:** entries addressed to me with status `pending`.

All values are integer paise; the client formats to rupees.

## 11. Validation and Errors

- All external input is validated before business logic. Zod is planned to replace the manual checks.
- Current error shape: `{ "error": "message" }`. Target shape: `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.
- Status codes: 400 invalid input, 401 unauthenticated, 404 not found or not yours, 409 conflict (phone already registered), 429 rate limited, 500 unexpected. Internal database errors are never returned to the client.

## 12. Environment Variables

```env
PORT=8000
DATABASE_URL=
MY_JWT_SECRET=
CLIENT_URL=https://klip-client.vercel.app
```

- `.env` is never committed. `.env.example` documents the keys without values.
- CORS uses an allowlist built from `CLIENT_URL` (trimmed, trailing slash removed), the production client and `http://localhost:5173`.

## 13. Deployment

```text
Browser → Vercel (client) → Render (API) → Neon (PostgreSQL)
```

- Render auto-deploys from `main`.
- Migrations are run manually with `npm run migrate`. Use a **separate Neon branch for development** so local migrations do not touch production data.
- On the free tier the API sleeps after inactivity and the first request can take about 50 seconds.

## 14. Security Checklist

| Item | Status |
|---|---|
| bcrypt password hashing | Done |
| JWT secret in env | Done |
| Auth rate limiting | Done |
| CORS allowlist | Done |
| Secrets rotated after leak in git history | Done (JWT secret, DB password) |
| Ownership checks on every entry route | In progress |
| Zod validation | To do |
| Phone verification (OTP) | To do (v1.1) |
| Helmet security headers | To do |
| Authorization tests | To do |

## 15. Testing Strategy

- **Manual:** Postman collection for every endpoint.
- **Integration:** register → login → create entry → counterparty registers → confirm → settle → totals.
- **Authorization:** user C cannot read, confirm or settle an entry between A and B; the counterparty cannot settle; the creator cannot confirm their own entry.
- Split `app.js` into `app.js` (builds the app) and `server.js` (listens) so tests can import the app without opening a port.

## 16. Milestones

| # | Milestone | Status |
|---|---|---|
| 1 | Project setup, Express, env config | Done |
| 2 | Database schema and migrations | Done |
| 3 | Auth: register, login, JWT, rate limit | Done |
| 4 | Entries: create and list | Done |
| 5 | Contacts and `counterpartyName` | Next |
| 6 | Confirm / dispute | To do |
| 7 | Settle, edit, cancel, events | To do |
| 8 | Dashboard and people endpoints | To do |
| 9 | Hardening: Zod, Helmet, tests | To do |
| 10 | Docs, screenshots, resume-ready README | To do |
| 11 | OTP verification (v1.1) | Later |

## 17. Architecture Decision Log

- **ADR-001 PostgreSQL.** Relational data with constraints, transactions and aggregation.
- **ADR-002 REST API.** Frontend and backend deploy independently.
- **ADR-003 Layered backend.** Routes, controllers, services and DB access are separate.
- **ADR-004 Lender-first entries.** The creator is always the lender; there is no "I owe" entry. Fewer states, clearer product.
- **ADR-005 Phone as identity.** Login and counterparty matching use a normalized phone number. Registration auto-links earlier entries.
- **ADR-006 Money as integer paise.** No floating point; INR only.
- **ADR-007 Append-only events.** A trigger prevents edits to history; entries are cancelled, never deleted.
- **ADR-008 Raw SQL with `pg`.** No ORM; SQL stays visible and reviewable.
- **ADR-009 Contacts are per-owner labels.** Names are private and are not looked up across users.

## 18. Known Technical Debt

- File is named `entry.serivce.js` (typo); rename to `entry.service.js` and fix the import.
- `SELF_ENTRY_NOT_ALLOWED` is thrown by the service but the controller returns 500; map it to 400.
- `app.js` calls `listen` on import, which blocks testing.
- Root-level `package.json` contains an unused `fs` package (a placeholder, `fs` is built into Node) and duplicates server dependencies; remove it.
- Amounts accept whole rupees only.
- No server-side token revocation.

## 19. Open Architecture Questions

1. Partial settlement and how it affects `amount_paise`.
2. Whether the counterparty can propose "I have paid".
3. Expiry or reminders for entries whose counterparty never registers.
4. Whether `confirmed` entries may ever be amended.
