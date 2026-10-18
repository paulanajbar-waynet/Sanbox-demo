# Engineering standards rollout (migration steps 1–3)

- Date: 2026-10-18
- Status: implemented (2026-10-18)
- Source: `.ai/docs/engineering-standards.md`. Section 6 of that document lists where this repo deviates from it.

## Decisions (confirmed with the owner on 2026-10-18)

- Dependency direction follows the standards: `app → core → db`, and `ui` is standalone, importable by `app` only. This replaces the earlier `db → core` and `ui → core` direction.
- Scope is migration steps 1–3 plus step 7 (AGENTS.md). Auth (`http/auth.ts`, JWT, bcrypt, rate limiting) gets its own PR, so `/api/users` is GET-only and unauthenticated for now.
- The work is a stacked PR on PR #1 (`feat/devmentor-monorepo`).

## Changes

1. **db**: `entities/auth/user.entity.ts` with `base.entity.ts` (UUID `id`, `createdAt`). `db` holds only entities, ORM config and the ORM singleton, re-exports the MikroORM types that `core` needs, and has no internal dependencies. `UserRepository` and `registerDb` move to `core`. The DB schema is unchanged, so `migration:check` stays clean.
2. **core**:
   - `config/env.ts` (zod) and `logger.ts` (pino with redaction).
   - `container/{container.ts,cradle.ts}` with explicit registration and `withScope()`.
   - `services/auth/user.service.ts` with `list({ page, pageSize })`.
   - `http/{errors,apiHandler,makeCrudRoute,pagination}.ts`, using standard `Request`/`Response` and no `next` import.
3. **ui**:
   - shadcn primitives move to `components/ui/`; input and label are added.
   - `backend/api/{apiCall,types}.ts` (custom CSRF header, `readJsonSafe`).
   - `backend/forms/CrudForm.tsx` (zod validation, server `fieldErrors`, Cmd/Ctrl+Enter, Escape).
   - `backend/tables/DataTable.tsx` (loading/empty/error states, pagination, row actions).
   - `backend/feedback/*`.
   - The dependency on `@devmentor/core` is removed.
4. **app**:
   - `api/users/route.ts` built with `makeCrudRoute` (GET), `api/health/route.ts` built with `apiHandler` (no DB).
   - `(admin)/admin/users/page.tsx` fetches through `apiCall` and renders through `DataTable`; the `/admin` dashboard links to it.
   - `(site)` is renamed to `(marketing)`, and `src/server/container.ts` is removed (it moved to core).
5. **Lint**: a root ESLint config for all packages, enforcing:
   - the package boundaries (`no-restricted-imports`);
   - only `db` imports `@mikro-orm/*`;
   - `core` never imports `next` or `react`;
   - no raw `fetch` outside `apiCall`;
   - no `any`, no `console`.
6. **Docs**: AGENTS.md (dependency direction, sections from standards §3, DI location), README.
7. **Validation gate**: add `npm audit` (standards: dependency hygiene).

## Tests

- core:
  - `errors` and `apiHandler`: envelope, status mapping, unexpected errors logged without leaking the stack;
  - `makeCrudRoute`: query validation, pagination bounds, 400 on bad input, envelope;
  - `UserService.list` against PostgreSQL, with fixtures removed in teardown;
  - `withScope`: separate EM per scope, dispose on error (moved from app).
- ui:
  - `apiCall`: envelope parsing, non-JSON body, network error, CSRF header;
  - `DataTable` states and pagination;
  - `CrudForm`: client validation, server `fieldErrors`, keyboard shortcuts.
- app: `/api/users` and `/api/health` route handlers end-to-end against PostgreSQL.
- Build must succeed without `DATABASE_URL`.

## Acceptance criteria

- `npm run lint`, `typecheck`, `test`, `build` and `db migration:check` pass, and `npm audit` reports no high or critical issues.
- A lint rule fails on a forbidden cross-package import, checked with a deliberate violation.
- `/admin/users` lists users via `/api/users`, and `/api/health` returns `{ ok: true, data: { status: "ok" } }`.

## Implementation notes

- Added `useApiQuery` (`ui/src/backend/api/`) as part of the reusable client layer. The React hooks lint rejects setState-in-effect, and without it every list page would duplicate its fetch logic.
- Added `npm run audit` via `scripts/audit.mjs`, with an expiring `audit-allowlist.json`, because the only high advisory (`braces`) has no fixed release.
- `makeCrudRoute` always returns all four handlers; the unconfigured ones answer 405.
