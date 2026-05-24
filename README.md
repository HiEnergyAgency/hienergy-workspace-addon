# Hi Energy Rocket — Google Workspace Add-on

Universal Google Workspace sidebar add-on for [Hi Energy Rocket](https://app.hienergy.ai). Search advertisers, deals, and transactions; browse MCP tools; and enrich Gmail with Google Contacts and message context — all without leaving Gmail, Drive, Docs, Sheets, Slides, or Calendar.

## How it works

The add-on runs as a **Google Apps Script** project using **CardService** (native sidebar cards, no custom HTML). It talks to two backends:

1. **Hi Energy MCP server** — affiliate data (advertisers, deals, transactions, reports, contacts)
2. **Google APIs** — the user's Gmail and Google Contacts

```
┌─────────────────────────────────────────────────────────────┐
│  Google Workspace (Gmail, Drive, Docs, Sheets, …)           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Apps Script add-on (CardService sidebar)                   │
│                                                             │
│  Main.gs      → entry points, action handlers               │
│  Cards.gs     → sidebar UI                                  │
│  ApiClient.gs → Hi Energy data (via MCP)                    │
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
| **Auth0 OAuth** | Hi Energy / MCP access | User clicks **Sign in with Hi Energy**; add-on sends `Authorization: Bearer <token>` to the MCP server |
| **Google OAuth** | Gmail + Contacts | Granted at add-on install; scopes in `appsscript.json` |
| **API key (fallback)** | Hi Energy / MCP without Auth0 | Optional per-user `X-Api-Key` in Settings → Advanced |

Auth0 tokens must use audience `https://api.hienergyrocket.com/mcp` (same as the MCP OAuth resource).

### Hi Energy data via MCP

All Hi Energy requests go through the [MCP server](https://app.hienergy.ai/api_documentation/mcp) at `https://app.hienergy.ai/mcp`, not direct REST calls.

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
4. Offers **Find advertiser** / **Search Hi Energy** for the sender's domain

Hi Energy sign-in is **not** required for Gmail and Contacts features. Auth0 is only needed for affiliate data actions.

### Search scopes

The search form supports six scopes:

| Scope | Backend | Auth required |
|-------|---------|---------------|
| Everything | MCP `universal_search` | Auth0 or API key |
| Advertisers | MCP `universal_search` (advertisers only) | Auth0 or API key |
| Deals | MCP `search_deals` | Auth0 or API key |
| Transactions | MCP `search_transactions` | Auth0 or API key |
| Contacts | Google People API | Google OAuth only |
| Messages | Gmail search | Google OAuth only |

## Features

- Search advertisers, deals, and transactions via MCP
- Browse and run MCP tools (reports, contacts, user search, and more)
- Gmail contextual sidebar: sender info, contact match, recent domain messages
- Google Contacts lookup and search
- Gmail thread view and message search
- Advertiser detail, deals, and transactions drill-down
- Per-user Auth0 tokens via the [OAuth2 Apps Script library](https://github.com/googleworkspace/apps-script-oauth2)

## Project structure

| File | Role |
|------|------|
| `appsscript.json` | Manifest: OAuth scopes, add-on triggers, People API |
| `Main.gs` | Entry points and action handlers |
| `Cards.gs` | CardService UI (sidebar cards) |
| `McpClient.gs` | MCP JSON-RPC client (`initialize`, `tools/call`, `tools/list`) |
| `ApiClient.gs` | Hi Energy data layer (MCP tools + REST fallback) |
| `Auth0.gs` | Auth0 OAuth via Google OAuth2 library |
| `GmailClient.gs` | Gmail message and thread helpers |
| `ContactsClient.gs` | Google People / Contacts lookup |
| `Config.gs` | Constants (MCP URL, limits, Auth0 scope) |
| `Setup.gs` | One-time admin helper for script properties |

## One-time admin setup

### 1. Auth0 application

In [Auth0 Dashboard](https://manage.auth0.com):

1. **Applications** → **Create Application** → **Regular Web Application**
2. **Allowed Callback URLs** (after you have the Apps Script project ID):
   ```
   https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback
   ```
3. Note **Domain**, **Client ID**, and **Client Secret**

### 2. Auth0 API audience

Ensure the API identifier matches Hi Energy's MCP OAuth resource:

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
| `script.external_request` | Call Hi Energy MCP server |
| `userinfo.email` | User identity |

`gmail.readonly` is a sensitive scope — Google Workspace Marketplace publication may require additional verification.

## User flow

1. Install the add-on (test or marketplace deployment)
2. Open the add-on in Gmail or any supported Workspace app
3. **Gmail**: opening an email shows sender context, contacts, and recent messages automatically
4. **Hi Energy data**: click **Sign in with Hi Energy** → complete Auth0 login
5. Search, browse MCP tools, or drill into advertisers, deals, and transactions

## Local development with clasp

```bash
npm install -g @google/clasp
clasp login

cd hienergy-workspace-addon
cp .clasp.json.example .clasp.json
clasp create --title "Hi Energy Rocket" --type workspace-add-on
clasp push
```

Set script properties in the Apps Script UI, then **Deploy** → **Test deployments**.

Or run the setup helper from the Apps Script editor (edit placeholder values first):

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
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","clientInfo":{"name":"test","version":"1.0.0"}}}'

# Search advertisers
curl -X POST https://app.hienergy.ai/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH0_TOKEN" \
  -H "MCP-Protocol-Version: 2025-11-25" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_advertisers","arguments":{"name":"nike","limit":5}}}'
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Auth0 not configured" | Set all four `AUTH0_*` script properties |
| Callback URL mismatch | Add exact `usercallback` URL to Auth0 allowed callbacks |
| 401 from Hi Energy / MCP | Check `AUTH0_AUDIENCE` matches MCP config; user must exist in Hi Energy with matching email |
| Invalid audience | Token `aud` must include `https://api.hienergyrocket.com/mcp` |
| Contacts not found | User needs Google Contacts; scope `contacts.readonly` must be granted |
| Gmail search empty | Scope `gmail.readonly` must be granted; user may need to re-authorize |
| MCP tool errors | Check Settings for MCP URL; try **Browse MCP tools** to verify `tools/list` works |
| People API errors | Enable People API advanced service in Apps Script editor |

## Security

- Auth0 **client secret** lives in Script Properties (deployment-wide, admin-only)
- Auth0 access tokens stored per-user via OAuth2 library
- Optional API keys stored per-user in UserProperties
- Google Gmail and Contacts data never leaves Google's APIs — only accessed for the signed-in user
- MCP server enforces the same Pundit-scoped permissions as the REST API

## License

Private / Hi Energy internal — adjust as needed.
