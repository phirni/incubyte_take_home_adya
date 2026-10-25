# Car Dealership Inventory

A small full-stack dealership app for browsing, searching, and purchasing cars. Admins can manage the stock. This repository contains the React frontend and the Express/Prisma backend.

## A note about AI commit attribution

The take-home brief asks us to mark AI-assisted commits with a `Co-authored-by` trailer. Its example uses the generic address `AI@users.noreply.github.com`; GitHub connected that address to an unrelated person, Andrey Sitnik. We corrected the two affected commits to use `Codex <noreply@openai.com>`, keeping the AI attribution while avoiding the wrong profile. Only those two commit messages were rewritten.

## What is in the app

- Register and sign in with email and password.
- Browse vehicles and search by make, model, category, and price range.
- Purchase one unit at the current database price. The database prevents stock from going below zero.
- Admin-only create, edit, delete, and restock actions.
- A persistent local SQLite database managed by Prisma.
- Four supplied sedan sprites. The frontend assigns a sprite by vehicle ID and shows a glow/bob effect on row hover or keyboard focus. These are decorative frontend assets; the API has no image field.

Money is stored and sent by the API as integer cents. The search form accepts dollars and converts them to cents at the frontend boundary.

## Run it locally

Use Node.js 24.x and pnpm 12.x. Run the backend and frontend in separate terminals.

From a fresh checkout:

```sh
git clone https://github.com/phirni/incubyte_take_home_adya.git
cd incubyte_take_home_adya
```

If you already have the repository, start from its root directory.

### 1. Start the backend

From the repository root:

```sh
cd backend
pnpm install
cp ../.env.example .env
```

Open `backend/.env` and replace the placeholder `JWT_SECRET` with a long random value. The example config uses port 3000 and allows the local Vite origin `http://localhost:5173`.

Then, in the same backend terminal:

```sh
pnpm db:migrate
pnpm seed
pnpm dev
```

The API listens at `http://localhost:3000`. Check it at `http://localhost:3000/health`; it should return `{"status":"ok"}`.

The seed creates `admin@example.com` and sample inventory when the vehicle table is empty. The development password is `Admin123!` unless `SEED_ADMIN_PASSWORD` is set. Do not use the development credentials outside a local environment.

### 2. Start the frontend

In a second terminal, from the repository root:

```sh
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

The checked-in frontend example points `VITE_API_URL` to `http://localhost:3000`. If you change the backend `PORT`, update `VITE_API_URL` to match and make sure `CORS_ORIGIN` in the backend includes `http://localhost:5173`.

Open `http://localhost:5173`. Sign in with the development admin credentials above to try inventory management, or register a regular user to try browsing and purchasing.

## Useful commands

Run these from the named project directory.

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend/` | `pnpm db:migrate` | Apply the Prisma development migration |
| `backend/` | `pnpm seed` | Seed the development admin and sample inventory |
| `backend/` | `pnpm dev` | Run the API in watch mode |
| `backend/` | `pnpm exec vitest run --coverage` | Run backend tests with coverage |
| `backend/` | `pnpm typecheck` | Type-check backend TypeScript |
| `frontend/` | `pnpm dev` | Run the Vite development server |
| `frontend/` | `pnpm typecheck` | Type-check frontend TypeScript |
| `frontend/` | `pnpm build` | Build the frontend for production |

## Test report

The last recorded full backend coverage run is in [TEST_REPORT.md](TEST_REPORT.md): 111 tests passed across 10 files; statements 99.39%, branches 91.95%, functions 100%, and lines 100%. The full backend suite was not rerun during the sprite integration.

During the sprite integration, `pnpm install`, `pnpm typecheck`, and `pnpm build` passed in `frontend/`. A live smoke check confirmed the backend health route and CORS header, seeded admin login, authenticated vehicle list, a combined make/price search, invalid min/max validation, and HTTP 200 responses for all four sprite files.

## Credits and remaining submission items

See [frontend/CREDITS.md](frontend/CREDITS.md). The sprite source, creator, and license are still marked TODO because they have not been verified. Please fill those in before submitting.

Screenshots have not been added yet. The root [PROMPTS.md](PROMPTS.md) still needs to contain raw AI chat logs or public links, as required by the brief.

## My AI Usage

I used OpenAI Codex to help implement and debug backend routes, tests, configuration, and the frontend integration. I reviewed the changes against the project specification, ran the recorded test and build commands, and used the real local API for a short integration smoke check. AI-assisted commits are marked with Codex co-author trailers.

AI help sped up routine implementation and made it easier to cover edge cases. I still needed to inspect the API contract, verify real command output, and correct the GitHub co-author email after its placeholder address resolved to the wrong person.

## Deliberate trade-offs

- SQLite keeps local setup simple and stores data in a file; deployments need a backend host with persistent storage.
- JWTs are stored in browser local storage for this take-home. For a production service, use a secure cookie design with CSRF protection.
- Vehicle sprites are local presentation assets only. Inventory data continues to come from the backend.
