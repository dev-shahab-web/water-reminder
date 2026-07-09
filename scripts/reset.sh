#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

rm -rf node_modules .expo dist coverage
rm -f .tsbuildinfo
npm install

echo "Reset completed."
