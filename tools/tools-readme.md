# Tools

## update-version.sh

- Manually increments a strict Semantic Version in `package.json`, `package-lock.json`, and `public/manifest.json`.
- Examples: `./tools/update-version.sh patch`, `minor`, `major`, or an exact version such as `2.0.0`.

## update-news-version.sh

- Updates `docs/public/latest.version` based on the number of commits that touched `docs/news/news.md`.

## build-release.sh

Builds the extension and packages the contents of `dist/` as a GitHub Release ZIP. Output goes to `releases/`.

## create-release-tag.sh

Creates a local tag with format `v{version}` from `package.json`. GitHub Actions normally creates this tag automatically when publishing a release from `main`.

## start-test-chrome.sh

Launches Chrome with a fresh test profile. Useful for testing the extension in isolation.

## extract-arc-icons.py

Extracts individual icon images from the Arc Browser icon picker screenshot. Used for the Arc icon picker feature (029).

## prepare-release-instructions.md

Step-by-step instructions for Claude to follow when preparing a release — version bump, changelog generation, link updates, and verification.
