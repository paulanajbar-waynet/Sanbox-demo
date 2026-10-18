# Run: engineering standards rollout

- Date: 2026-10-18
- Spec: [.ai/specs/implemented/2026-10-18-engineering-standards-rollout.md](../specs/implemented/2026-10-18-engineering-standards-rollout.md)
- Branch: `feat/engineering-standards` (stacked on `feat/devmentor-monorepo` / PR #1)
- Status: done

## Steps taken

1. The owner pasted the standards document into the conversation, since the file did not exist. Saved it as `.ai/docs/engineering-standards.md`, adding section 6 with notes specific to this repo.
2. Resolved with the owner: dependency direction as in the document, scope of steps 1–3 without auth, stacked PR.
3. **db**: `entities/auth/user.entity.ts` and `base.entity.ts`. Removed `UserRepository` and `registerDb`, and removed the dependency on `core` and `awilix`. Re-exports `EntityManager`/`MikroORM` types. `migration:check` stays clean, so the schema is unchanged.
4. **core**:
   - `config/env.ts` (zod), `logger.ts` (pino with redaction), `container/{container,cradle}.ts` (explicit bindings, `withScope`), `services/auth/user.service.ts` (paged list → `UserDto`).
   - `http/`: `errors`, `envelope`, `apiHandler` (with CSRF header check on unsafe methods), `validation`, `pagination` and `makeCrudRoute`, where unconfigured methods answer 405.
   - The entry point is `server-only`, with a `./validators/*` export for client-safe schemas.
5. **ui**:
   - Primitives moved to `components/ui/`, and `input`/`label` were added via shadcn. The `cn` bug recurred and was fixed per the lesson.
   - `backend/api/{types,apiCall,useApiQuery}`, `backend/forms/CrudForm`, `backend/tables/DataTable` and `backend/feedback/*`.
   - Removed the dependency on `core`.
6. **app**: `api/users` (makeCrudRoute GET), `api/health` (apiHandler, no DB), `(admin)/admin/users` (page plus colocated `UsersTable`: useApiQuery + DataTable), and `(site)` → `(marketing)`. Removed `src/server/container.ts`.
7. **Lint**: root `eslint.config.mjs` with package boundaries, no `@mikro-orm` outside db, no Next/React in core/db, no raw `fetch`, no `any`, no `console`. A deliberate violation in each package produced 12/12 errors.
8. **Audit**: `scripts/audit.mjs` and `audit-allowlist.json`. `braces` GHSA-vfj7-8cjw-p6xm has no fix and is not reachable here (awilix `loadModules` is forbidden), so it is allowlisted until 2027-01-18. Checked that an expired entry blocks. Added it to CI.
9. Bugs found by tests on the way:
   - CrudForm showed Zod's generic message for empty required fields; required fields now get `""`.
   - The React hooks lint flagged setState in an effect, which led to extracting `useApiQuery` (it also removes per-page fetch duplication).
   - `makeCrudRoute` inferred the service type as `unknown`; fixed with `NoInfer`.
10. Browser check (Playwright, headless Chromium) with 23 temporary users:
    - home renders;
    - `/admin` → Users;
    - page 1 has 20 rows ("Page 1 of 2 · 23 total"); after Next, page 2 has 3 rows and Next is disabled;
    - no console errors;
    - test data deleted.

    The first attempt failed because of the dev-server origin (see lessons).

## Verification

- `npm run lint`, `npm run typecheck`, `npm run audit` and `npm run db -- migration:check` all pass.
- `npm test`: 62 tests (db 3, core 35, app 3, ui 21).
- `env -u DATABASE_URL NODE_ENV=production npm run build` passes, so the app builds without a database.
- Live: `/api/health` gives 200 with the envelope; `/api/users` gives 200, or 400 for `pageSize=999`; `POST /api/users` gives 405.

## Outcome

Migration steps 1–3 and 7 of the standards are implemented. Steps 4–6 apply when features arrive, and step 8 does not apply (the file is not in this repo).

## Follow-ups

- Auth PR: `core/src/http/auth.ts`, JWT (HS256, httpOnly cookie), bcrypt ≥ 12, login/register rate limiting, and `requireSession` on `/api/users` and `/admin`.
- Re-review the `braces` allowlist entry by 2027-01-18.
