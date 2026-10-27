# GitHub Release distribution

This extension is distributed as a ZIP attached to GitHub Releases rather than through the Chrome Web Store.

## Release source of truth

- Branch: `main`
- Version: `package.json`, mirrored to `package-lock.json` and `public/manifest.json`
- Tag: `v{MAJOR.MINOR.PATCH}`
- Asset: `sidebar-for-arc-users-{MAJOR.MINOR.PATCH}.zip`
- Workflow: `.github/workflows/build-release.yml`

The version is deliberately maintained by a human through `tools/update-version.sh`. GitHub Actions validates and publishes it but never decides whether a change is major, minor, or patch.

Repository Actions must be enabled, and the repository/organization policy must allow the workflow's `GITHUB_TOKEN` to receive `contents: write` permission for creating tags, Releases, and assets. If the release job receives HTTP 403, check **Settings → Actions → General → Workflow permissions** and any organization-level restrictions.

Protect `main` so changes arrive through pull requests, require the **Test and package** check, and require branches to be up to date before merge. This prevents two concurrent PRs from both passing with the same next version and then racing to create one tag.

## Workflow behavior

Every branch push and pull request:

1. installs locked npm dependencies;
2. runs the Node test suite;
3. type-checks the extension;
4. builds the production bundle;
5. packages the contents of `dist/` with `manifest.json` at the ZIP root;
6. uploads the ZIP as a GitHub Actions artifact retained for 14 days.

A push to `main` additionally creates a GitHub Release when its `v{version}` tag does not exist. The release body collects the merged PR titles and bodies since the previous SemVer tag and appends GitHub's generated changelog.

Pull requests targeting `main` fail before merge when the semantic version is missing, inconsistent, already released, or not greater than the latest `v*` tag.

## Manual version policy

Use:

```bash
./tools/update-version.sh patch
./tools/update-version.sh minor
./tools/update-version.sh major
./tools/update-version.sh 2.0.0
```

Choose the bump manually:

- Patch for backwards-compatible fixes.
- Minor for backwards-compatible features.
- Major for incompatible changes or required migrations.

## Installing a Release

1. Open the repository's [Releases page](https://github.com/lizeyan/SideBarforArcUsers/releases).
2. Download `sidebar-for-arc-users-{version}.zip` from the latest release.
3. Extract it to a stable folder. Do not load the ZIP directly.
4. Open `chrome://extensions/`.
5. Enable **Developer mode**.
6. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
7. Pin the extension if desired, then click its icon or use `Cmd+Shift+E` / `Ctrl+Shift+E`.

## Updating

1. Download and extract the newer release ZIP.
2. Replace the old extracted directory or choose a new stable directory.
3. Open `chrome://extensions/`.
4. If the directory was replaced in place, click **Reload** on the extension card. If its path changed, remove the old unpacked extension and load the new directory.

Chrome does not automatically update unpacked extensions installed from GitHub Releases. Users must repeat this process for each version.

## Security note

Only download assets from releases in `lizeyan/SideBarforArcUsers`. The ZIP should contain `manifest.json` at its root and should not contain source `.env` files, repository metadata, or API keys.
