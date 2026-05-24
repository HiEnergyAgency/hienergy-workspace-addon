# Privacy Policy — Hi Energy AI Google Workspace Add-on

**Last updated:** May 24, 2026  
**Canonical URL:** https://app.hienergy.ai/privacy_policy

> The live privacy policy is hosted on app.hienergy.ai (redirects to https://www.hienergy.ai/privacy-policy). Use that URL for OAuth consent and Marketplace listings. The text below is an optional add-on supplement for Google reviewers.

Hi Energy AI ("Hi Energy," "we," "us") operates the **Hi Energy AI** Google Workspace Add-on (the "Add-on"). This policy describes how we handle information when you use the Add-on with Google Gmail and Google Contacts.

## Summary

- The Add-on reads your Gmail and Google Contacts **only to show you context in the sidebar** (sender info, contact matches, recent messages from a domain).
- **We do not store your Gmail or Contacts content on Hi Energy servers.**
- Hi Energy program data (advertisers, deals, etc.) is fetched when **you** sign in and search; that uses your Hi Energy AI account, not bulk export of Google data.

## Information we access

### Google user data

When you authorize the Add-on, it may access:

| Data | Purpose | Stored by Hi Energy? |
|------|---------|----------------------|
| Gmail message metadata (sender, subject, date) | Show context for the open email | No |
| Gmail search results (read-only) | Show recent threads from sender domain | No |
| Google Contacts (read-only) | Match sender to your contacts | No |
| Your Google account email | Sign-in and account linking | No (used in session only) |

Processing occurs in **Google Apps Script** under your Google account. Results are displayed in the Add-on UI for you only.

### Hi Energy AI account data

When you sign in with Hi Energy AI (Auth0), the Add-on calls `https://app.hienergy.ai/mcp` to search and display program data permitted by your Hi Energy account. This is governed by your Hi Energy AI terms and main privacy policy at https://hienergy.ai (or your organization's agreement).

## How we use information

We use Google user data solely to provide Add-on features you request:

- Display email sender and domain context
- Show matching contacts and recent related messages
- Enable navigation and search within the Add-on

We do **not** use Google user data for advertising, sell it to third parties, or use it for purposes unrelated to the Add-on.

## Data sharing

- **Google:** Data stays within Google APIs per your authorization; we do not receive a copy of your mailbox or contacts on Hi Energy servers.
- **Auth0:** Used for Hi Energy AI authentication (email, profile per Auth0 configuration).
- **Hi Energy MCP/API:** Only when you perform Hi Energy searches or tool calls; requests include your Hi Energy credentials, not bulk Google exports.

We may disclose information if required by law.

## Data retention

- **Google data:** Not retained on Hi Energy systems; ephemeral processing in Apps Script per request.
- **Auth0 tokens:** Stored in Apps Script UserProperties for your user session until you sign out or revoke access.
- **Optional API keys:** If you enter a Hi Energy API key in Settings, it is stored in your UserProperties only.

## Security

- HTTPS for all external requests (MCP, Auth0).
- Auth0 client secret stored in Apps Script Script Properties (admin-only).
- Access tokens scoped to your Hi Energy permissions.

## Your choices

- Revoke Google access: [Google Account Permissions](https://myaccount.google.com/permissions)
- Uninstall the Add-on from Gmail or Workspace admin
- Sign out of Hi Energy AI in Add-on Settings

## Children's privacy

The Add-on is not directed at children under 13 (or applicable age in your jurisdiction).

## Changes

We may update this policy. We will post the revised version at the URL above with an updated date.

## Contact

**Hi Energy AI**  
Email: support@hienergy.ai  
Web: https://app.hienergy.ai

---

*Host this document at a public HTTPS URL before submitting OAuth verification or Marketplace listing.*
