# Merging the base of a stacked PR with --delete-branch closes the stacked PR

- Date: 2026-10-18
- Context: merging PR #1 while PR #2 was stacked on its branch

## What happened
`gh pr merge 1 --rebase --delete-branch` merged PR #1 and deleted `feat/devmentor-monorepo`. GitHub then **closed** PR #2 because its base branch no longer existed. The rebase merge also gave the PR #1 commits new SHAs, so PR #2's branch still carried the old copies.

## Root cause / insight
A PR whose base branch is deleted is closed, not retargeted. A closed PR can be reopened only while its base exists and before its head is force-pushed.

## Rule going forward
- **Before** merging a PR that others are stacked on, retarget the stacked PRs to `main` (`gh api -X PATCH repos/<repo>/pulls/<n> -f base=main`). Alternatively, merge without `--delete-branch` and delete the branch afterwards.
- After a rebase or squash merge, rebase the stacked branch: `git rebase --onto origin/main <old-base-tip> <branch>`. Then push with `--force-with-lease`.
- If the stacked PR is already closed: restore the base branch at its old tip, reopen the PR, switch its base to `main`, force-push the rebased head, and delete the restored branch. This is the order that worked for PR #2.
