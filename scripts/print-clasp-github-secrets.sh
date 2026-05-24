#!/usr/bin/env bash
# Print GitHub Actions secrets needed for deploy-on-merge to main.
# Run locally after: clasp login
#
# Usage: ./scripts/print-clasp-github-secrets.sh

set -euo pipefail

CLASPRC="${HOME}/.clasprc.json"
DEPLOYMENT_ID="${APPS_SCRIPT_DEPLOYMENT_ID:-AKfycbwbYxV5rGlnTn1BflnDpXcrDEfdqzmDtXSE0HlfQBmzyhGVbcsQm_MlHL3h6Y8gBAkc}"

if [ ! -f "$CLASPRC" ]; then
  echo "Run 'clasp login' first, then retry." >&2
  exit 1
fi

echo "Add these GitHub repository secrets (Settings → Secrets → Actions):"
echo ""
echo "CLASPRC_JSON"
echo "  (paste entire contents of ~/.clasprc.json — keep this private)"
echo ""
echo "APPS_SCRIPT_DEPLOYMENT_ID"
echo "  ${DEPLOYMENT_ID}"
echo ""
echo "Optional: set APPS_SCRIPT_DEPLOYMENT_ID env when running this script to override."
echo ""
echo "To set via gh CLI:"
echo "  gh secret set CLASPRC_JSON < ~/.clasprc.json"
echo "  gh secret set APPS_SCRIPT_DEPLOYMENT_ID --body '${DEPLOYMENT_ID}'"
