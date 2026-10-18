<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: DevMentor — architecture (binding)

These are fixed decisions. Do not introduce alternatives (other ORMs, DI libraries, CSS frameworks, component kits) without an approved spec in `.ai/specs/`. The full engineering standards (naming, principles, security minimums, review checklist) are in `.ai/docs/engineering-standards.md`. Read them before adding a domain concept, a route or a screen. Section 6 of that file records where this repo deviates from it.

### Stack
- **Next.js** (latest, App Router) + **React** + **TypeScript** (`strict`). No plain JS source files.
- **PostgreSQL** via **MikroORM** (`@mikro-orm/postgresql`) — entities, migrations, connection pooling.
- **Awilix** — dependency injection container.
- **Zod** — validation; one schema shared by the API route and the form.
- **pino** — the shared logger (`logger` from `@devmentor/core`), with redaction of passwords, tokens and auth headers.
- **Tailwind CSS** — styling for frontend (public/user-facing) pages.
- **shadcn/ui** — components for backend (admin/back-office) pages.

### Monorepo layout
npm workspaces; every package lives in `packages/` and is named `@devmentor/<dir>`.

| Package | Path | Responsibility |
| --- | --- | --- |
| `@devmentor/app` | `packages/app` | Next.js: pages, layouts, route handlers (HTTP wiring only) |
| `@devmentor/core` | `packages/core` | Business rules: services, DI container (`container/`), HTTP layer (`http/`), env, logger, validators |
| `@devmentor/db` | `packages/db` | Persistence: MikroORM config, entities, migrations. The only package that imports `@mikro-orm/*` |
| `@devmentor/ui` | `packages/ui` | Presentation: shadcn primitives, the reusable panel layer (`backend/`), concept components |

Dependency direction is **`app → core → db`**. `ui` is standalone and importable by `app` only. ESLint (`no-restricted-imports` in the root `eslint.config.mjs`) enforces this, and the boundary must not be loosened for convenience:
- `db` imports no `@devmentor/*` package and no Next/React.
- `core` imports only `@devmentor/db`, never Next/React, and never `@mikro-orm/*` (it uses the type re-exports from `@devmentor/db`).
- `ui` imports no `@devmentor/*` package and no `@mikro-orm/*`.
- `app` imports `core` and `ui`, never `db` or `@mikro-orm/*`. Only tests may import `@devmentor/db` to create fixtures.
- `@devmentor/core` is a `server-only` entry. Client components may only `import type` from it. Shared runtime code for the client (Zod schemas) goes through `@devmentor/core/validators/*`.

Rules:
- Import other packages only through their public entry (`@devmentor/<pkg>`), never via relative paths into another package's `src/`.
- A new package needs a spec; keep the four packages above as the minimum.

### Domain concept convention

Domain code is not organized into `modules/`. Each concept (`auth`, `mentors`, `availability`, `bookings`, `payments`, `messages`, `favorites`, `reviews`, ...) is a same-named sub-folder repeated across the layers that need it:

- `packages/db/src/entities/<concept>/<name>.entity.ts`
- `packages/core/src/services/<concept>/<name>.service.ts`
- `packages/core/src/validators/<concept>/` (shared Zod schemas, when needed)
- `packages/app/src/app/api/<concept>/route.ts` and the matching `page.tsx` under the relevant route group

Create a concept folder only when its first file is added — never scaffold empty ones. This is a directory convention, not a module runtime: there is no per-concept setup/ACL/auto-discovery. See `.ai/docs/engineering-standards.md` for the full naming table, the step-by-step recipe (section 2) and the payments-port/event-emitter patterns.

Event IDs follow `concept.entity.action` (e.g. `bookings.booking.created`) and are emitted through the typed emitter in `packages/core/src/events`, registered on the `Cradle` — this is in-process only; there is no queue/worker in this project. (`events/` is created together with the first feature that emits an event.)

### Reusable API & UI layer

Every route and every page reuses two shared layers instead of re-implementing fetch/validation/auth/error-handling per feature:

- `packages/core/src/http/`:
  - `errors.ts`: the typed `AppError` hierarchy. Services throw these and never build a response.
  - `apiHandler.ts`: wraps a route. It enforces the CSRF header on state-changing methods, maps `AppError`s to a status and the JSON envelope `{ ok, data }` / `{ ok, error: { code, message, fieldErrors? } }`, and logs unexpected failures without leaking them.
  - `makeCrudRoute.ts`: for plain CRUD resources. Service and schemas go in, `{ GET, POST, PUT, DELETE }` come out; re-export only what you configured.
  - `validation.ts`: `parseQuery` and `parseJsonBody`, which return only the schema output (no mass assignment).
  - `pagination.ts`: `pageQuerySchema` and `Page<T>`.
  - `auth.ts` (`requireSession`, `requireRole`, ownership assertions) arrives with the auth PR.
- `packages/ui/src/backend/`:
  - `api/apiCall.ts`: the only sanctioned `fetch()` call site; lint forbids `fetch` elsewhere in `app` and `ui`.
  - `api/useApiQuery.ts`: loading data in client components.
  - `forms/CrudForm.tsx`, `tables/DataTable.tsx` and `feedback/{LoadingMessage,ErrorMessage,EmptyState}.tsx`.

Reference example to copy: `/admin/users`, which combines `api/users/route.ts` (`makeCrudRoute`), `UserService.list` and `UsersTable.tsx` (`useApiQuery` + `DataTable`).

New reusable components have one designated home each — never scattered ad hoc:

1. Shadcn primitive → `ui/src/components/ui/` (via `npx shadcn@latest add`, never hand-written).
2. Generic, concept-agnostic panel pattern → `ui/src/backend/<category>/`.
3. Component tied to one concept's domain shape → `ui/src/components/<concept>/`, named after the same concept folder used in `db`/`core`.
4. Used by exactly one page → colocate next to that `page.tsx` until a second consumer appears.

### Data (MikroORM)
- Entities and migrations live only in `packages/db`, and queries run only in `core` services through the injected `em`. No raw SQL with interpolated input, and no DB access from pages or client components.
- Schema changes go through generated MikroORM migrations committed to git; never edit an applied migration and never rely on schema auto-sync.
- Use one shared `MikroORM` instance (pool) per process and a forked `EntityManager` per request/job — never the global EM.
- Define entities with `defineEntity` (no decorators), spread `baseProperties` from `entities/base.entity.ts` (UUID `id`, `createdAt`), and add each one to `entities` in `packages/db/src/entities/index.ts`.
- Services return explicit DTOs (see `UserDto`), never raw entities, so new columns cannot leak.
- The app must build and boot with no database reachable. Pages that query at render time call `await connection()` from `next/server`; the `dynamic = "force-dynamic"` mentioned in the standards is the previous Next.js caching model.
- Connection settings come from environment variables (`DATABASE_URL`); other configuration goes through `loadEnv()` in `core/src/config/env.ts`. Never hardcode secrets.
- Migrations: `npm run db -- migration:create` and `npm run db -- migration:up` (the CLI config is `packages/db/src/mikro-orm.config.ts`).

### Dependency injection (Awilix)
- The container lives in `packages/core/src/container/`. Every binding is one explicit line in `container.ts` plus its type in `cradle.ts`. No `loadModules` or globbing.
- Services receive dependencies via constructor injection (`asClass(...).scoped()`); never import concrete service instances or hand-roll singletons.
- Route handlers and server code run services through `withScope()`, which gives a request scope with its own forked `EntityManager` and is disposed afterwards. `makeCrudRoute` does this for you.

### UI
- Route groups: `(marketing)` for public pages (Tailwind) and `(admin)/admin/…` for back-office pages (shadcn/ui). Persona groups such as `(auth)`, `(student)` and `(mentor)` are created with their first page. Page default exports are named `<Segment>Page`.
- Add shadcn primitives with `npx shadcn@latest add <name>` in `packages/ui`; they land in `src/components/ui/`. Then export them from `src/index.ts`. The CLI rewrites the utils import to `from "cn"` and installs an unrelated `cn` package. Change the import to `@devmentor/ui/lib/utils` and uninstall `cn`.
- Tailwind and the shadcn theme come from `@devmentor/ui/styles.css`, which the app's `globals.css` imports.
- Do not add other CSS frameworks or component libraries; avoid new CSS modules except where Tailwind cannot do the job.

### Security minimums
Follow "Security & Validation" and the review checklist in `.ai/docs/engineering-standards.md`. Every route that is not explicitly public enforces auth server-side, and mutations check ownership of the specific record. Fail closed. Until the auth PR lands, `/api/users` and `/admin/*` are unauthenticated and **must not be deployed publicly**.

## `.ai/` directory — mandatory workflow

All AI-related project knowledge lives in `.ai/`. Follow these rules in every session.

```
.ai/
├── specs/              # Specifications for Spec-Driven Development (SDD)
│   ├── implemented/    # Specs that are fully implemented
│   └── archive/        # Abandoned or superseded specs
├── runs/               # Logs of autonomous AI runs
├── lessons.md          # Index of long-term lessons (read first)
└── lessons/            # One file per lesson
```

Date in all names is `YYYY-MM-DD` (the current date); slug is lowercase-kebab-case.

### Specs — `.ai/specs/YYYY-MM-DD-slug.md`
- Non-trivial features or behavior changes: write or find a spec in `.ai/specs/` **before** writing code. Implement what the spec says; if reality diverges, update the spec first.
- When a spec is fully implemented, move it to `.ai/specs/implemented/`. When abandoned or superseded, move it to `.ai/specs/archive/`. Never delete specs.

### Runs — `.ai/runs/YYYY-MM-DD-slug.md`
- Every autonomous run (work without step-by-step human guidance) MUST create a log file at the start and keep it updated: goal, related spec, steps, decisions, files changed, verification, outcome, follow-ups.

### Lessons — `.ai/lessons.md` and `.ai/lessons/YYYY-MM-DD-slug.md`
- **Before starting a task**, read `.ai/lessons.md` and any lesson relevant to the task.
- **After** fixing a bug, being corrected, discovering a non-obvious pitfall, or finding a better approach, you MUST record a lesson: create `.ai/lessons/YYYY-MM-DD-slug.md` (what happened, root cause/insight, rule going forward) and add a one-line entry to `.ai/lessons.md`.
- Also record anything the user asks you to remember long-term.
- Keep lessons short, specific and actionable; update an existing lesson instead of duplicating it.
- If a lesson is a rule that applies to every task, also add it as a short rule to `AGENTS.md`, so the same mistake doesn't come back.

## Working rules

### Plan before complex work
- For anything spanning several files, unclear requirements or architectural choices, start in plan mode: read the code, then propose a plan before editing. Save the agreed plan in the task's spec (see Specs).
- If the implementation goes off track, stop and re-plan instead of pushing through with patches.

### Verify every change
- Never report work as done without checking it. Minimum: `npm run lint`, `npm run typecheck` and `npm test` (all workspaces, from the repo root; DB tests need `DATABASE_URL` or `TEST_DATABASE_URL`); for routing, config or build-related changes also `npm run build`; after dependency changes, `npm run audit`. That script fails on any high/critical advisory not in `audit-allowlist.json`, and every allowlist entry needs a reason and a `reviewBy` date. CI (`.github/workflows/ci.yml`) runs the full gate: audit, lint, typecheck, `db migration:up` + `migration:check`, test, build. If the environment sets `NODE_ENV=development`, as this sandbox does, run `NODE_ENV=production npm run build`, otherwise prerendering fails with `reading 'useContext'`.
- When checking the dev server in a browser, use `http://localhost:3000`. Next 16 blocks dev resources for other origins (e.g. `127.0.0.1`) unless they are listed in `allowedDevOrigins`, so the page never hydrates.
- For UI or behavior changes, run the app (`npm run dev`) and confirm the change actually works.
- Report results honestly: say what was checked, what failed, and what was skipped.

### Fix bugs autonomously
- Given a bug report, error log or failing check, find the root cause and fix it without asking for step-by-step guidance. Reproduce first, fix, then verify that the original symptom is gone.

### Tests
- Every feature or bug fix ships with tests in the same change. Unit tests live in `packages/<pkg>/test/`, and DB-touching code gets integration tests against real PostgreSQL.
- Tests are self-contained: they create their own fixtures, remove them in teardown, and never depend on existing data.
- A spec for a new feature lists the tests that will cover it.

### Git and pull requests
- Never commit or push directly to `main`. Work on a branch (`feat/…`, `fix/…`, `refactor/…`, `docs/…`) and open a PR.
- A PR is merged only when CI is green. The description gives what changed, why, the linked spec or run log, and how it was verified.
- Labels on each PR: one category (`feature`, `bug`, `refactor`, `documentation`, `dependencies`, `security`), exactly one `priority-{low|medium|high|extreme}`, exactly one `risk-{low|medium|high}`, and one pipeline label (`review` by default, then `changes-requested`, `qa` or `merge-queue`). `blocked` and `do-not-merge` are hard stops.
- Add `needs-qa` when a PR changes UI, the DB schema or the API surface; such a PR is merged only with `qa-approved`.
- In this sandbox, run git network commands with `env -u GIT_SSL_CAINFO git …`, because the variable is set to an empty string.

### Review before handing off
- Before committing or opening a PR, review your own diff: look for bugs, leftovers and needless complexity. If the solution is hacky, replace it with the clean one rather than shipping it.

### Use subagents and skills
- Delegate broad searches, research and independent subtasks to subagents to keep the main context focused.
- If a workflow repeats, propose turning it into a skill or slash command in `.claude/` and commit it.
