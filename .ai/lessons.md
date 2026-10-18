# Lessons

Index of long-term findings, conclusions and improvements recorded by LLMs and humans working in this repo.
Read this file before starting any task. Add one line per lesson, newest first.

Details live in `.ai/lessons/YYYY-MM-DD-slug.md`.

## Index

<!-- Format: - [YYYY-MM-DD slug](lessons/YYYY-MM-DD-slug.md) — one-line takeaway -->
- [2026-10-18 shadcn-cn-import](lessons/2026-10-18-shadcn-cn-import.md): after `shadcn add`, fix `from "cn"` → `@devmentor/ui/lib/utils` and uninstall `cn`
- [2026-10-18 next-build-node-env](lessons/2026-10-18-next-build-node-env.md): sandbox has `NODE_ENV=development`; build with `NODE_ENV=production`
- [2026-10-18 git-ssl-cainfo-empty](lessons/2026-10-18-git-ssl-cainfo-empty.md): git network ops fail on empty `GIT_SSL_CAINFO`; use `env -u GIT_SSL_CAINFO git …`
