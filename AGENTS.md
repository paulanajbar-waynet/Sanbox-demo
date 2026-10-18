<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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
- Never report work as done without checking it. Minimum: `npm run lint` and `npx tsc --noEmit`; for routing, config or build-related changes also `npm run build`.
- For UI or behavior changes, run the app (`npm run dev`) and confirm the change actually works.
- Report results honestly: say what was checked, what failed, and what was skipped.

### Fix bugs autonomously
- Given a bug report, error log or failing check, find the root cause and fix it without asking for step-by-step guidance. Reproduce first, fix, then verify that the original symptom is gone.

### Review before handing off
- Before committing or opening a PR, review your own diff: look for bugs, leftovers and needless complexity. If the solution is hacky, replace it with the clean one rather than shipping it.

### Use subagents and skills
- Delegate broad searches, research and independent subtasks to subagents to keep the main context focused.
- If a workflow repeats, propose turning it into a skill or slash command in `.claude/` and commit it.
