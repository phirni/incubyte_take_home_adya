# Car Dealership Inventory System — Specification

## 1. Intent

Build a full-stack car dealership inventory system. Authenticated users can browse and search vehicles and purchase available stock. Admin users can create, update, and delete vehicle records and restock inventory.

**Non-goals:** payment processing, user profiles beyond authentication and role, real-time inventory updates, and image uploads.

## 2. Constraints and Technology Choices

- **Backend:** Node.js, TypeScript, Express
- **Database:** SQLite with Prisma ORM; use a persistent local database file, not an in-memory database
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Authentication:** JWT bearer tokens; bcrypt password hashing
- **Testing:** Vitest for backend tests, including API/integration tests
- **API style:** REST over JSON
- **CORS:** Configure Express CORS for the frontend origin(s) used in local development; keep allowed origins explicit and do not use unrestricted production CORS by default.
- **Scope:** A single application/repository. No microservices, GraphQL, or state-management library unless a concrete need emerges.
- **Authorization:** Authenticated users may browse/search and purchase. Admin-only operations require an admin role.
- **Validation:** Validate request bodies, query parameters, IDs, prices, and quantities. Never trust a role supplied by the client.

## 3. Core Data Model

### User
- `id`: unique identifier
- `email`: unique, normalized email address; trim surrounding whitespace and lowercase before storage and comparison (for example, `User@X.com` becomes `user@x.com`)
- `passwordHash`: bcrypt hash; never return it from the API
- `role`: `USER` or `ADMIN` (default `USER`)
- `createdAt`

### Vehicle
- `id`: unique identifier
- `make`: non-empty string
- `model`: non-empty string
- `category`: non-empty string
- `priceCents`: non-negative integer price in the smallest currency unit (cents); use this field consistently throughout the API and UI
- `quantity`: non-negative integer
- `createdAt`, `updatedAt`

Use database constraints and conditional updates where needed to prevent inventory from becoming negative. Do not use floating-point values for money.

## 4. API Contract and Acceptance Criteria

All vehicle endpoints below require a valid JWT unless explicitly noted otherwise. Responses use JSON. Every 4xx response uses the standard error envelope defined under General API behavior.

### Authentication

- `POST /api/auth/register`
  - Valid email and password create a regular `USER`, hash the password, and return `201 Created` with `{ "token": "<jwt>", "user": { "id": "...", "email": "...", "role": "USER" } }`.
  - Password must be at least 8 characters; shorter passwords return `400 Bad Request` with code `VALIDATION_ERROR`.
  - Trim and lowercase email before storing/comparing. A duplicate normalized email (for example, registering `Alex@Example.com` after `alex@example.com`) returns `409 Conflict` with code `EMAIL_IN_USE`.
  - Invalid input returns `400 Bad Request` with code `VALIDATION_ERROR`.
  - Ignore any client-supplied `role`; public registration always creates a regular `USER` and never grants admin privileges.
- `POST /api/auth/login`
  - Correct credentials return `200 OK` with the same `{ "token": "<jwt>", "user": { "id": "...", "email": "...", "role": "USER|ADMIN" } }` shape.
  - Incorrect email or password returns `401 Unauthorized` with code `UNAUTHORIZED`, using the same message for both cases so the response does not reveal which field was wrong.
- JWT payload contains `sub` (user ID) and `role`; tokens expire after one hour. Expired tokens return `401 Unauthorized` with code `UNAUTHORIZED`.
- Passwords are hashed with bcrypt; never return password hashes or JWT secrets.

### Vehicles and inventory

- `GET /api/vehicles`
  - Returns `200 OK` with `{ "vehicles": [ ... ] }` for an authenticated user.
  - Missing, invalid, or expired token returns `401 Unauthorized` with code `UNAUTHORIZED`.
- `GET /api/vehicles/search`
  - Authenticated search supports `make`, `model`, `category`, `minPrice`, and `maxPrice`. `minPrice` and `maxPrice` are integer `priceCents` values, not decimal currency values.
  - Text filters are case-insensitive. Empty-string filters are treated as absent. Supplied filters combine with AND semantics.
  - Out-of-stock vehicles are included in listing and search results; the UI disables purchase when `quantity` is zero.
  - Returns `200 OK` with `{ "vehicles": [ ... ] }`, including `{ "vehicles": [] }` when a valid search has no matches.
  - Non-numeric or negative price values, or `minPrice > maxPrice`, return `400 Bad Request` with code `VALIDATION_ERROR` and a field-level message.
- `POST /api/vehicles`
  - Admin-only; creates a vehicle and returns `201 Created` with `{ "vehicle": { ...created vehicle... } }`.
  - Required fields: `make`, `model`, `category` (non-empty after trim, max 100 characters), `priceCents` (integer ≥ 0), `quantity` (integer ≥ 0). Missing or invalid fields return `400 Bad Request` with code `VALIDATION_ERROR`.
  - Non-admin returns `403 Forbidden` with code `FORBIDDEN`.
- `PUT /api/vehicles/:id`
  - Admin-only; performs a partial update of `make`, `model`, `category`, `priceCents`, `quantity`. Only fields present in the body are updated; unknown fields are ignored.
  - Applies the same validation rules as `POST /api/vehicles`. Returns `200 OK` with `{ "vehicle": { ...updated vehicle... } }`.
  - Invalid body returns `400 Bad Request` with code `VALIDATION_ERROR`; unknown vehicle ID returns `404 Not Found` with code `VEHICLE_NOT_FOUND`; non-admin returns `403 Forbidden` with code `FORBIDDEN`.
- `DELETE /api/vehicles/:id`
  - Admin-only; deletes an existing vehicle and returns `204 No Content` with an empty body.
  - Unknown vehicle ID returns `404 Not Found` with code `VEHICLE_NOT_FOUND`; non-admin returns `403 Forbidden` with code `FORBIDDEN`.
- `POST /api/vehicles/:id/purchase`
  - Authenticated users may purchase exactly one unit per request; there is no client-supplied quantity field.
  - The database is authoritative; never trust stale vehicle data held by the browser.
  - If the vehicle was deleted, return `404 Not Found` with code `VEHICLE_NOT_FOUND`. If it exists but quantity is zero, return `409 Conflict` with code `OUT_OF_STOCK` and a user-friendly message.
  - If the vehicle's price changed after the user loaded the page, the purchase proceeds at the current database price. Return `200 OK` with `{ "vehicle": { ...current vehicle fields... } }` so the UI reflects the authoritative price and stock.
  - Use Prisma `updateMany` with `where: { id, quantity: { gt: 0 } }` and decrement quantity by one. If `count === 0`, check whether the vehicle exists and return `404 VEHICLE_NOT_FOUND` if not, otherwise `409 OUT_OF_STOCK`. This conditional atomic update prevents overselling and negative stock.
- `POST /api/vehicles/:id/restock`
  - Admin-only; accepts a positive integer `quantity` to add to stock and returns `200 OK` with `{ "vehicle": { ...updated vehicle... } }`.
  - Zero, negative, decimal, string/non-integer, or otherwise malformed quantities return `400 Bad Request` with code `VALIDATION_ERROR`. A restock amount above `10,000` also returns `400 Bad Request` with code `VALIDATION_ERROR`.
  - Unknown vehicle ID returns `404 Not Found` with code `VEHICLE_NOT_FOUND`; non-admin returns `403 Forbidden` with code `FORBIDDEN`.

### General API behavior

- `GET /health` returns `200 OK` with `{ "status": "ok" }` when the service is healthy.
- **Middleware order:** authentication is evaluated before authorization. A request with a missing, invalid, or expired token returns `401 Unauthorized` with code `UNAUTHORIZED`, even on admin-only routes. Only an authenticated request with an insufficient role returns `403 Forbidden` with code `FORBIDDEN`.
- Unknown routes return `404 Not Found` with code `NOT_FOUND`. Unknown resource IDs use the resource-specific code (`VEHICLE_NOT_FOUND`).
- Every 4xx response uses the same JSON error envelope: `{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }`. Do not return a different shape for validation, authentication, authorization, conflict, or not-found errors.
- Add automated tests that assert the error response **shape and required fields**, not just the HTTP status code.
- Do not expose password hashes, JWT signing secrets, stack traces, or other sensitive implementation details.

**Documented error codes**

| Code | Status | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Malformed body, query parameter, or path parameter |
| `UNAUTHORIZED` | 401 | Missing, invalid, or expired token; incorrect login credentials |
| `FORBIDDEN` | 403 | Authenticated but insufficient role |
| `NOT_FOUND` | 404 | Unknown route |
| `VEHICLE_NOT_FOUND` | 404 | Vehicle ID does not exist |
| `EMAIL_IN_USE` | 409 | Duplicate normalized email on register |
| `OUT_OF_STOCK` | 409 | Purchase attempted on a zero-quantity vehicle |

## 5. Frontend Acceptance Criteria

- Registration and login forms show useful validation/error feedback.
- The authenticated home/dashboard displays vehicles and supports searching by make, model, category, and price range.
- Each vehicle has a purchase action; it is disabled when quantity is zero.
- A successful purchase refreshes the displayed stock; a failed purchase displays a useful message.
- Admin users can create, edit, delete, and restock vehicles through the UI.
- The interface is responsive and built with React, HTML5, CSS3, and Tailwind CSS.

## 6. Testing and TDD Workflow

Write a failing test before implementing each behavior, then make it pass and refactor. Prioritize backend tests for:

- Registration, minimum password length, email trim/lowercase normalization, duplicate normalized email, ignored client-supplied role, password hashing, and login success/failure
- Missing, invalid, expired, and valid JWTs
- User versus admin authorization
- Vehicle CRUD validation and not-found behavior
- Search filters individually and in combination
- Purchase success, zero-stock conflict, and concurrent attempts to buy the final unit
- Restock validation for zero, negative, decimal, string, and values above 10,000; verify successful stock increments and updated-vehicle response
- Uniform `{ error: { code, message } }` shape for representative 4xx responses
- `GET /health` success response
- Database persistence across application restarts

Run the test suite before completion and document the actual command and results in the README. Do not claim coverage or passing tests without running them.

## 7. Admin Provisioning and Seed Data

- Use Prisma's seed script at `prisma/seed.ts` to create the initial admin account `admin@example.com` and approximately 10 sample vehicles.
- Public registration always creates regular `USER` accounts; admin privileges are provisioned only through the seed/setup process, never through request input.
- Document the development seed credentials and seed/reset instructions in `README.md`. Keep seed credentials development-only; do not reuse them in production.
- Seed execution should be repeatable without creating duplicate admin accounts or duplicate sample inventory.

## 8. Resolved Implementation Decisions

- Monetary values use integer `priceCents` everywhere, including the vehicle data model and `minPrice`/`maxPrice` search query parameters.
- Register and login return `{ "token": "<jwt>", "user": { "id": "...", "email": "...", "role": "USER|ADMIN" } }`.
- JWT claims are `{ "sub": "<user-id>", "role": "USER|ADMIN" }`, with a one-hour expiry.
- Purchases are one unit per request and use an atomic conditional `updateMany`; `count === 0` triggers a not-found check and then a `409 Conflict` when the vehicle exists but is unavailable.
- Restock returns the updated vehicle.
- The database is authoritative for stale client state: deleted vehicle → `404`; existing vehicle with zero stock → `409`; price changed → purchase proceeds at the current price.
- Search text filters are case-insensitive; empty strings are treated as absent; out-of-stock vehicles remain included in list/search results. `minPrice > maxPrice`, negative prices, and non-numeric prices return `400 Bad Request`.
- Concurrency tests must verify that simultaneous attempts to buy the last unit produce at most one success and never negative stock. Confirm behavior with the chosen SQLite/Prisma version and use an appropriate integration test setup.

## 9. Definition of Done

- Acceptance criteria are covered by automated tests.
- Backend and frontend run locally from documented instructions.
- `GET /health` is implemented and tested.
- Root `TEST_REPORT.md` contains the actual output of `vitest run --coverage`; generate and paste real command output rather than fabricating results.
- The database is persistent and schema setup/migrations are documented, including exact Prisma migration and seed commands.
- The UI supports the required user and admin flows.
- README includes setup, test instructions, screenshots, and a truthful **My AI Usage** section.
- Root `PROMPTS.md` contains raw AI conversations/public links, not AI-generated summaries.
- AI-assisted commits include an accurate co-author trailer as required by the brief.
