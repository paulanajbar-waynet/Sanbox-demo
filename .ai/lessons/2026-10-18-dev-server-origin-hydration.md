# Browser check on the dev server: page never hydrates via 127.0.0.1

- Date: 2026-10-18
- Context: browser verification of `/admin/users` ([run](../runs/2026-10-18-engineering-standards-rollout.md))

## What happened
In headless Chromium, `/admin/users` stayed on "Loading…" forever and never requested `/api/users`. The only console errors were failed HMR WebSocket handshakes. The same build worked under `next start`.

## Root cause / insight
The dev server runs with `--hostname 0.0.0.0`, and Next 16 blocks dev resources (`/_next/*`, HMR) for origins that are not allowed. The dev log said: `Blocked cross-origin request to Next.js dev resource … from "127.0.0.1"`. Opening the page via `http://localhost:3000` works. Also, in dev mode `getByRole("button", { name: "Next" })` also matches the "Open Next.js Dev Tools" button.

## Rule going forward
Browser-test the dev server via `http://localhost:3000`, or add the origin to `allowedDevOrigins`. Before suspecting the code, read `packages/app/.next/dev/logs/next-development.log`. In Playwright, use `exact: true` for short button names.
