# Klip — Product Requirements Document

**Version:** 0.1  
**Status:** Draft  
**Product:** Klip  
**Tagline:** Keep track. Keep it fair.

## 1. Product Overview
Klip is a private personal ledger for tracking informal obligations between people. These obligations can include money, favours, or other commitments.

Klip answers one simple question:

> **Who owes whom, and for what?**

The initial target users are students and young adults who frequently share expenses, lend money, exchange favours, and make informal commitments with friends, classmates, roommates, and teammates.

## 2. Problem Statement
People regularly have small obligations with people around them: borrowed money, shared expenses, favours, or promises. These are often tracked through memory, chats, screenshots, notes, or informal conversations.

As obligations increase, it becomes difficult to remember:
- Who owes whom.
- What the obligation was for.
- How much is owed.
- Whether it has been settled.
- What the current overall balance is.

Klip provides a centralized and structured way to record and manage these obligations.

## 3. Product Vision
Klip aims to be a simple, private, trustworthy way to keep track of informal obligations without becoming a complicated financial-management application.

## 4. Target Users
### Primary
Students and young adults who interact with friends, roommates, classmates, project teammates, and club members.

## 5. Goals
1. Make recording an obligation quick and simple.
2. Clearly show who owes whom.
3. Maintain a reliable history.
4. Allow obligations to be settled.
5. Protect private user data.
6. Provide a useful balance dashboard.

## 6. Non-Goals for MVP
The first version will not include:
- UPI or payment processing
- Banking integrations
- Cryptocurrency
- Lending/credit services
- Chat or messaging
- Social feeds
- AI features
- Push notifications
- Native mobile apps
- Complex financial analytics
- Public profiles

## 7. Core Concepts
### Person
Someone with whom a user tracks obligations.

### Obligation
A record representing something one person owes another. It can represent money, a favour, or another informal commitment.

### Settlement
Marking an outstanding obligation as resolved. Settled records remain in history.

## 8. MVP Features
### Authentication
- Register
- Login
- Logout
- Retrieve authenticated profile
- Protected routes
- Secure password hashing

### People
- Add a person
- View people
- View person details
- Remove a person where permitted

### Obligations
- Create
- Edit
- Delete
- View
- Settle
- Specify who owes whom
- Add amount when applicable
- Add description and type

### Dashboard
- Total owed to user
- Total user owes
- Net balance
- Pending obligations
- Recent activity

### History
- View historical obligations
- Filter by status/type

## 9. User Stories
- As a new user, I want to create an account.
- As a registered user, I want to log in securely.
- As a user, I want to add a person.
- As a user, I want to record an obligation.
- As a user, I want to specify whether I owe someone or they owe me.
- As a user, I want to describe why an obligation exists.
- As a user, I want to settle an obligation.
- As a user, I want to see my history.
- As a user, I want my private records protected.

## 10. Functional Requirements
- Authentication is required for protected resources.
- Passwords must never be stored in plaintext.
- Every protected resource must enforce authorization.
- Users must never access another user's private records.
- Obligations have a defined lifecycle.
- Outstanding balances are calculated from valid pending obligations.
- Data persists in PostgreSQL.
- Backend input is validated.
- API errors are consistent and meaningful.

## 11. Non-Functional Requirements
### Security
Passwords must be hashed, secrets stored in environment variables, input validated, and authorization enforced.

### Performance
The application should remain responsive under expected MVP usage.

### Reliability
Related database changes should use transactions where appropriate.

### Maintainability
Routes, controllers, services, database access and middleware should have clear responsibilities.

### Scalability
The design should allow future features without requiring a complete rewrite.

## 12. Future Possibilities
- Klip-to-Klip connections
- Group obligations
- Recurring obligations
- Notifications and reminders
- Favour categories
- Analytics
- Mobile app
- Real-time updates
- Payment integrations

## 13. Success Criteria
A user can:
1. Create an account.
2. Log in.
3. Add a person.
4. Create an obligation.
5. See the obligation reflected in their balance.
6. View history.
7. Settle the obligation.
8. See the balance update.
9. Log out.
10. Return later and find their data persisted.

## 14. MVP Completion Definition
The MVP is complete when all MVP features work, authorization and validation are enforced, the core API is tested, the frontend works against the production API, deployment succeeds, documentation is complete, and no secrets are committed.
