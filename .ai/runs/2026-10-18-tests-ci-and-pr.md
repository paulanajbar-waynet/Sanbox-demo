# Run: tests, CI and PR for the monorepo migration

- Date: 2026-10-18
- Spec: [.ai/specs/implemented/2026-10-18-tests-and-ci.md](../specs/implemented/2026-10-18-tests-and-ci.md)
- Status: done

## Goal

Follow the Open Mercato workflow: no direct push to `main`. Add tests and CI to the migration branch, push, and open a labelled PR.

## Steps taken

1. Reset local `main` to `b6346d7`; the work stays on `feat/devmentor-monorepo`.
2. Found that `git` could not reach GitHub because `GIT_SSL_CAINFO` is set to an empty string; it works with `env -u GIT_SSL_CAINFO`. The remote repo is empty and public. Scanned history for secrets: clean.
3. Added Vitest 5 tests: `core` (2 unit), `db` (4 integration against PostgreSQL: migrations/schema check, scoped `em.fork()`, `UserRepository.count`, unique email), `app` (3 integration: DI composition via `withRequestScope`, separate EM per request, scope disposed on error). Fixtures are removed in teardown; the users table is empty after a run.
4. Mutation check: with `scope.dispose()` removed from `withRequestScope`, the dispose test fails. Code restored.
5. Added `.github/workflows/ci.yml` (PostgreSQL 17 service): `npm ci`, lint, typecheck, `migration:up`, `migration:check`, test, build. The full gate passes locally.
6. `AGENTS.md`: tests rule, git/PR workflow and labels (modelled on the Open Mercato `AGENTS.md`), `npm test` added to verification. README: test command and CI.
7. Pushed `main` (`b6346d7`, the PR base) and `feat/devmentor-monorepo` to `origin`. Created the Open Mercato label set (category, pipeline, QA, priority, risk).
8. Opened PR #1 with labels `feature`, `priority-medium`, `risk-medium`, `review` and `needs-qa`. CI run 39153547714 was green (1m7s).
9. CI warned that checkout and setup-node v4 run on the deprecated Node 20, so I bumped them to `actions/checkout@v7` and `actions/setup-node@v7` (both `node24`).

## Verification

- Local: lint, typecheck, `migration:check`, 9 tests and build all pass.
- CI green on PR #1.

## Outcome

PR #1 is ready for review and QA (`needs-qa`). It must not be merged before `qa-approved`.

## Follow-ups

- Manual QA of `/` and `/admin`, then `qa-approved` → `merge-queue` → merge.
- Branch protection on `main` (require the CI check and a PR) in the GitHub settings.
