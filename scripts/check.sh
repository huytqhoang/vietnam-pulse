#!/usr/bin/env bash
# Pre-deployment baseline check.
# Run: bash scripts/check.sh
# Exits non-zero if any tests fail — blocks deployment.

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=============================="
echo "  Vietnam Pulse — CI Gate"
echo "=============================="

echo ""
echo "--- Unit tests (offline, no network) ---"
pytest -m "not live" --timeout=15 -q

echo ""
echo "--- Live tests (network required) ---"
pytest -m "live" --timeout=90 -q

echo ""
echo "=============================="
echo "  All checks passed."
echo "=============================="
