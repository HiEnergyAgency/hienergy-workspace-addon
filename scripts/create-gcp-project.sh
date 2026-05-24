#!/usr/bin/env bash
# Open the Hi Energy AI Workspace Add-on GCP project dashboard and setup steps.
#
# Usage: ./scripts/create-gcp-project.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$REPO_ROOT/marketplace/gcp-project.json"

PROJECT_NAME="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).displayName")"
PROJECT_ID="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).projectId")"
DASHBOARD_URL="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).dashboardUrl")"

echo "GCP project: ${PROJECT_NAME}"
echo "Project ID:  ${PROJECT_ID}"
echo ""

open "$DASHBOARD_URL"

cat <<EOF

Project dashboard opened:
  ${DASHBOARD_URL}

Copy the **Project number** from the dashboard, then run:

  ./scripts/create-marketplace-app.sh ${PROJECT_ID}

Link that project number in Apps Script → Project Settings → GCP Project.

EOF
