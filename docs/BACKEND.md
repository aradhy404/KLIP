# Klip — Backend Design & Engineering Specification

**Version:** 0.1  
**Status:** Initial Architecture Draft

## 1. Backend Objectives
The backend is responsible for authentication, authorization, user management, people/contact management, obligation management, balance calculation, settlement handling, validation, database access, error handling, and API security.

## 2. Technology Stack

| Area | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Language | JavaScript |
| Database | PostgreSQL |
| Authentication | JWT |
| Password hashing | bcrypt |
| Validation | Zod |
| API testing | Postman |
| Version control | Git + GitHub |
| Production backend | Render |
| Production database | Neon |

The frontend will use React/Vite and communicate through REST APIs.

## 3. Architecture

```text
Client
  |
  v
Routes
  |
  v
Controllers
  |
  v
Services
  |
  v
Database / Repository Layer
  |
  v
PostgreSQL
```

Cross-cutting middleware:
- Authentication
- Authorization
- Validation
- Error handling
- Logging

## 4. Proposed Repository Structure

```text
klip/
├── client/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── db/
│   │   │   ├── pool.js
│   │   │   ├── migrations/
│   │   │   └── queries/
│   │   ├── schemas/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── docs/
│   ├── PRD.md
│   └── BACKEND.md
├── .gitignore
└── README.md
```

The structure can change as implementation progresses, but changes should be reflected here.

## 5. Initial Database Model

The initial domain consists of:

```text
users
people
obligations
```

### Users

```text
users
----------------
id
name
email
password_hash
created_at
updated_at
```

Constraints:
- `id` primary key
- `email` unique and required
- `password_hash` required
- passwords are never stored in plaintext

### People

```text
people
----------------
id
user_id
name
email
created_at
updated_at
```

A person belongs to a user's private contact list. The model for connecting two registered Klip users will be finalized before implementation.

### Obligations

```text
obligations
----------------
id
person_id
created_by
amount
type
description
status
created_at
settled_at
updated_at
```

Initial type values:
- `OWED_TO_ME`
- `I_OWE`

Initial status values:
- `PENDING`
- `SETTLED`

This schema is intentionally provisional until the relationship model is finalized.

## 6. Database Rules
- Use foreign keys for relationships.
- Explicitly define deletion behaviour.
- Index fields frequently used for lookup and filtering.
- Use transactions for operations that must succeed or fail together.
- Never trust client-supplied ownership identifiers.

## 7. Authentication

Authentication will use bcrypt + JWT.

### Registration
```text
POST /api/auth/register
        |
Validate input
        |
Check email
        |
Hash password
        |
Create user
        |
Return safe user response
```

### Login
```text
POST /api/auth/login
        |
Validate credentials
        |
Compare password
        |
Generate JWT
        |
Return authentication result
```

Password hashes must never be returned.

## 8. Authorization
Authentication answers **who are you?** Authorization answers **are you allowed to do this?**

Every protected resource must verify ownership or permission on the server.

Example:
`GET /api/obligations/123` must verify that obligation `123` belongs to the authenticated user.

## 9. Validation
All external input must be validated before business logic. Zod is the planned validation library.

Inputs include:
- Registration fields
- Login fields
- Person fields
- Obligation fields

## 10. Error Handling
Use centralized error handling with consistent JSON responses.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}
```

Common statuses:
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Unprocessable Entity
- 500 Internal Server Error

## 11. Initial API Contract

### Authentication
```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### People
```text
GET    /api/people
POST   /api/people
GET    /api/people/:id
PATCH  /api/people/:id
DELETE /api/people/:id
```

### Obligations
```text
GET    /api/obligations
POST   /api/obligations
GET    /api/obligations/:id
PATCH  /api/obligations/:id
DELETE /api/obligations/:id
POST   /api/obligations/:id/settle
```

### Dashboard
```text
GET /api/dashboard
```

This is an initial contract and may change after domain/database design.

## 12. REST Conventions
- Use nouns for resources.
- Use HTTP methods semantically.
- Return meaningful status codes.
- Validate request bodies.
- Avoid exposing database implementation details.
- Return predictable JSON structures.

## 13. Security Requirements
- Hash passwords with bcrypt.
- Keep secrets in environment variables.
- Never commit `.env`.
- Validate input.
- Enforce authorization.
- Avoid exposing sensitive database errors.
- Configure CORS appropriately.
- Use secure token handling.
- Consider rate limiting for authentication.
- Derive ownership from authentication rather than trusting client IDs.

## 14. Environment Variables

```env
PORT=3000
DATABASE_URL=
JWT_SECRET=
NODE_ENV=development
CLIENT_URL=
```

`.env` must not be committed. `.env.example` documents required variables without real secrets.

## 15. Development Workflow

```text
Requirement
    ↓
Design
    ↓
Implementation
    ↓
Validation
    ↓
Testing
    ↓
Commit
    ↓
Pull request / merge
```

Example branches:
```text
main
feature/auth
feature/people
feature/obligations
feature/dashboard
```

Example commits:
```text
feat: add user registration
feat: implement login authentication
feat: add people endpoints
feat: add obligation creation
fix: enforce obligation ownership
```

## 16. Testing Strategy

### Manual
Use Postman during early development.

### Unit
Test business logic independently where useful.

### Integration
Test API + database + authentication flows.

Critical flows:
```text
Register → Login → Create person → Create obligation
```

```text
Create obligation → Settle → Verify balance
```

Authorization tests must verify that one user cannot access another user's records.

## 17. Deployment

### Backend
Render.

### Database
Neon PostgreSQL.

### Frontend
Vercel.

Production architecture:

```text
Browser
   |
   v
Vercel
   |
   | HTTPS REST API
   v
Render
   |
   v
Neon PostgreSQL
```

## 18. Development Milestones

### Milestone 1 — Project setup
- Initialize repository
- Configure Node/Express
- Environment configuration
- ESLint
- Folder structure

### Milestone 2 — Database
- Finalize ER model
- Create migrations
- Add constraints
- Add indexes
- Configure PostgreSQL

### Milestone 3 — Authentication
- Registration
- Password hashing
- Login
- JWT
- Authentication middleware
- Authorization

### Milestone 4 — People
- Create
- List
- Get
- Update
- Delete

### Milestone 5 — Obligations
- Create
- Read
- Update
- Delete
- Settle
- Balance calculation

### Milestone 6 — Dashboard
- Overall balance
- Pending obligations
- Recent activity
- Person summaries

### Milestone 7 — Hardening
- Validation
- Error handling
- Rate limiting
- Security review
- Tests

### Milestone 8 — Production
- Production environment
- Deployment
- Database migration
- API testing
- Logging/monitoring

## 19. Architecture Decision Log

### ADR-001 — PostgreSQL
**Decision:** PostgreSQL is the primary database.

**Reason:** Klip has relational entities and needs constraints, transactions, joins, and aggregation.

### ADR-002 — REST API
**Decision:** The backend exposes a REST API.

**Reason:** The frontend and backend should remain independently deployable and communicate through a clear contract.

### ADR-003 — Layered backend
**Decision:** Separate routes, controllers, services, database access, and middleware.

**Reason:** Separation of concerns improves maintainability and testing.

## 20. Open Architecture Questions

These must be resolved before the database migration is finalized:

1. Does a person need a Klip account?
2. Can two Klip users connect directly?
3. What happens when an existing contact joins Klip?
4. Should obligations be visible to both participants?
5. How should non-monetary favours affect numerical balance?
6. Can an obligation be partially settled?
7. Can an obligation be edited after partial settlement?
8. Should deleting a person delete historical obligations?
9. What exactly constitutes net balance?
10. Should MVP support only one currency?
