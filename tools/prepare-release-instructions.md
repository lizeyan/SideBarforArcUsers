# Prepare Release Instructions

Releases are created automatically by `.github/workflows/build-release.yml` after a version-bumped pull request is merged into `main`.

## 1. Choose the semantic version bump

- `patch`: backwards-compatible fixes, for example `1.0.349 -> 1.0.350`
- `minor`: backwards-compatible features, for example `1.0.349 -> 1.1.0`
- `major`: incompatible behavior or migration, for example `1.0.349 -> 2.0.0`

Run one of:

```bash
./tools/update-version.sh patch
./tools/update-version.sh minor
./tools/update-version.sh major
./tools/update-version.sh 2.0.0
```

This updates and stages `package.json`, `package-lock.json`, and `public/manifest.json`.

## 2. Write a useful pull request description

The release workflow automatically builds release notes from merged PR titles and PR bodies, then appends GitHub's generated changelog. The PR body should therefore contain:

- a concise user-facing summary;
- important migrations or breaking behavior;
- validation commands and results;
- limitations or manual steps users need after upgrading.

Do not put secrets, internal URLs, or private screenshots in the PR body because it will be copied to a public GitHub Release.

## 3. Update user-facing changelogs when appropriate

- Update `docs/changelog.md` for user-facing changes.
- Add an entry to `src/data/changelog.ts` when the extension should show a What's New dialog for the new version.
- Skip in-app What's New entries for internal-only or documentation-only releases.

## 4. Validate before opening the PR

```bash
npm test
npm run typecheck
git diff --check
npm run build
./tools/build-release.sh
```

Load the exact generated ZIP contents as an unpacked extension in a clean Chrome profile for a final smoke test.

## 5. Merge through a pull request

For PRs targeting `main`, GitHub Actions verifies that:

- package and manifest versions match;
- the version is strict `MAJOR.MINOR.PATCH` SemVer;
- the version is greater than the latest `v*` release tag;
- the release tag does not already exist;
- tests, type-checking, and production build pass.

After merge, GitHub Actions creates tag `v{version}`, publishes a GitHub Release, and uploads `sidebar-for-arc-users-{version}.zip`.

Pushes and pull requests on other branches still build and upload a 14-day GitHub Actions artifact, but do not create a Release.
