# Run: DevMentor monorepo migration

- Date: 2026-10-18
- Spec: [.ai/specs/implemented/2026-10-18-devmentor-monorepo-architecture.md](../specs/implemented/2026-10-18-devmentor-monorepo-architecture.md)
- Status: done

## Goal

Carry out the migration plan from the spec: npm workspaces with `packages/{app,core,db,ui}`, Tailwind, shadcn/ui, MikroORM (PostgreSQL) and Awilix.

## Plan

Steps 1–7 from the spec.

## Steps taken

1. Moved `src/`, `public/`, `next.config.ts`, `eslint.config.mjs` and `tsconfig.json` into `packages/app`. `git mv` fails on this overlay filesystem ("Invalid cross-device link"), so I used `cp -a` + `rm`; git still detects the renames.
2. Root `package.json` with workspaces and proxy scripts (`dev`, `build`, `start`, `lint`, `typecheck`, `db`), plus a shared `tsconfig.base.json`. Reinstalled from scratch. Next.js 16.3.4 → 16.4.2 (latest).
3. `core`: `Clock` service and `registerCore()`.
4. `db`: MikroORM 7 (`@mikro-orm/postgresql`, migrations, CLI with `tsx`), `User` entity (`defineEntity`), `UserRepository`, `getOrm()` singleton, `registerDb()` (scoped `em.fork()`). Generated and applied the initial migration.
5. `ui`: hand-written `components.json`, then `shadcn add button card table`. Fixed the broken `cn` import (see lessons). Theme and Tailwind entry are in `src/styles.css`.
6. `app`: Tailwind v4 via PostCSS. `globals.css` imports `@devmentor/ui/styles.css`. Added the Awilix container with `withRequestScope()`. Replaced the sandbox starter page with a Tailwind frontend at `(site)/page.tsx` and a shadcn dashboard at `(admin)/admin`, which shows the user count from the DB.
7. `.gitignore`: un-anchored `node_modules/`, `.next/`, `out/`, `build/` and `coverage/` so they also match inside packages.

## Decisions

- npm workspaces. Internal packages export TypeScript source, which Turbopack transpiles automatically, so they need no build step.
- `defineEntity` instead of decorators, as MikroORM v7 recommends; it needs no decorator compiler config.
- The runtime ORM config (`config.ts`) has no Migrator. The Migrator is added only in the CLI config (`mikro-orm.config.ts`), which keeps it out of the app bundle.
- `@mikro-orm/postgresql` and `@mikro-orm/sql` are in `serverExternalPackages`.
- Example domain entity: `User` (table `users`), as a minimal starting point.

## Files changed

- Root: `package.json`, `package-lock.json`, `tsconfig.base.json`, `.gitignore`, `AGENTS.md`, `README.md`
- `packages/app/**` (moved and new), `packages/core/**`, `packages/db/**`, `packages/ui/**`
- `.ai/specs/implemented/…`, `.ai/lessons/…`, `.ai/lessons.md`

## Verification

- `npm run typecheck`: passes in all 4 workspaces.
- `npm run lint`: passes.
- `NODE_ENV=production npm run build`: passes; `/` is static, `/admin` dynamic. Plain `npm run build` fails because of the sandbox's `NODE_ENV=development` (see lessons).
- `npm run db -- migration:create --initial` and `migration:up` were run against the sandbox PostgreSQL, and `users` was created.
- The dev server (sandbox preview, started from the root via `openmercato.toml`) serves `/` and `/admin` with HTTP 200. The CSS contains classes from both `app` and `ui`.
- `/admin` showed 0, then 1 after inserting a test row via `psql`, then 0 again after deleting it. This confirms DB → repository → DI → page.

## Outcome

The migration is complete and all acceptance criteria in the spec are met.

## Follow-ups

- Decide on real domain entities; `User` is a placeholder.
- Auth/authorization for `/admin`. It is currently open.
- Optional: `docker-compose.yml` for PostgreSQL outside the sandbox, seeders, tests.
