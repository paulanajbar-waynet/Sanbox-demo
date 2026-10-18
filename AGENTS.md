<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: DevMentor — architecture (binding)

These are fixed decisions. Do not introduce alternatives (other ORMs, DI libraries, CSS frameworks, component kits) without an approved spec in `.ai/specs/`.

### Stack
- **Next.js** (latest, App Router) + **React** + **TypeScript** (`strict`). No plain JS source files.
- **PostgreSQL** via **MikroORM** (`@mikro-orm/postgresql`) — entities, migrations, connection pooling.
- **Awilix** — dependency injection container.
- **Tailwind CSS** — styling for frontend (public/user-facing) pages.
- **shadcn/ui** — components for backend (admin/back-office) pages.

### Monorepo layout
npm workspaces; every package lives in `packages/` and is named `@devmentor/<dir>`.

| Package | Path | Responsibility |
| --- | --- | --- |
| `@devmentor/app` | `packages/app` | The Next.js application: routes, pages, layouts, route handlers, server actions, DI container composition |
| `@devmentor/core` | `packages/core` | Reusable, framework-agnostic code: domain types, services, utilities, DI helpers |
| `@devmentor/db` | `packages/db` | Data layer: MikroORM config, entities, repositories, migrations, seeders |
| `@devmentor/ui` | `packages/ui` | Reusable UI components (shadcn/ui-based and Tailwind-based) |

Dependency direction (no cycles, no reverse imports):
- `app` → `core`, `db`, `ui`
- `db` → `core`
- `ui` → `core` (types/utilities only)
- `core` → no internal packages

Rules:
- Put code in the lowest package that can own it; only route- or page-specific code stays in `app`.
- Import other packages only through their public entry (`@devmentor/<pkg>`), never via relative paths into another package's `src/`.
- A new package needs a spec; keep the four packages above as the minimum.

### Data (MikroORM)
- Entities, repositories and migrations live only in `packages/db`. No raw SQL or DB clients elsewhere.
- Schema changes go through generated MikroORM migrations committed to git; never edit an applied migration and never rely on schema auto-sync.
- Use one shared `MikroORM` instance (pool) per process and a forked `EntityManager` (`em.fork()`) per request/job — never the global EM.
- DB access happens only on the server (Server Components, route handlers, server actions, scripts) — never in client components.
- Connection settings come from environment variables (e.g. `DATABASE_URL`); never hardcode credentials.
- Define entities with `defineEntity` (no decorators) and add each one to `entities` in `packages/db/src/entities/index.ts`.
- Migrations: `npm run db -- migration:create` and `npm run db -- migration:up` (the CLI config is `packages/db/src/mikro-orm.config.ts`).

### Dependency injection (Awilix)
- The container is composed in `packages/app`. `core` and `db` export registration functions (e.g. `registerDb(container)`), not ready-made containers.
- Services receive dependencies via constructor/factory injection; do not import concrete service instances directly or create service singletons by hand.
- Use request-scoped containers (`container.createScope()`) for anything holding per-request state (e.g. the forked `EntityManager`). In server code use `withRequestScope()` from `packages/app/src/server/container.ts`.

### UI
- Frontend pages: Tailwind utility classes; shared pieces go to `packages/ui`.
- Backend/admin pages: shadcn/ui components (they are also Tailwind-based). Generate them into `packages/ui`, not into `app`: run `npx shadcn@latest add <name>` in `packages/ui`, then export the component from `src/index.ts`. The CLI rewrites the utils import to `from "cn"` and installs an unrelated `cn` package. Change the import to `@devmentor/ui/lib/utils` and uninstall `cn`.
- Frontend pages go in the `src/app/(site)` route group and backend pages in `src/app/(admin)`.
- Tailwind and the shadcn theme come from `@devmentor/ui/styles.css`, which the app's `globals.css` imports.
- Do not add other CSS frameworks or component libraries; avoid new CSS modules except where Tailwind cannot do the job.

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
- Never report work as done without checking it. Minimum: `npm run lint` and `npm run typecheck` (all workspaces, from the repo root); for routing, config or build-related changes also `npm run build`. If the environment sets `NODE_ENV=development`, as this sandbox does, run `NODE_ENV=production npm run build`, otherwise prerendering fails with `reading 'useContext'`.
- For UI or behavior changes, run the app (`npm run dev`) and confirm the change actually works.
- Report results honestly: say what was checked, what failed, and what was skipped.

### Fix bugs autonomously
- Given a bug report, error log or failing check, find the root cause and fix it without asking for step-by-step guidance. Reproduce first, fix, then verify that the original symptom is gone.

### Review before handing off
- Before committing or opening a PR, review your own diff: look for bugs, leftovers and needless complexity. If the solution is hacky, replace it with the clean one rather than shipping it.

### Use subagents and skills
- Delegate broad searches, research and independent subtasks to subagents to keep the main context focused.
- If a workflow repeats, propose turning it into a skill or slash command in `.claude/` and commit it.
