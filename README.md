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
├── app/   # @devmentor/app: Next.js application (routes, pages, server actions, DI composition)
├── core/  # @devmentor/core: reusable, framework-agnostic domain code and utilities
├── db/    # @devmentor/db: MikroORM config, entities, repositories, migrations, seeders
└── ui/    # @devmentor/ui: reusable UI components (Tailwind + shadcn/ui)
```

### Package dependencies

```
            ┌──────────────┐
            │     app      │
            └──┬────┬────┬─┘
               │    │    │
        ┌──────┘    │    └──────┐
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │   ui   │  │   db   │  │  core  │
   └───┬────┘  └───┬────┘  └────────┘
       │           │            ▲
       └───────────┴────────────┘
```

- `core` depends on no other internal package.
- `db` and `ui` may depend only on `core`.
- `app` puts everything together and is the only package that knows about Next.js routing.

### Data layer

- MikroORM with the PostgreSQL driver, configured in `packages/db`.
- Each process uses one shared ORM instance and connection pool. Each request or job gets its own forked `EntityManager`.
- Schema changes are made only through committed MikroORM migrations.
- The database is reached only from server code: Server Components, route handlers, server actions and scripts.

### Dependency injection

- An Awilix container is composed in `packages/app`. `core` and `db` expose registration functions that add their services to it.
- Per-request state, such as the forked `EntityManager`, lives in a scoped container (`createScope()`).

### UI

- **Frontend (user-facing) pages** use Tailwind CSS.
- **Backend (admin) pages** use shadcn/ui components.
- Shared components of both kinds live in `packages/ui`.

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
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript in all workspaces |
| `npm run db -- migration:create` | Generate a migration from entity changes |
| `npm run db -- migration:up` | Apply pending migrations |

Optional env vars: `DATABASE_POOL_MAX` (default 10) and `MIKRO_ORM_DEBUG=true` (logs SQL).

## Working with AI agents

Rules for coding agents are in [`AGENTS.md`](AGENTS.md); `CLAUDE.md` imports it. Specs, run logs and lessons live in `.ai/`.
