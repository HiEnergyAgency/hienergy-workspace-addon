# Hi Energy AI — Google Workspace Add-on

Official Google Workspace sidebar add-on for [Hi Energy AI](https://app.hienergy.ai). Search advertisers, deals, and transactions; browse MCP tools; and enrich Gmail with Google Contacts and message context — all without leaving Gmail, Drive, Docs, Sheets, Slides, or Calendar.

## How it works

The add-on runs as a **Google Apps Script** project using **CardService** (native sidebar cards, no custom HTML). It talks to two backends:

1. **Hi Energy AI MCP server** — affiliate data (advertisers, deals, transactions, reports, contacts)
2. **Google APIs** — the user's Gmail and Google Contacts

```
┌─────────────────────────────────────────────────────────────┐
│  Google Workspace (Gmail, Drive, Docs, Sheets, …)           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Hi Energy AI Workspace Add-on (CardService sidebar)        │
│                                                             │
│  Main.gs      → entry points, action handlers               │
│  Cards.gs     → sidebar UI                                  │
│  ApiClient.gs → Hi Energy AI data (via MCP)                 │
│  McpClient.gs → JSON-RPC client for POST /mcp               │
│  Auth0.gs     → Auth0 OAuth sign-in                         │
│  GmailClient.gs    → Gmail threads and search               │
│  ContactsClient.gs → Google People / Contacts lookup        │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │
            ▼                             ▼
  POST https://app.hienergy.ai/mcp   Google Gmail + People APIs
  (Auth0 Bearer or X-Api-Key)        (Google OAuth scopes)
```

### Authentication (two separate systems)

| System | Purpose | How |
|--------|---------|-----|
| **Auth0 OAuth** | Hi Energy AI / MCP access | User clicks **Sign in with Hi Energy AI**; add-on sends `Authorization: Bearer <token>` to the MCP server |
| **Google OAuth** | Gmail + Contacts | Granted at add-on install; scopes in `appsscript.json` |
| **API key (fallback)** | Hi Energy AI / MCP without Auth0 | Optional per-user `X-Api-Key` in Settings → Advanced |

Auth0 tokens must use audience `https://api.hienergyrocket.com/mcp` (same as the MCP OAuth resource).

### Hi Energy AI data via MCP

All Hi Energy AI requests go through the [MCP server](https://app.hienergy.ai/api_documentation/mcp) at `https://app.hienergy.ai/mcp`, not direct REST calls.

1. **Initialize** — `initialize` JSON-RPC call (cached per user for 30 minutes)
2. **Call tool** — named MCP tools for common actions
3. **Fallback** — `api_request` tool bridges to REST if a named tool fails

| Add-on action | MCP tool | REST fallback |
|---------------|----------|---------------|
| Search | `universal_search` | `GET /api/v1/search` |
| Domain lookup | `search_advertisers_by_domain` | `GET /api/v1/advertisers/search_by_domain` |
| Advertiser detail | `get_advertiser` | `GET /api/v1/advertisers/:id` |
| Deals | `search_deals` | `GET /api/v1/deals` |
| Transactions | `search_transactions` | `GET /api/v1/transactions` |
| Any other tool | — | `tools/call` → `api_request` |

Use the **MCP Tools** universal action to browse and run any tool from `tools/list` (reports, advertiser contacts, user search, etc.).

### Gmail context

When you open an email in Gmail, the add-on automatically:

1. Reads the open message (sender, subject, domain)
2. Looks up the sender in **Google Contacts** (People API)
3. Finds up to 3 recent Gmail messages from the same domain
4. Offers **Find advertiser** / **Search Hi Energy AI** for the sender's domain

Hi Energy AI sign-in is **not** required for Gmail and Contacts features. Auth0 is only needed for affiliate data actions.

### Search scopes

The search form supports six scopes:

| Scope | MCP tool | Types filter |
|-------|----------|--------------|
| Everything | `universal_search` | all types |
| Advertisers | `universal_search` | `advertisers` |
| Deals | `universal_search` | `deals` |
| Transactions | `universal_search` | `transactions` |
| Contacts | Google People API | Google OAuth only |
| Messages | Gmail search | Google OAuth only |

## Branding

User-facing branding is centralized in `Config.gs`:

| Constant | Value |
|----------|-------|
| `brandName` | Hi Energy AI Workspace Add-on |
| `brandTagline` | Search affiliate programs, advertisers, and deals |
| `brandLogoUrl` | Same as Chrome extension icon (128×128 PNG via Chrome Web Store CDN) |
| `privacyPolicyUrl` | `https://app.hienergy.ai/privacy_policy` |
| `termsOfServiceUrl` | `https://app.hienergy.ai/terms_of_service` |
| `brandPrimaryColor` | `#8b5cf6` |
| `brandSecondaryColor` | `#6d28d9` |

The add-on manifest (`appsscript.json`) uses the same name, logo, and colors for the Workspace marketplace listing and sidebar chrome.

## Features

- Search advertisers, deals, and transactions via MCP universal search
- Browse and run MCP tools (reports, contacts, user search, and more)
- Gmail contextual sidebar: sender info, contact match, recent domain messages
- Google Contacts lookup and search
- Gmail thread view and message search
- Advertiser detail, deals, and transactions drill-down
- Per-user Auth0 tokens via the [OAuth2 Apps Script library](https://github.com/googleworkspace/apps-script-oauth2)

## Project structure

| File | Role |
|------|------|
| `appsscript.json` | Manifest: branding, OAuth scopes, add-on triggers, People API |
| `Config.gs` | Brand constants, MCP URL, limits, Auth0 scope |
| `Main.gs` | Entry points and action handlers |
| `Cards.gs` | CardService UI (sidebar cards) |
| `McpClient.gs` | MCP JSON-RPC client (`initialize`, `tools/call`, `tools/list`) |
| `ApiClient.gs` | Hi Energy AI data layer (MCP tools + REST fallback) |
| `Auth0.gs` | Auth0 OAuth via Google OAuth2 library |
| `GmailClient.gs` | Gmail message and thread helpers |
| `ContactsClient.gs` | Google People / Contacts lookup |
| `Setup.gs` | One-time admin helper for script properties |

## Deployment

> **Quick start:** To run and test on your machine, see [Run locally](#run-locally). To contribute code, see [Submitting changes](#submitting-changes).

This add-on deploys as a **Google Apps Script** project with a **Workspace add-on** manifest. There is no separate server to host — Google runs the sidebar UI and your `.gs` code.

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| Google account | With access to [Apps Script](https://script.google.com) |
| Google Workspace | Add-on works in Gmail, Drive, Docs, Sheets, Slides, Calendar |
| [clasp](https://github.com/google/clasp) | `npm install -g @google/clasp` |
| Apps Script API | Enable at [script.google.com/home/usersettings](https://script.google.com/home/usersettings) |
| Auth0 tenant | Regular Web Application for Hi Energy AI sign-in |
| Hi Energy AI account | Users must exist in Hi Energy AI with matching email |

### 1. Clone and validate locally

```bash
git clone https://github.com/HiEnergyAgency/hienergy-workspace-addon.git
cd hienergy-workspace-addon
npm install
npm run validate
```

Fix any lint or spec failures before deploying.

### 2. Create or link the Apps Script project

**Enable the Apps Script API first:** [script.google.com/home/usersettings](https://script.google.com/home/usersettings) → turn on **Google Apps Script API**. If you just enabled it, wait 1–2 minutes before running clasp.

**New project (clasp 3.x):** Use `--type standalone`. The Workspace add-on manifest is in `appsscript.json` — there is no separate `workspace-add-on` project type in clasp 3.

```bash
clasp login
cp .clasp.json.example .clasp.json
clasp create --title "Hi Energy AI Workspace Add-on" --type standalone
```

Or: `npm run deploy:create`

This writes your `scriptId` into `.clasp.json` (gitignored — do not commit).

**Existing project:**

```bash
clasp login
cp .clasp.json.example .clasp.json
# Edit .clasp.json and set scriptId to your Apps Script project ID
```

Find the script ID in the Apps Script editor under **Project Settings** → **IDs**.

### 3. Push code to Apps Script

```bash
clasp push
```

This uploads all `.gs` files and `appsscript.json` to Google.

After the first push, open the project:

```bash
clasp open-script
```

Confirm in the editor:

- **Libraries** → **OAuth2** is linked (from `appsscript.json`)
- **Services** → **People API** is enabled
- All source files are present (`Main.gs`, `Cards.gs`, `McpClient.gs`, etc.)

### 4. Configure Auth0

In [Auth0 Dashboard](https://manage.auth0.com):

1. **Applications** → **Create Application** → **Regular Web Application**
2. Add the callback URL using your Apps Script project ID:
   ```
   https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback
   ```
3. Ensure the API audience matches Hi Energy AI's MCP resource:
   ```
   https://api.hienergyrocket.com/mcp
   ```
4. Note **Domain**, **Client ID**, and **Client Secret**

### 5. Set script properties

In Apps Script → **Project Settings** → **Script properties**, add:

| Property | Example | Required |
|----------|---------|----------|
| `AUTH0_DOMAIN` | `your-tenant.us.auth0.com` | Yes |
| `AUTH0_CLIENT_ID` | `abc123…` | Yes |
| `AUTH0_CLIENT_SECRET` | `secret…` | Yes |
| `AUTH0_AUDIENCE` | `https://api.hienergyrocket.com/mcp` | Yes |
| `HIENERGY_MCP_URL` | `https://app.hienergy.ai/mcp` | Optional |
| `HIENERGY_API_BASE` | `https://app.hienergy.ai/api/v1` | Optional |

Or run `configureAuth0ScriptProperties()` from `Setup.gs` in the Apps Script editor (edit placeholder values first).

End users never see these values.

### 6. Test deployment (internal)

Use a test deployment before sharing widely:

1. In Apps Script → **Deploy** → **Test deployments**
2. Click **Install** and pick a configuration
3. Open Gmail (or Drive/Docs) and install the test add-on for your account
4. Verify:
   - Sidebar shows **Hi Energy AI Workspace Add-on** branding
   - **Sign in with Hi Energy AI** completes Auth0 login
   - Search returns results via MCP `universal_search`
   - Opening an email shows Gmail context and contact lookup
   - **MCP Tools** lists available tools

Share the test deployment link with teammates for internal QA. Test deployments are limited to users in the same Google Cloud project / domain policy allows.

### 7. Production deployment

For a stable, versioned deployment inside your organization:

1. In Apps Script → **Deploy** → **New deployment**
2. Click the gear icon → select type **Add-on**
3. Fill in description (e.g. `Hi Energy AI v1.0.0`)
4. Click **Deploy** and copy the deployment ID

To update production later:

```bash
npm run validate
clasp push
clasp deploy --description "Hi Energy AI v1.0.1"
```

Or create a new deployment version in the Apps Script UI under **Deploy** → **Manage deployments** → **Edit** → **Version** → **New version**.

### 8. Google Workspace Marketplace (optional)

Publishing assets and copy live in [`marketplace/`](./marketplace/). Start with [`marketplace/checklist.md`](./marketplace/checklist.md).

| Deliverable | Location |
|-------------|----------|
| Logos (120×120, 128×128 PNG) | `marketplace/assets/logo-*.png` |
| Screenshots (1280×800) | `marketplace/assets/marketplace-screenshot-*.png` |
| Listing copy | `marketplace/listing-copy.md` |
| OAuth scope justifications | `marketplace/oauth-verification.md` |
| Demo video script | `marketplace/demo-video-script.md` |
| Privacy policy + ToS | https://app.hienergy.ai/privacy_policy and `/terms_of_service` |
| Host-ready HTML | `marketplace/hosted/*.html` |
| SDK field template | `marketplace/listing-config.json` |

**Steps (summary):**

1. Complete a production deployment (step 7)
2. Link GCP project **`hi-energy-workspace-app`** to Apps Script ([dashboard](https://console.cloud.google.com/home/dashboard?project=hi-energy-workspace-app) → copy project number)
3. Run `npm run create:app` to open Marketplace SDK + OAuth setup for that project

Screenshot mockups are included for draft listings; replace with real Gmail captures before final public review when possible.

Marketplace review can take several weeks. Internal/test deployments do not require marketplace listing.

### 9. Post-deploy checklist

| Step | Verify |
|------|--------|
| Auth0 callback | `usercallback` URL matches script ID exactly |
| Branding | Sidebar title is **Hi Energy AI Workspace Add-on** with purple theme |
| MCP | Settings shows `https://app.hienergy.ai/mcp` |
| Universal search | Search scope "Everything" returns advertisers/deals |
| Gmail context | Opening an email shows sender + domain actions |
| Re-authorization | After scope changes, users re-approve Google permissions |

### Updating an existing deployment

```bash
git pull
npm run validate
clasp push
```

Then in Apps Script:

- **Test deployments** — pick up changes automatically on next open
- **Production** — create a new deployment version or run `clasp deploy`

If you change OAuth scopes in `appsscript.json`, users must re-install or re-authorize the add-on.

## One-time admin setup

The steps above cover full deployment. This section summarizes the Auth0 and Google configuration details.

### 1. Auth0 application

In [Auth0 Dashboard](https://manage.auth0.com):

1. **Applications** → **Create Application** → **Regular Web Application**
2. **Allowed Callback URLs** (after you have the Apps Script project ID):
   ```
   https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback
   ```
3. Note **Domain**, **Client ID**, and **Client Secret**

### 2. Auth0 API audience

Ensure the API identifier matches Hi Energy AI's MCP OAuth resource:

```
https://api.hienergyrocket.com/mcp
```

The add-on requests Auth0 scopes: `openid profile email`.

### 3. Apps Script script properties

In the Apps Script project → **Project Settings** → **Script properties**:

| Property | Example | Required |
|----------|---------|----------|
| `AUTH0_DOMAIN` | `your-tenant.us.auth0.com` | Yes |
| `AUTH0_CLIENT_ID` | `abc123…` | Yes |
| `AUTH0_CLIENT_SECRET` | `secret…` | Yes |
| `AUTH0_AUDIENCE` | `https://api.hienergyrocket.com/mcp` | Yes |
| `HIENERGY_MCP_URL` | `https://app.hienergy.ai/mcp` | Optional override |
| `HIENERGY_API_BASE` | `https://app.hienergy.ai/api/v1` | Optional (REST fallback only) |

End users never see these values.

### 4. Enable advanced services

After `clasp push`, confirm in the Apps Script editor:

- **Libraries** → **OAuth2** (referenced in `appsscript.json`)
- **Services** → **People API** (enabled in `appsscript.json`)

### 5. Google OAuth scopes

The manifest requests these Google scopes (users re-authorize after scope changes):

| Scope | Purpose |
|-------|---------|
| `gmail.addons.current.message.readonly` | Read the open Gmail message |
| `gmail.addons.execute` | Run Gmail add-on triggers |
| `gmail.readonly` | Search and read Gmail threads |
| `contacts.readonly` | Search Google Contacts |
| `script.external_request` | Call Hi Energy AI MCP server |
| `script.locale` | Host app locale (`useLocaleFromApp` in manifest) |
| `userinfo.email` | User identity |

`gmail.readonly` is a sensitive scope — Google Workspace Marketplace publication may require additional verification.

## User flow

1. Install the add-on (test or marketplace deployment)
2. Open the add-on in Gmail or any supported Workspace app
3. **Gmail**: opening an email shows sender context, contacts, and recent messages automatically
4. **Hi Energy AI data**: click **Sign in with Hi Energy AI** → complete Auth0 login
5. Search, browse MCP tools, or drill into advertisers, deals, and transactions

## Run locally

The add-on code runs in Google's cloud — there is no local Gmail sidebar. **Local development** means validating logic on your machine, then pushing to Apps Script and testing in Gmail with a **test deployment**.

### Prerequisites

| Tool | Install |
|------|---------|
| Node.js 22+ | [nodejs.org](https://nodejs.org/) |
| clasp | `npm install -g @google/clasp` |
| Apps Script API | [script.google.com/home/usersettings](https://script.google.com/home/usersettings) → enable |

You also need access to the shared Apps Script project (or your own fork + script ID) and Auth0 script properties set in that project (see [One-time admin setup](#one-time-admin-setup)).

### One-time local setup

```bash
git clone https://github.com/HiEnergyAgency/hienergy-workspace-addon.git
cd hienergy-workspace-addon
npm install
clasp login
```

Link clasp to the Hi Energy Apps Script project (use the repo's committed ID — do **not** commit your own `.clasp.json`):

```bash
cp .github/clasp.json .clasp.json
# scriptId is already set: 1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4
```

For a **personal sandbox** instead, copy `.clasp.json.example`, run `npm run deploy:create`, and use your own script ID.

### Daily development loop

```bash
# 1. Edit .gs files, then validate before pushing
npm run validate

# 2. Push to Apps Script (updates HEAD; test deployments pick this up)
npm run deploy:push
# or: clasp push

# 3. Open the editor and confirm libraries/services
npm run deploy:open

# 4. Test in Gmail — use Apps Script → Deploy → Test deployments → Install
```

| Command | What it does |
|---------|----------------|
| `npm run lint` | ESLint on `.gs`, tests, and scripts |
| `npm run test` | Vitest specs (37 tests) in a mocked Apps Script runtime |
| `npm run check:manifest` | Verify `appsscript.json` wiring |
| `npm run validate` | lint + test + manifest (run before every push/PR) |
| `npm run deploy:push` | `clasp push` only |
| `npm run deploy:open` | Open Apps Script editor in browser |

**What you can test locally:** config, MCP client, API client, manifest, card handler logic (Vitest).

**What requires Gmail:** sidebar UI, Auth0 sign-in flow, live MCP calls, Contacts/Gmail integration — use a **test deployment** after `clasp push`.

### Marketplace tooling (local only)

Google has no API to publish Marketplace listings from CI. Use these locally when preparing or updating a listing:

```bash
npm run marketplace:phase4:status   # API/status report
npm run marketplace:phase4          # enable APIs + open console tabs + paste values
npm run marketplace:submit          # browser automation (sign in to Google Cloud when prompted)
npm run check:marketplace           # validate listing assets (full image checks on macOS)
```

See [`marketplace/checklist.md`](./marketplace/checklist.md) for the full publishing checklist.

### Spec coverage

| Spec file | Covers |
|-----------|--------|
| `test/config.spec.js` | Branding and MCP defaults |
| `test/api-client.spec.js` | `universal_search`, auth gates, REST fallback |
| `test/mcp-client.spec.js` | MCP JSON-RPC client behavior |
| `test/gmail-client.spec.js` | Gmail context and domain search |
| `test/contacts-client.spec.js` | People API contact lookup |
| `test/main.spec.js` | MCP tool argument mapping |
| `test/manifest.spec.js` | `appsscript.json` scopes and triggers |

## Submitting changes

Use pull requests for all code changes. **PRs run validation only**; **merging to `main` deploys** to production Apps Script automatically.

### 1. Branch from `main`

```bash
git checkout main
git pull origin main
git checkout -b your-name/short-description
```

### 2. Develop and validate

Edit `.gs` files, tests, or manifest as needed.

```bash
npm run validate
```

If you change Marketplace assets or copy:

```bash
npm run check:marketplace
```

Fix any lint, test, or manifest failures before opening a PR.

### 3. Push and open a pull request

```bash
git add -A
git commit -m "Describe why this change is needed."
git push -u origin your-name/short-description
gh pr create --title "Your PR title" --body "$(cat <<'EOF'
## Summary
- What changed and why

## Test plan
- [ ] `npm run validate` passes locally
- [ ] Tested in Gmail via test deployment (if UI/behavior changed)
- [ ] Manifest/scopes unchanged OR noted re-authorization impact
EOF
)"
```

Or open the PR from the GitHub UI after pushing.

### 4. CI on the pull request

GitHub Actions (`.github/workflows/ci.yml`) runs on every PR to `main`:

| Job | PR | Merge to `main` |
|-----|----|-----------------|
| **validate** — lint, 37 specs, manifest, marketplace files | ✅ | ✅ |
| **deploy** — `clasp push` + update production deployment | ❌ | ✅ |

Check the **Actions** tab on your PR — all validate steps must pass before merge.

### 5. Merge to `main`

After review and green CI:

1. **Squash merge** (or merge commit) into `main`
2. CI deploy job runs automatically:
   - `clasp push --force`
   - Updates production deployment `AKfycbwbYxV5…`
   - Verifies deployment ID (`scripts/verify-deployment.mjs`)
3. View the deploy summary in the Actions run for commit SHA and Apps Script link

**No separate release step** — merged code is live for the Marketplace-linked production deployment once deploy succeeds.

### 6. After merge (when relevant)

| Change type | Follow-up |
|-------------|-----------|
| OAuth scopes in `appsscript.json` | Users re-authorize; update OAuth consent + Marketplace SDK scopes; may need Google verification |
| Marketplace listing text/assets | Update console listing manually; run `npm run marketplace:submit` or `npm run marketplace:phase4` |
| Auth0 config | Update Auth0 callback / script properties in Apps Script (not in Git) |
| Bug fix / feature only | Test deployment optional; production updates via CI |

### Manual production redeploy

To redeploy current `main` without a new commit: **Actions → CI → Run workflow** → enable **Skip validate and deploy current main**.

## CI setup and Marketplace

The [Submitting changes](#submitting-changes) section describes the PR → merge → deploy flow. This section covers one-time GitHub secrets and first-time Marketplace approval.

### GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `CLASPRC_JSON` | Full contents of `~/.clasprc.json` after `clasp login` |
| `APPS_SCRIPT_DEPLOYMENT_ID` | Production add-on deployment ID |

Repository variables (reference only — optional):

| Variable | Value |
|----------|--------|
| `APPS_SCRIPT_ID` | `1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4` |
| `GCP_PROJECT_ID` | `hi-energy-workspace-app` |

Set or refresh everything via GitHub CLI:

```bash
npm run setup:github-secrets
```

Or manually:

```bash
gh secret set CLASPRC_JSON < ~/.clasprc.json --repo HiEnergyAgency/hienergy-workspace-addon
gh secret set APPS_SCRIPT_DEPLOYMENT_ID --body 'AKfycbwbYxV5rGlnTn1BflnDpXcrDEfdqzmDtXSE0HlfQBmzyhGVbcsQm_MlHL3h6Y8gBAkc' --repo HiEnergyAgency/hienergy-workspace-addon
gh variable set APPS_SCRIPT_ID --body '1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4' --repo HiEnergyAgency/hienergy-workspace-addon
gh variable set GCP_PROJECT_ID --body 'hi-energy-workspace-app' --repo HiEnergyAgency/hienergy-workspace-addon
```

Refresh `CLASPRC_JSON` if deploy fails with an auth error (re-run `clasp login`, then `npm run setup:github-secrets`).

### First-time Marketplace approval

After the listing is approved, **merges to `main` update live add-on code** via the linked production deployment — no listing resubmit per code change.

```bash
npm run marketplace:open              # open console tabs + follow marketplace/SUBMIT.md
npm run marketplace:submit          # browser: App Configuration + Store Listing
npm run marketplace:phase4            # CLI status + open console tabs
```

Or **Actions → Marketplace submit** for the checklist output.

**Not in GitHub:** Auth0 credentials (`AUTH0_*`) live in Apps Script **Project Settings → Script properties** only. Set once in the Apps Script editor:

```javascript
configureAuth0ScriptProperties();
```

## MCP quick reference

MCP docs: https://app.hienergy.ai/api_documentation/mcp

```bash
# Initialize session
curl -X POST https://app.hienergy.ai/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH0_TOKEN" \
  -H "MCP-Protocol-Version: 2025-11-25" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","clientInfo":{"name":"Hi Energy AI Workspace Add-on","version":"1.0.0"}}}'

# Universal search
curl -X POST https://app.hienergy.ai/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH0_TOKEN" \
  -H "MCP-Protocol-Version: 2025-11-25" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"universal_search","arguments":{"q":"nike","per_type_limit":5}}}'
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Auth0 not configured" | Set all four `AUTH0_*` script properties |
| Callback URL mismatch | Add exact `usercallback` URL to Auth0 allowed callbacks |
| 401 from Hi Energy AI / MCP | Check `AUTH0_AUDIENCE` matches MCP config; user must exist in Hi Energy AI with matching email |
| Invalid audience | Token `aud` must include `https://api.hienergyrocket.com/mcp` |
| Contacts not found | User needs Google Contacts; scope `contacts.readonly` must be granted |
| Gmail search empty | Scope `gmail.readonly` must be granted; user may need to re-authorize |
| MCP tool errors | Check Settings for MCP URL; try **Browse MCP tools** to verify `tools/list` works |
| People API errors | Enable People API advanced service in Apps Script editor |
| Wrong add-on name in sidebar | Redeploy after `clasp push`; manifest name must be **Hi Energy AI Workspace Add-on** |
| `Invalid container file type` | Use `--type standalone`, not `workspace-add-on` (removed in clasp 3.x) |
| `User has not enabled the Apps Script API` | Enable at [script.google.com/home/usersettings](https://script.google.com/home/usersettings), wait 1–2 min, retry |
| `Project settings not found` | Run `clasp create` first so `.clasp.json` gets a `scriptId` |

## Security

- Auth0 **client secret** lives in Script Properties (deployment-wide, admin-only)
- Auth0 access tokens stored per-user via OAuth2 library
- Optional API keys stored per-user in UserProperties
- Google Gmail and Contacts data never leaves Google's APIs — only accessed for the signed-in user
- MCP server enforces the same Pundit-scoped permissions as the REST API

## License

Private / Hi Energy AI internal — adjust as needed.
