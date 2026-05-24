# Hi Energy Rocket — Google Workspace Add-on

Universal Google Workspace sidebar add-on that calls the [Hi Energy Rocket API](https://app.hienergy.ai/api_documentation) from Gmail, Drive, Docs, Sheets, Slides, and Calendar.

## Authentication

**Primary: Auth0 OAuth** — users click **Sign in with Hi Energy** and the add-on sends `Authorization: Bearer <access_token>` to `/api/v1/*`.

**Fallback: API key** — optional `X-Api-Key` in Settings → Advanced (for local dev or when Auth0 is unavailable).

Hi Energy accepts Auth0 JWTs when the token audience matches `AUTH0_API_AUDIENCE` / `MCP_OAUTH_RESOURCE` (default `https://api.hienergyrocket.com/mcp`).

## Features

- Search advertisers, deals, and transactions
- Gmail domain context lookup from the open message
- Advertiser detail, deals, and transactions
- Per-user OAuth tokens stored via the [OAuth2 Apps Script library](https://github.com/googleworkspace/apps-script-oauth2)

## Architecture

```
Google Workspace
      │
      ▼
Apps Script add-on (CardService)
      │
      ├── Auth0 OAuth (authorize + token)
      │
      ▼
Authorization: Bearer …  →  https://app.hienergy.ai/api/v1/*
```

## One-time admin setup (Auth0)

### 1. Auth0 application

In [Auth0 Dashboard](https://manage.auth0.com):

1. **Applications** → **Create Application** → **Regular Web Application**
2. **Allowed Callback URLs** (after you have the Apps Script project ID):
   ```
   https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback
   ```
3. **Allowed Logout URLs** (optional): same origin or your app URL
4. Note **Domain**, **Client ID**, and **Client Secret**

### 2. Auth0 API audience

Ensure your Auth0 API identifier matches what Hi Energy expects (same value as `AUTH0_API_AUDIENCE` in project_rocket), e.g.:

```
https://api.hienergyrocket.com/mcp
```

Enable **RBAC** / scopes as needed; the add-on requests `openid profile email`.

### 3. Apps Script script properties

In the Apps Script project → **Project Settings** → **Script properties**, add:

| Property | Example |
|----------|---------|
| `AUTH0_DOMAIN` | `your-tenant.us.auth0.com` |
| `AUTH0_CLIENT_ID` | `abc123…` |
| `AUTH0_CLIENT_SECRET` | `secret…` |
| `AUTH0_AUDIENCE` | `https://api.hienergyrocket.com/mcp` |
| `HIENERGY_API_BASE` | (optional) `https://app.hienergy.ai/api/v1` |

End users never see these values.

### 4. OAuth2 library

This repo’s `appsscript.json` already references Google’s OAuth2 library. After `clasp push`, confirm **Libraries** shows **OAuth2** in the Apps Script editor.

## User flow

1. Install the add-on (test or marketplace deployment)
2. Open the add-on → **Sign in with Hi Energy**
3. Complete Auth0 login (Google social login works if enabled in Auth0)
4. Search and browse data; token refresh is handled by the OAuth2 library

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

## API endpoints used

| Action | Endpoint |
|--------|----------|
| Search | `GET /search?q=…` |
| Domain lookup | `GET /advertisers/search_by_domain?domain=…` |
| Advertiser | `GET /advertisers/:id_or_slug` |
| Deals | `GET /deals?q=…` |
| Transactions | `GET /transactions?days=30&sort=commission_desc` |

OpenAPI: `GET https://app.hienergy.ai/api/v1/schema`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Auth0 not configured” | Set all four `AUTH0_*` script properties |
| Callback URL mismatch | Add exact `usercallback` URL to Auth0 allowed callbacks |
| 401 from Hi Energy | Check `AUTH0_AUDIENCE` matches API config; user must exist in Hi Energy with matching email |
| Invalid audience | Token `aud` must include your `AUTH0_AUDIENCE` value |

## Security

- Auth0 **client secret** lives in Script Properties (deployment-wide, not end-user editable in the add-on UI)
- Access tokens live in per-user Properties via OAuth2 library
- Optional API keys are per-user in UserProperties

## License

Private / Hi Energy internal — adjust as needed.
