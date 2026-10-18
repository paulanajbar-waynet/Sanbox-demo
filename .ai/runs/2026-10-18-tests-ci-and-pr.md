# Run: tests, CI and PR for the monorepo migration

- Date: 2026-10-18
- Spec: [.ai/specs/2026-10-18-tests-and-ci.md](../specs/2026-10-18-tests-and-ci.md)
- Status: in progress

## Goal

Follow the Open Mercato workflow: no direct push to `main`. Add tests and CI to the migration branch, push, and open a labelled PR.

## Steps taken

1. Reset local `main` to `b6346d7`; the work stays on `feat/devmentor-monorepo`.
2. Found that `git` could not reach GitHub because `GIT_SSL_CAINFO` is set to an empty string; it works with `env -u GIT_SSL_CAINFO`. The remote repo is empty and public. Scanned history for secrets: clean.
3. Added Vitest 5 tests: `core` (2 unit), `db` (4 integration against PostgreSQL: migrations/schema check, scoped `em.fork()`, `UserRepository.count`, unique email), `app` (3 integration: DI composition via `withRequestScope`, separate EM per request, scope disposed on error). Fixtures are removed in teardown; the users table is empty after a run.
4. Mutation check: with `scope.dispose()` removed from `withRequestScope`, the dispose test fails. Code restored.
5. Added `.github/workflows/ci.yml` (PostgreSQL 17 service): `npm ci`, lint, typecheck, `migration:up`, `migration:check`, test, build. The full gate passes locally.
6. `AGENTS.md`: tests rule, git/PR workflow and labels (modelled on the Open Mercato `AGENTS.md`), `npm test` added to verification. README: test command and CI.
