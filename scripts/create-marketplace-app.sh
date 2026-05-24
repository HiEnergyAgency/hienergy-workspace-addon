#!/usr/bin/env bash
# Create / configure the Hi Energy AI Marketplace app in Google Cloud.
# Opens pages in your default browser (signed in as patrick@hienergy.ai).
#
# Usage: ./scripts/create-marketplace-app.sh [gcp-project-id]

set -euo pipefail

SCRIPT_ID="1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4"
DEPLOYMENT_ID="AKfycbwbYxV5rGlnTn1BflnDpXcrDEfdqzmDtXSE0HlfQBmzyhGVbcsQm_MlHL3h6Y8gBAkc"
GCP_PROJECT="${1:-rocket-432821}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Creating Hi Energy AI Workspace Add-on Marketplace app"
echo "GCP project:  $GCP_PROJECT"
echo "Script ID:    $SCRIPT_ID"
echo "Deployment ID: $DEPLOYMENT_ID"
echo ""

open "https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=${GCP_PROJECT}"
sleep 1.5
open "https://console.cloud.google.com/flows/enableapi?apiid=appsmarket-component.googleapis.com&project=${GCP_PROJECT}"
sleep 1.5
open "https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/storelisting?project=${GCP_PROJECT}"
sleep 1.5
open "https://console.cloud.google.com/apis/credentials/consent?project=${GCP_PROJECT}"
sleep 1.5
open "https://script.google.com/home/projects/${SCRIPT_ID}/settings"
sleep 1
open "${REPO_ROOT}/marketplace/assets"

cat <<EOF

=== App Configuration (tab 1) ===
If prompted, click Enable on the Marketplace SDK tab first.

App visibility:        Private (Hi Energy org only) — or Public for everyone
Installation:          Individual + Admin Install
Integrations:          Google Workspace add-on
Deployment ID:         ${DEPLOYMENT_ID}
App name:              Hi Energy AI Workspace Add-on
Developer name:        Hi Energy AI
Developer email:       support@hienergy.ai
Developer website:     https://hienergy.ai
Application website:   https://app.hienergy.ai

OAuth scopes (paste all):
  https://www.googleapis.com/auth/gmail.addons.current.message.readonly
  https://www.googleapis.com/auth/gmail.addons.execute
  https://www.googleapis.com/auth/gmail.readonly
  https://www.googleapis.com/auth/contacts.readonly
  https://www.googleapis.com/auth/userinfo.email
  https://www.googleapis.com/auth/script.external_request

Click: Save Draft

=== Apps Script settings (tab 5) ===
Link GCP project number for: ${GCP_PROJECT}

=== Store Listing (tab 3) ===
Copy from: marketplace/listing-copy.md
Upload:    marketplace/assets/logo-*.png + screenshots

Privacy:   https://app.hienergy.ai/privacy_policy
Terms:     https://app.hienergy.ai/terms_of_service

Click: Submit For Review

EOF
