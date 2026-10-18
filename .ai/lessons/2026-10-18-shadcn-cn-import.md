# shadcn CLI breaks the `cn` import in packages/ui

- Date: 2026-10-18
- Context: shadcn/ui setup in `packages/ui` ([run](../runs/2026-10-18-devmentor-monorepo-migration.md))

## What happened
`npx shadcn@4 add button card table` generated `import { cn } from "cn"`, added the unrelated npm package `cn` to `packages/ui`, and did not write any theme variables to `src/styles.css`. `shadcn info` showed the aliases resolved correctly.

## Root cause / insight
This is a shadcn CLI bug in rewriting the `utils` alias for a non-`@/` package alias. Type-checking does not catch it, because the `cn` package exists.

## Rule going forward
After every `shadcn add`, replace `from "cn"` with `from "@devmentor/ui/lib/utils"`, then run `npm uninstall -w @devmentor/ui cn`. The theme lives in `packages/ui/src/styles.css` and is maintained by hand.
