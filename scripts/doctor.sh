#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Node: $(node --version)"
echo "npm: $(npm --version)"

npm run typecheck
npm run lint
npm test
npm run format:check

echo "Doctor completed."
