# Hi Energy Rocket — Google Workspace Add-on

Universal Google Workspace sidebar add-on that calls the [Hi Energy Rocket API](https://app.hienergy.ai/api_documentation) from Gmail, Drive, Docs, Sheets, Slides, and Calendar.

## Features

- **Search** advertisers, deals, and transactions via `GET /api/v1/search`
- **Gmail context** — when reading a message, look up the sender’s domain as an advertiser
- **Advertiser detail** — commission, network, status, links back to Hi Energy
- **Per-user API key** — stored in Apps Script `UserProperties`, sent as `X-Api-Key`

## Architecture

```
Google Workspace (Gmail / Drive / …)
        │
        ▼
Apps Script add-on (CardService UI)
        │
        │  UrlFetchApp + X-Api-Key
        ▼
https://app.hienergy.ai/api/v1/*
```

Authentication uses your **Hi Energy API key** (same as MCP, OpenClaw, and curl). Google OAuth is only used for Workspace host permissions (external HTTP, Gmail message read). Hi Energy does **not** accept Google ID tokens on `/api/v1`; paste an API key from [API key docs](https://app.hienergy.ai/api_documentation/api_key).

## Prerequisites

1. Google account with access to [Google Apps Script](https://script.google.com)
2. Hi Energy API key with access to the data you need
3. [clasp](https://github.com/google/clasp) (optional, for local edit + push)

## Quick start (Apps Script UI)

1. Go to [script.google.com](https://script.google.com) → **New project**
2. Copy the `.gs` files and `appsscript.json` from this repo into the project
3. **Project Settings** → enable **Show "appsscript.json" manifest file in editor**
4. Replace the default manifest with this repo’s `appsscript.json`
5. **Deploy** → **Test deployments** → **Install** → pick a Google Workspace app (Gmail recommended first)
6. Open the add-on → **Settings** → paste your API key → **Save**
7. Use **Search** from the add-on menu or homepage

## Local development with clasp

```bash
npm install -g @google/clasp
clasp login

cd hienergy-workspace-addon
cp .clasp.json.example .clasp.json
# Edit .clasp.json and set your scriptId after `clasp create --type workspace-add-on`

clasp push
clasp deploy --description "Dev"
```

Create a new Apps Script project:

```bash
clasp create --title "Hi Energy Rocket" --type workspace-add-on
clasp push
```

## Configuration

| Setting | Default | Description |
|--------|---------|-------------|
| API base | `https://app.hienergy.ai/api/v1` | Override in Settings for staging |
| API key | — | Required; per Google user |

Environment-specific base URL example: `http://localhost:3000/api/v1` when running project_rocket locally.

## API endpoints used

| Action | Endpoint |
|--------|----------|
| Omnibox search | `GET /search?q=…` |
| Domain lookup | `GET /advertisers/search_by_domain?domain=…` |
| Advertiser show | `GET /advertisers/:id_or_slug` |
| Deals | `GET /deals?q=…` |
| Transactions | `GET /transactions?days=30&sort=commission_desc` |

See full OpenAPI at `GET https://app.hienergy.ai/api/v1/schema`.

## Publishing

1. Configure OAuth consent screen in [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Workspace Marketplace SDK**
3. Create a **Google Workspace Add-on** deployment in Apps Script
4. Submit for review (internal testing: deploy to your domain only)

For production logo URL, host a **128×128 PNG** over HTTPS if Google rejects the SVG logo in the manifest.

## Security notes

- API keys live in **UserProperties** (per Google user, not shared across users)
- Only `script.external_request` is used to reach Hi Energy; no Hi Energy OAuth in v1
- Gmail scope is read-only for the open message (`gmail.addons.current.message.readonly`)

## Future: Auth0 OAuth

If you prefer OAuth instead of API keys, register an Auth0 app with audience `AUTH0_API_AUDIENCE` and send `Authorization: Bearer <token>`. That flow is not implemented in this repo yet; API key is the supported path for server-style clients.

## License

Private / Hi Energy internal — adjust as needed.
