# git cannot reach GitHub: empty GIT_SSL_CAINFO

- Date: 2026-10-18
- Context: pushing the monorepo branch ([run](../runs/2026-10-18-tests-ci-and-pr.md))

## What happened
`git ls-remote` and `git push` failed with "Problem with the SSL CA cert (path? access rights?)". Meanwhile `gh` worked.

## Root cause / insight
The sandbox exports `GIT_SSL_CAINFO=` (an empty string), and git treats it as the CA bundle path. `CURL_CA_BUNDLE` and `SSL_CERT_FILE` are also empty.

## Rule going forward
Run git network commands as `env -u GIT_SSL_CAINFO git …`. Do not change the global git config to work around it.
