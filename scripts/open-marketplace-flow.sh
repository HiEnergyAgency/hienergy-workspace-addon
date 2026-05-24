#!/usr/bin/env bash
# Opens Google Cloud / Apps Script pages for Hi Energy AI Marketplace submission.
# Run: ./scripts/open-marketplace-flow.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$REPO_ROOT/marketplace/gcp-project.json"
ASSETS="$REPO_ROOT/marketplace/assets"

SCRIPT_ID="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).appsScriptProjectId")"
DEPLOYMENT_ID="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).appsScriptDeploymentId")"
GCP_PROJECT="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).projectId")"

echo "Hi Energy AI Workspace Add-on — Marketplace helper"
echo "GCP project: $GCP_PROJECT"
echo "Script ID:   $SCRIPT_ID"
echo "Deployment:  $DEPLOYMENT_ID"
echo ""

open "https://console.cloud.google.com/home/dashboard?project=${GCP_PROJECT}"
sleep 1
open "https://script.google.com/d/${SCRIPT_ID}/edit"
sleep 1
open "https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=${GCP_PROJECT}"
sleep 1
open "https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk_publish?project=${GCP_PROJECT}"
sleep 1
open "https://console.cloud.google.com/apis/credentials/consent?project=${GCP_PROJECT}"
sleep 1
open "$ASSETS"

cat <<EOF

--- Do these in order ---

1) GCP dashboard → copy **Project number** for ${GCP_PROJECT}
2) Apps Script → Project Settings → link that GCP project number
3) Enable Marketplace SDK (tab opened) if not already enabled
4) App Configuration → deployment ID: ${DEPLOYMENT_ID}
5) OAuth consent → app name: Hi Energy AI Workspace Add-on
6) Store listing → copy from marketplace/listing-copy.md

Step-by-step submit guide: marketplace/SUBMIT.md
Full checklist: marketplace/checklist.md

EOF
