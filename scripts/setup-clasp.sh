#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Hi Energy AI — clasp setup"
echo ""
echo "Prerequisite: enable the Apps Script API at"
echo "https://script.google.com/home/usersettings"
echo ""

if ! command -v clasp >/dev/null 2>&1; then
  echo "clasp is not installed. Run: npm install -g @google/clasp"
  exit 1
fi

if [[ -f .clasp.json ]]; then
  SCRIPT_ID="$(node -pe "try { JSON.parse(require('fs').readFileSync('.clasp.json','utf8')).scriptId || '' } catch (e) { '' }")"
  if [[ -z "$SCRIPT_ID" || "$SCRIPT_ID" == "YOUR_APPS_SCRIPT_PROJECT_ID" ]]; then
    echo "Removing invalid .clasp.json (missing or placeholder scriptId)."
    rm -f .clasp.json
  else
    echo "Using existing Apps Script project: $SCRIPT_ID"
  fi
fi

if [[ ! -f .clasp.json ]]; then
  echo "Creating standalone Apps Script project (add-on manifest lives in appsscript.json)..."
  clasp create --title "Hi Energy AI" --type standalone --rootDir .
fi

echo ""
echo "Pushing source to Apps Script..."
clasp push --force

echo ""
echo "Done. Next steps:"
echo "1. clasp open-script"
echo "2. Set AUTH0_* script properties in Project Settings"
echo "3. Deploy → Test deployments → Install"
