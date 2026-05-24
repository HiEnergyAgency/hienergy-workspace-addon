#!/usr/bin/env bash
# Opens Google Cloud / Apps Script pages for Hi Energy AI Marketplace submission.
# Run: ./scripts/open-marketplace-flow.sh

set -euo pipefail

SCRIPT_ID="1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4"
DEPLOYMENT_ID="AKfycbwbYxV5rGlnTn1BflnDpXcrDEfdqzmDtXSE0HlfQBmzyhGVbcsQm_MlHL3h6Y8gBAkc"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$REPO_ROOT/marketplace/assets"

echo "Hi Energy AI — Marketplace submission helper"
echo "Script ID: $SCRIPT_ID"
echo "Deployment:  $DEPLOYMENT_ID"
echo ""
echo "Opening pages in your default browser (use patrick@hienergy.ai)..."
echo ""

open "https://script.google.com/home/projects/${SCRIPT_ID}/settings"
sleep 1
open "https://script.google.com/home/projects/${SCRIPT_ID}/deployments"
sleep 1
open "https://console.cloud.google.com/apis/credentials/consent"
sleep 1
open "https://console.cloud.google.com/marketplace/products/producer"
sleep 1

echo "Assets folder:"
open "$ASSETS"

cat <<EOF

--- Do these in order ---

1) Apps Script → Project Settings
   • Link a standard GCP project (not default)
   • Confirm script properties: AUTH0_*

2) Apps Script → Deploy → Manage deployments
   • Edit deployment "$DEPLOYMENT_ID"
   • Ensure type is **Add-on** (create new Add-on deployment if needed)
   • Version: latest (@2)

3) GCP → OAuth consent screen (same linked project)
   • App name: Hi Energy AI Workspace Add-on
   • Logo: marketplace/assets/logo-120.png
   • Privacy: https://app.hienergy.ai/privacy_policy
   • Terms:   https://app.hienergy.ai/terms_of_service
   • Scopes: all from appsscript.json (incl. gmail.readonly, contacts.readonly)
   • Submit for verification (public) OR set Internal (org only)

4) GCP → Marketplace SDK → Create listing → Google Workspace add-on
   • Apps Script ID: $SCRIPT_ID
   • Copy from marketplace/listing-copy.md
   • Upload logos + screenshots from marketplace/assets/
   • Submit for review

Full checklist: marketplace/checklist.md

EOF
