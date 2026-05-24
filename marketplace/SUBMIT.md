# Submit Hi Energy AI Workspace Add-on for approval

Complete these steps in order (≈20 minutes). Google has **no API** for Marketplace publish — you must use the console tabs.

**GCP project:** `hi-energy-workspace-app`  
**GCP project number:** `135719878981`  
**Apps Script ID:** `1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4`  
**Production deployment ID:** `AKfycbwbYxV5rGlnTn1BflnDpXcrDEfdqzmDtXSE0HlfQBmzyhGVbcsQm_MlHL3h6Y8gBAkc`

Open everything at once:

```bash
npm run marketplace:open
```

---

## Step 1 — Link GCP to Apps Script (2 min)

1. [Apps Script → Project Settings](https://script.google.com/d/1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4/edit) → **Project Settings**
2. **Google Cloud Platform (GCP) Project** → **Change project**
3. Enter project number: **135719878981** → **Set project**

---

## Step 2 — OAuth consent screen (5 min)

1. [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent?project=hi-energy-workspace-app)
2. **User type:** **Internal** (Hi Energy org only, faster) or **External** (public, requires verification)
3. **App name:** `Hi Energy AI Workspace Add-on`
4. **Support email / Developer contact:** `support@hienergy.ai` or `patrick@hienergy.ai`
5. **App logo:** upload `marketplace/assets/logo-120.png`
6. **Authorized domains:** `hienergy.ai`, `script.google.com`, `googleusercontent.com`
7. **Privacy policy:** `https://app.hienergy.ai/privacy_policy`
8. **Terms:** `https://app.hienergy.ai/terms_of_service`
9. **Data access → Add scopes** — paste all scopes from `appsscript.json` (9 scopes including `script.locale`)
10. **Save and continue** through all steps

**If External (public):** also complete [oauth-verification.md](./oauth-verification.md) and **Submit for verification** with a demo video before Marketplace can approve sensitive scopes.

---

## Step 3 — App Configuration (5 min)

1. [Marketplace SDK → App Configuration](https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=hi-energy-workspace-app)
2. **App visibility:** Private (Hi Energy org) or Public
3. **Installation:** Individual + Admin install
4. **Integrations:** Google Workspace add-on only
5. **Deployment ID:** `AKfycbwbYxV5rGlnTn1BflnDpXcrDEfdqzmDtXSE0HlfQBmzyhGVbcsQm_MlHL3h6Y8gBAkc`
6. **App name:** `Hi Energy AI Workspace Add-on`
7. **Developer:** Hi Energy AI / `support@hienergy.ai` / `https://hienergy.ai`
8. **Application website:** `https://app.hienergy.ai`
9. **OAuth scopes:** paste block from `npm run marketplace:phase4:paste`
10. **Save draft**

---

## Step 4 — Store Listing (8 min)

1. [Marketplace SDK → Store Listing](https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk_publish?project=hi-energy-workspace-app)
2. Copy text from [listing-copy.md](./listing-copy.md)
3. Upload from `marketplace/assets/`:
   - `logo-128.png`, `logo-120.png`
   - `marketplace-screenshot-signin.png`
   - `marketplace-screenshot-search.png`
   - `marketplace-screenshot-gmail-context.png`
4. **Category:** Business tools
5. **Pricing:** Free
6. **Support URL:** `https://app.hienergy.ai`
7. **Documentation URL:** `https://app.hienergy.ai/api_documentation/mcp`
8. **Save draft** → **Submit for review**

---

## Step 5 — After you click Submit

| Track | Timeline |
|-------|----------|
| **Marketplace listing review** | Days to weeks |
| **OAuth verification** (External + sensitive scopes) | 1–6 weeks; use [demo-video-script.md](./demo-video-script.md) |

Code updates after approval: merge to `main` → CI deploys production automatically (no resubmit per code change).

---

## Troubleshooting

| Error on App Configuration page | Fix |
|-----------------------------------|-----|
| “Something went wrong” / permission denied | Ensure you are **Owner** or have `roles/appmetadata.workspaceMarketplaceAppConfigurationAdmin` on `hi-energy-workspace-app` |
| API doesn't exist | Enable [Marketplace SDK](https://console.cloud.google.com/apis/library/appsmarket-component.googleapis.com?project=hi-energy-workspace-app) |

```bash
npm run marketplace:phase4:status   # verify APIs and deployment
```
