# DevMentor: monorepo architecture

- Date: 2026-10-18
- Status: implemented (2026-10-18), see run log `.ai/runs/2026-10-18-devmentor-monorepo-migration.md`

## Goal

Turn the single-package Next.js scaffold into the DevMentor monorepo described in `AGENTS.md` ("Project: DevMentor — architecture").

## Decisions

- Next.js (latest, App Router), React, TypeScript (strict).
- PostgreSQL + MikroORM (entities, migrations, pooling).
- Awilix for DI.
- Tailwind for frontend pages, shadcn/ui for backend pages.
- npm workspaces, with `packages/app`, `packages/core`, `packages/db` and `packages/ui` as the minimum set.

## Migration plan

1. Root `package.json`: `"private": true` and `"workspaces": ["packages/*"]`; move Next.js deps into `packages/app`.
2. Move `src/app`, `public`, `next.config.ts`, `next-env.d.ts`, `eslint.config.mjs` into `packages/app`; add a shared `tsconfig.base.json` at the root.
3. Create `packages/core`, `packages/db` and `packages/ui` with `package.json` (`@devmentor/*`), `tsconfig.json` and `src/index.ts`.
4. Install and configure Tailwind (in `app`, with `ui` sources in its content scanning) and initialise shadcn/ui so it generates components into `packages/ui`.
5. `packages/db`: MikroORM config (`@mikro-orm/postgresql`, `DATABASE_URL`), migrations folder, CLI scripts (`migration:create`, `migration:up`).
6. `packages/app`: Awilix container composition plus a request-scope helper; register `db` and `core`.
7. Root scripts proxying to workspaces (`dev`, `build`, `lint`, `typecheck`).

## Notes and open questions

- Turbopack transpiles workspace packages automatically. `@mikro-orm/core` and `@mikro-orm/knex` are already in Next's default `serverExternalPackages` (see `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/`). Check whether `@mikro-orm/postgresql` needs adding.
- Entity definition style: decorators need SWC/TS decorator config, while `defineEntity`/`EntitySchema` needs none. Decide this in step 5.
- Separation of frontend and backend routes in `app`, e.g. route groups `(site)` and `(admin)`.
- Local PostgreSQL setup, e.g. `docker-compose.yml`.

## Acceptance criteria

- `npm run dev`, `npm run build`, `npm run lint` and type-checking pass from the repo root.
- `app` imports a symbol from each of `core`, `db` and `ui`.
- A MikroORM migration can be created and applied against a local PostgreSQL instance.

## Resolution of open questions

- MikroORM resolved to v7. `@mikro-orm/postgresql` and `@mikro-orm/sql` were added to `serverExternalPackages`.
- Entities use `defineEntity` with `setClass`, the style MikroORM v7 recommends. No decorators.
- Route groups are `(site)` for the frontend and `(admin)` for the back office (`/admin`).
- Local PostgreSQL: the sandbox provides one via `DATABASE_URL`, so there is no docker-compose yet.
