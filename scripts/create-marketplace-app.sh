#!/usr/bin/env bash
# Create / configure the Hi Energy AI Marketplace app in Google Cloud.
# Opens pages in your default browser (signed in as patrick@hienergy.ai).
#
# Usage: ./scripts/create-marketplace-app.sh [gcp-project-id]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$REPO_ROOT/marketplace/gcp-project.json"

SCRIPT_ID="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).appsScriptProjectId")"
DEPLOYMENT_ID="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).appsScriptDeploymentId")"
DEFAULT_PROJECT="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).projectId")"
APP_NAME="$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).displayName")"

GCP_PROJECT="${1:-$DEFAULT_PROJECT}"

echo "Creating ${APP_NAME} Marketplace app"
echo "GCP project:   ${GCP_PROJECT}"
echo "Script ID:     ${SCRIPT_ID}"
echo "Deployment ID: ${DEPLOYMENT_ID}"
echo ""

# Enable SDK first, then config (store listing appears after SDK + app config exist)
open "https://console.cloud.google.com/flows/enableapi?apiid=appsmarket-component.googleapis.com&project=${GCP_PROJECT}"
sleep 1.5
open "https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=${GCP_PROJECT}"
sleep 1.5
open "https://console.cloud.google.com/marketplace/products/list?project=${GCP_PROJECT}"
sleep 1.5
open "https://console.cloud.google.com/apis/credentials/consent?project=${GCP_PROJECT}"
sleep 1.5
open "https://console.cloud.google.com/home/dashboard?project=${GCP_PROJECT}"
sleep 1
open "https://script.google.com/home/projects/${SCRIPT_ID}/settings"
sleep 1
open "${REPO_ROOT}/marketplace/assets"

cat <<EOF

=== Order of operations ===

1. Enable Marketplace SDK (first tab) — click Enable
2. App Configuration (second tab) — Save Draft with values below
3. Marketplace products (third tab) — create listing if prompted
4. OAuth consent (fourth tab)
5. Dashboard (fifth tab) — copy **Project number** for Apps Script link
6. Apps Script settings (sixth tab) — link GCP project number

=== App Configuration ===

App visibility:        Private (Hi Energy org only) — or Public
Installation:          Individual + Admin Install
Integrations:          Google Workspace add-on
Deployment ID:         ${DEPLOYMENT_ID}
App name:              ${APP_NAME}
Developer name:        Hi Energy AI
Developer email:       support@hienergy.ai
Developer website:     https://hienergy.ai
Application website:   https://app.hienergy.ai

OAuth scopes (paste all):
  https://www.googleapis.com/auth/gmail.addons.current.message.readonly
  https://www.googleapis.com/auth/gmail.addons.execute
  https://www.googleapis.com/auth/gmail.readonly
  https://www.googleapis.com/auth/gmail.compose
  https://www.googleapis.com/auth/contacts.readonly
  https://www.googleapis.com/auth/spreadsheets
  https://www.googleapis.com/auth/userinfo.email
  https://www.googleapis.com/auth/script.locale
  https://www.googleapis.com/auth/script.external_request

=== Store Listing ===

Copy from: marketplace/listing-copy.md
Upload:    marketplace/assets/logo-*.png + screenshots
Privacy:   https://app.hienergy.ai/privacy_policy
Terms:     https://app.hienergy.ai/terms_of_service

EOF
