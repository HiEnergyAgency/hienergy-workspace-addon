# Marketplace publishing checklist

Use this checklist in order. Check off each item as you complete it.

## Phase 1 — GCP and Apps Script

- [ ] **Create or select a standard GCP project** (not default Apps Script project) in [Google Cloud Console](https://console.cloud.google.com/)
- [ ] **Link GCP project to Apps Script**: Apps Script editor → Project Settings → Google Cloud Platform (GCP) Project → Change project → enter GCP project number
- [ ] **Enable APIs** in GCP: Google Workspace Marketplace SDK, Gmail API, People API (if not already enabled via Apps Script advanced service)
- [ ] **Confirm Apps Script deployment**: Deploy → New deployment → Type **Add-on** → note deployment ID for test installs
- [ ] **Set script properties** in Apps Script (Project Settings → Script properties):
  - `AUTH0_DOMAIN`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_CLIENT_SECRET`
  - `AUTH0_AUDIENCE` = `https://api.hienergyrocket.com/mcp`
- [ ] **Auth0**: Add OAuth callback URL (see [README](./README.md#apps-script-project-reference))
- [ ] **Test install**: Deploy → Test deployments → install on a test Workspace account

## Phase 2 — OAuth consent screen

- [ ] Open [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) for the linked GCP project
- [ ] Set **User type**: Internal (Workspace org only) **or** External (public)
- [ ] **App name**: Hi Energy AI Workspace Add-on
- [ ] **User support email** and **Developer contact**: your team email
- [ ] **App logo**: upload `assets/logo-120.png`
- [ ] **App domain**: `hienergy.ai` (verify domain in Search Console if required)
- [ ] **Authorized domains**: `hienergy.ai`, `script.google.com`, `googleusercontent.com`
- [ ] **Scopes** — add all scopes from `appsscript.json`:
  - `gmail.addons.current.message.readonly`
  - `gmail.addons.execute`
  - `gmail.readonly` *(sensitive)*
  - `gmail.compose` *(sensitive)*
  - `contacts.readonly` *(sensitive)*
  - `spreadsheets`
  - `userinfo.email`
  - `script.locale`
  - `script.external_request`
- [ ] **Privacy policy URL**: https://app.hienergy.ai/privacy_policy
- [ ] **Terms of service URL**: https://app.hienergy.ai/terms_of_service

## Phase 3 — OAuth verification (required for sensitive scopes)

- [ ] Prepare scope justifications from [oauth-verification.md](./oauth-verification.md)
- [ ] Record demo video using [demo-video-script.md](./demo-video-script.md) (YouTube unlisted or Google Drive link)
- [ ] Submit verification: OAuth consent screen → **Submit for verification**
- [ ] Respond to Google reviewer questions within 3 business days
- [ ] Wait for approval (typically 1–6 weeks for sensitive scopes)

## Phase 4 — Marketplace SDK listing

- [ ] Enable [Google Workspace Marketplace SDK](https://console.cloud.google.com/marketplace) for the GCP project
- [ ] Create listing → **Google Workspace add-on**
- [ ] Link Apps Script project ID: `1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4`
- [ ] Fill listing fields from [listing-copy.md](./listing-copy.md) and [listing-config.json](./listing-config.json)
- [ ] Upload logos: `logo-120.png`, `logo-128.png`
- [ ] Upload screenshots (1280×800): sign-in, search, Gmail context
- [ ] Set **Visibility**: Private (domain) / Public / Unlisted as appropriate
- [ ] Set **Pricing**: Free (or your model)
- [ ] Add **Support URL** and **Documentation URL**
- [ ] Submit listing for review

## Phase 5 — Post-approval

- [ ] Publish production deployment in Apps Script (Add-on type, version bump)
- [ ] Announce install link to Hi Energy AI customers
- [ ] Monitor OAuth consent screen for scope errors or user reports
- [ ] Replace mockup screenshots with real product captures when convenient

## Internal vs public listing

| Path | OAuth user type | Verification | Best for |
|------|-----------------|--------------|------------|
| **Internal** | Internal | Often lighter for same Workspace org | Hi Energy team + single customer domain |
| **Public** | External | Full verification + demo video | Any Google Workspace customer |

For a public listing with `gmail.readonly` and `contacts.readonly`, OAuth verification is mandatory.
