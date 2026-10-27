#!/bin/bash
#
# Build and package the extension using the same ZIP layout as GitHub Actions.
#
# Usage:
#   ./tools/build-release.sh
#
# Output:
#   releases/sidebar-for-arc-users-{version}.zip

set -euo pipefail
# set -x

cd "$(dirname "$0")/.."

# Version changes are manual and must happen before this script is run.
VERSION=$(grep '"version"' public/manifest.json | sed 's/.*: "\([^"]*\)".*/\1/')

echo "Building version ${VERSION}..."

# Run npm build
npm run build

# Create releases directory if it doesn't exist
mkdir -p releases

# Define output filename
ZIPFILE="releases/sidebar-for-arc-users-${VERSION}.zip"

# Remove old zip if exists
rm -f "$ZIPFILE"

# Create zip from dist/ contents (not the folder itself)
cd dist
zip -r "../$ZIPFILE" .
cd ..

echo ""
echo "Build complete: $ZIPFILE"
echo "Ready to attach to GitHub Release v${VERSION}"
