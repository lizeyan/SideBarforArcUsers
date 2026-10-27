## Summary

- Describe the user-visible outcome.
- Note migrations, limitations, or manual upgrade steps.

## Semantic version

- [ ] I updated `package.json`, `package-lock.json`, and `public/manifest.json` with `tools/update-version.sh`.
- Release version: `x.y.z`
- Bump type: patch / minor / major

Every PR targeting `main` must use a version greater than the latest `v*` Release tag. The merged PR title and body are copied into the automatic GitHub Release notes, so keep this description public-safe and useful to users.

## Validation

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `git diff --check`
- [ ] `npm run build`
- [ ] Tested the packaged ZIP as an unpacked extension when behavior changed
