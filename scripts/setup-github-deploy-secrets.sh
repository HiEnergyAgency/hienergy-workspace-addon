#!/usr/bin/env bash
# Set or refresh GitHub Actions secrets/variables for deploy-on-merge.
# Requires: clasp login, gh auth login
#
# Usage: ./scripts/setup-github-deploy-secrets.sh

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-HiEnergyAgency/hienergy-workspace-addon}"
CLASPRC="${HOME}/.clasprc.json"
CONFIG="$(cd "$(dirname "$0")/.." && pwd)/marketplace/gcp-project.json"

if [ ! -f "$CLASPRC" ]; then
  echo "Run 'clasp login' first, then retry." >&2
  exit 1
fi

DEPLOYMENT_ID="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).appsScriptDeploymentId")"
SCRIPT_ID="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).appsScriptProjectId")"
GCP_PROJECT="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).projectId")"

echo "Setting deploy secrets and variables on ${REPO}..."

gh secret set CLASPRC_JSON --repo "$REPO" < "$CLASPRC"
gh secret set APPS_SCRIPT_DEPLOYMENT_ID --repo "$REPO" --body "$DEPLOYMENT_ID"
gh variable set APPS_SCRIPT_ID --repo "$REPO" --body "$SCRIPT_ID"
gh variable set GCP_PROJECT_ID --repo "$REPO" --body "$GCP_PROJECT"

echo ""
echo "Secrets (used by .github/workflows/ci.yml deploy job):"
gh secret list --repo "$REPO"
echo ""
echo "Variables (reference only — not required by CI today):"
gh variable list --repo "$REPO"
echo ""
echo "Auth0 credentials are NOT GitHub secrets — set once in Apps Script"
echo "Project Settings → Script properties (AUTH0_DOMAIN, AUTH0_CLIENT_ID, etc.)."
