# Google Workspace Marketplace — Hi Energy AI

Publishing assets and step-by-step checklist for listing **Hi Energy AI** in the Google Workspace Marketplace.

## Contents

| File / folder | Purpose |
|---------------|---------|
| [checklist.md](./checklist.md) | End-to-end publishing checklist |
| [listing-copy.md](./listing-copy.md) | Short/long descriptions, categories, support URLs |
| [oauth-verification.md](./oauth-verification.md) | Scope justifications for Google OAuth review |
| [demo-video-script.md](./demo-video-script.md) | Script for OAuth verification demo video |
| [privacy-policy.md](./privacy-policy.md) | Optional add-on supplement (canonical: app.hienergy.ai) |
| [terms-of-service.md](./terms-of-service.md) | Optional add-on supplement (canonical: app.hienergy.ai) |
| [listing-config.json](./listing-config.json) | Marketplace SDK field template |
| [assets/](./assets/) | Logos and screenshot mockups |

## Quick start

1. Complete [checklist.md](./checklist.md) in order.
2. Use **privacy policy** and **terms** URLs from app.hienergy.ai (see [listing-copy.md](./listing-copy.md)).
3. Upload assets from `assets/` to the Marketplace SDK listing (replace mockup screenshots with real Gmail captures when available).
4. Submit OAuth verification before or in parallel with marketplace review.

## Asset specs

| Asset | Required size | File |
|-------|---------------|------|
| Logo (small) | 120×120 PNG | `assets/logo-120.png` |
| Logo (large) | 128×128 PNG | `assets/logo-128.png` |

Logos match the **Hi Energy AI Chrome extension** (`icons/icon128.png`, extension ID `ckilomnbielchallccjmgomchhkjccdf`). The add-on manifest and sidebar use the same Chrome Web Store CDN URL.
| Screenshot 1 — Sign in | 1280×800 PNG | `assets/marketplace-screenshot-signin.png` |
| Screenshot 2 — Search | 1280×800 PNG | `assets/marketplace-screenshot-search.png` |
| Screenshot 3 — Gmail context | 1280×800 PNG | `assets/marketplace-screenshot-gmail-context.png` |

**Note:** Screenshot mockups are provided for listing draft and OAuth video planning. Replace with real Gmail sidebar captures before final public submission for best review outcomes.

## Apps Script project reference

| Item | Value |
|------|-------|
| Script ID | `1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4` |
| OAuth callback | `https://script.google.com/macros/d/1CL-AxpQya8TGFWbDM2TnS4iZFBj3-JspvinkGrI3kgXUHXnpD4drYKN4/usercallback` |
| Auth0 audience | `https://api.hienergyrocket.com/mcp` |
| MCP URL | `https://app.hienergy.ai/mcp` |

## Support

- Product: https://app.hienergy.ai
- MCP docs: https://app.hienergy.ai/api_documentation/mcp
- Repo: https://github.com/HiEnergyAgency/hienergy-workspace-addon
