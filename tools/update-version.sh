#!/bin/bash
#
# Manually updates the extension's strict MAJOR.MINOR.PATCH semantic version.
#
# Usage:
#   ./tools/update-version.sh patch        # 1.2.3 -> 1.2.4
#   ./tools/update-version.sh minor        # 1.2.3 -> 1.3.0
#   ./tools/update-version.sh major        # 1.2.3 -> 2.0.0
#   ./tools/update-version.sh 2.1.0        # exact version
#   ./tools/update-version.sh patch --commit

set -euo pipefail

cd "$(dirname "$0")/.."

printHelp()
{
    cat <<'EOF'
Usage: ./tools/update-version.sh [patch|minor|major|MAJOR.MINOR.PATCH] [--commit|-c]

Updates package.json, package-lock.json, and public/manifest.json.
With no version argument, defaults to a patch increment.
EOF
}

CURRENT_VERSION=$(node -p "require('./package.json').version")
VERSION_SPEC="patch"
COMMIT=false

while [ $# -gt 0 ]; do
    case "$1" in
        patch|minor|major) VERSION_SPEC="$1" ;;
        --commit|-c) COMMIT=true ;;
        --help|-h) printHelp; exit 0 ;;
        *) VERSION_SPEC="$1" ;;
    esac
    shift
done

if [[ ! "$CURRENT_VERSION" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
    echo "Current version is not strict MAJOR.MINOR.PATCH SemVer: $CURRENT_VERSION" >&2
    exit 1
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$VERSION_SPEC" in
    patch) NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))" ;;
    minor) NEW_VERSION="${MAJOR}.$((MINOR + 1)).0" ;;
    major) NEW_VERSION="$((MAJOR + 1)).0.0" ;;
    *) NEW_VERSION="$VERSION_SPEC" ;;
esac

if [[ ! "$NEW_VERSION" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
    echo "New version must be strict MAJOR.MINOR.PATCH SemVer: $NEW_VERSION" >&2
    exit 1
fi

node - "$CURRENT_VERSION" "$NEW_VERSION" <<'NODE'
const [current, next] = process.argv.slice(2);
const parse = (value) => value.split('.').map(Number);
const [currentMajor, currentMinor, currentPatch] = parse(current);
const [nextMajor, nextMinor, nextPatch] = parse(next);
const isGreater = nextMajor > currentMajor ||
  (nextMajor === currentMajor && nextMinor > currentMinor) ||
  (nextMajor === currentMajor && nextMinor === currentMinor && nextPatch > currentPatch);
if (!isGreater) {
  console.error(`New version ${next} must be greater than current version ${current}.`);
  process.exit(1);
}
NODE

echo "Updating version: ${CURRENT_VERSION} -> ${NEW_VERSION}"

# npm keeps package.json and package-lock.json in sync without creating a Git tag.
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version >/dev/null

node - "$NEW_VERSION" <<'NODE'
const fs = require('fs');
const version = process.argv[2];
const path = 'public/manifest.json';
const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
manifest.version = version;
fs.writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
NODE

git add package.json package-lock.json public/manifest.json
echo "Updated package.json, package-lock.json, and public/manifest.json to ${NEW_VERSION}"

if [ "$COMMIT" = true ]; then
    git commit -m "build: bump version to ${NEW_VERSION}"
fi
