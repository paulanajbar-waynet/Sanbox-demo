# `next build` fails when NODE_ENV=development

- Date: 2026-10-18
- Context: monorepo migration ([run](../runs/2026-10-18-devmentor-monorepo-migration.md))

## What happened
`npm run build` failed while prerendering `/_global-error` with `TypeError: Cannot read properties of null (reading 'useContext')`.

## Root cause / insight
The sandbox sets `NODE_ENV=development` globally, and `next build` with a non-production `NODE_ENV` breaks prerendering. The error looks like a duplicate-React problem, but `npm ls react` showed a single copy.

## Rule going forward
Run `NODE_ENV=production npm run build` here. When you see this error, check `NODE_ENV` before you look for duplicate React copies.
