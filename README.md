# DevMentor

DevMentor is a web application built on Next.js, React and TypeScript, backed by PostgreSQL.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) (App Router), [React](https://react.dev) |
| Language | TypeScript (strict) |
| Database | PostgreSQL |
| ORM | [MikroORM](https://mikro-orm.io): entities, migrations, connection pooling |
| Dependency injection | [Awilix](https://github.com/jeffijoe/awilix) |
| Styling (frontend pages) | [Tailwind CSS](https://tailwindcss.com) |
| Components (backend/admin pages) | [shadcn/ui](https://ui.shadcn.com) |

## Architecture

The project is an npm-workspaces monorepo. All packages live in `packages/`:

```
packages/
├── app/   # @devmentor/app: Next.js pages, layouts and route handlers (HTTP wiring only)
├── core/  # @devmentor/core: services (business rules), DI container, HTTP layer, env, logger
├── db/    # @devmentor/db: MikroORM config, entities, migrations
└── ui/    # @devmentor/ui: shadcn/ui primitives and the reusable panel layer (forms, tables, API client)
```

### Package dependencies

```
   ┌──────────┐        ┌──────────┐
   │   app    │ ─────▶ │    ui    │   (standalone)
   └────┬─────┘        └──────────┘
        │
        ▼
   ┌──────────┐        ┌──────────┐
   │   core   │ ─────▶ │    db    │ ─────▶ PostgreSQL
   └──────────┘        └──────────┘
```

- The direction is `app → core → db`, and `ui` is standalone. ESLint enforces it.
- Only `db` imports MikroORM, and `core` never imports Next.js or React.
- Domain code is organised by concept folders repeated across layers rather than modules. For example, `auth` has `db/src/entities/auth/`, `core/src/services/auth/` and `app/src/app/api/…`.
- The full engineering standards (naming, principles, security, review checklist) are in [`.ai/docs/engineering-standards.md`](.ai/docs/engineering-standards.md).

### Request flow

```
UsersTable (client)  → useApiQuery → apiCall ──HTTP──▶ api/users/route.ts (makeCrudRoute)
                                                          → withScope → UserService (core) → em (db) → PostgreSQL
```

- **Server**: `core/src/http` provides `apiHandler` (JSON envelope `{ ok, data | error }`, error mapping, CSRF header check), `makeCrudRoute`, typed `AppError`s and Zod-based request parsing.
- **Client**: `ui/src/backend` provides `apiCall` (the only `fetch` to `/api/*`), `useApiQuery`, `DataTable`, `CrudForm` and the loading, error and empty states.

### Data layer

- MikroORM with the PostgreSQL driver, configured in `packages/db`. Entities are defined via `defineEntity` and use UUID primary keys.
- Each process uses one shared ORM instance and connection pool. Each request gets its own forked `EntityManager` through a scoped Awilix container (`withScope`).
- Schema changes are made only through committed MikroORM migrations.
- The app builds and boots without a database. Only API routes and request-time code touch it.

### UI

- **Frontend (public) pages** are in the `(marketing)` route group and use Tailwind CSS.
- **Back-office pages** are in `(admin)/admin` and use shadcn/ui together with the reusable `DataTable` and `CrudForm`.

> **Not production-ready yet:** authentication is not implemented, so `/api/users` and `/admin` are open.

## Getting started

Requirements: Node.js 24+, PostgreSQL, and a `DATABASE_URL` environment variable (e.g. `postgres://user:pass@localhost:5432/devmentor`).

```bash
npm install
npm run db -- migration:up   # apply database migrations
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the frontend and [http://localhost:3000/admin](http://localhost:3000/admin) for the back office.

| Command (repo root) | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js app (`@devmentor/app`) |
| `npm run lint` | ESLint (including package-boundary rules) |
| `npm run audit` | `npm audit`, failing on high/critical advisories not listed in `audit-allowlist.json` |
| `npm run typecheck` | TypeScript in all workspaces |
| `npm test` | Vitest in all workspaces (DB tests use `TEST_DATABASE_URL`, falling back to `DATABASE_URL`) |
| `npm run db -- migration:create` | Generate a migration from entity changes |
| `npm run db -- migration:up` | Apply pending migrations |

Optional env vars: `DATABASE_POOL_MAX` (default 10) and `MIKRO_ORM_DEBUG=true` (logs SQL).

CI (GitHub Actions) runs lint, typecheck, migrations, tests and the build against PostgreSQL 17 on every pull request. Changes reach `main` only through pull requests; see `AGENTS.md` for the PR and labelling rules.

## Working with AI agents

Rules for coding agents are in [`AGENTS.md`](AGENTS.md); `CLAUDE.md` imports it. Specs, run logs and lessons live in `.ai/`.
