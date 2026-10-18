# Tests and CI

- Date: 2026-10-18
- Status: implemented (2026-10-18), PR #1

## Goal

The monorepo migration PR must ship with automated tests and CI, so that no change is merged without passing `lint`, `typecheck`, `test` and `build`.

## Requirements

- Vitest as the test runner, run from the root with `npm test` (all workspaces).
- **core**: unit tests for `systemClock` and `registerCore`.
- **db**: integration tests against real PostgreSQL:
  - migrations apply cleanly (`orm.migrator.up()`), and the schema matches the entities (no pending diff);
  - `UserRepository.count()` reflects inserted rows;
  - `registerDb` gives each request scope its own forked `EntityManager`, and the root `orm.em` is not used.
- **app**: integration test of the DI composition: `withRequestScope()` resolves `userRepository` and disposes the scope.
- Tests are self-contained: they create their own fixtures and remove them in teardown, and do not depend on existing data.
- DB tests use `DATABASE_URL`. `TEST_DATABASE_URL` takes precedence if set.
- GitHub Actions workflow on push and pull request to `main`, with a PostgreSQL 17 service: `npm ci`, `lint`, `typecheck`, `db migration:up`, `test`, `build`.

## Acceptance criteria

- `npm test` passes locally against the sandbox PostgreSQL.
- CI passes on the PR.
