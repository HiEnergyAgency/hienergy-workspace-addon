# OAuth verification — scope justifications

Submit this content with your OAuth verification request in Google Cloud Console. Sensitive scopes require a demo video (see [demo-video-script.md](./demo-video-script.md)).

## Application summary

| Field | Value |
|-------|-------|
| **App name** | Hi Energy AI Workspace Add-on |
| **Type** | Google Workspace Add-on (Gmail + common homepage) |
| **Purpose** | Let Hi Energy AI customers search affiliate program data and enrich open Gmail messages with sender context |
| **Data storage** | No Google user data is stored on Hi Energy servers. Gmail/Contacts reads occur in Apps Script per request for the signed-in user only. Auth0 tokens stored in Apps Script UserProperties via OAuth2 library. |

## Scope justifications

### `https://www.googleapis.com/auth/gmail.addons.current.message.readonly`

**Why needed:** Core Gmail add-on behavior. When a user opens an email, the add-on reads the current message metadata (From, Subject, Date) to show sender domain context and suggest Hi Energy advertiser lookup.

**How used:** `GmailApp.getMessageById()` / add-on event object in `onGmailMessageOpen`. Read-only; no send, delete, or modify.

**User benefit:** Instant context for partnership email without copying addresses to another tool.

---

### `https://www.googleapis.com/auth/gmail.addons.execute`

**Why needed:** Required for Google Workspace add-ons to run contextual triggers and universal actions in Gmail.

**How used:** Manifest-declared triggers call `onGmailMessageOpen`, `onHomepage`, `onSearchAction`, etc.

**User benefit:** Add-on appears and responds in the Gmail sidebar.

---

### `https://www.googleapis.com/auth/gmail.readonly` *(sensitive)*

**Why needed:** Search recent Gmail threads from the same domain as the open email sender (e.g. `@acme.com`) to surface related conversations.

**How used:** `GmailApp.search()` with a domain query, limited to 10 messages (`Config.gs` `messageLimit`). Results shown only to the signed-in user in the add-on card.

**User benefit:** See recent partner email history alongside Hi Energy data.

**Data handling:** Message snippets and subjects displayed in UI only; not exported to Hi Energy servers.

---

### `https://www.googleapis.com/auth/gmail.compose` *(sensitive)*

**Why needed:** Create Gmail drafts from Hi Energy MCP data (partnership outreach templates with advertiser and deal context).

**How used:** `GmailApp.createDraft()` when the user clicks **Draft Email** or **Create Gmail draft** after reviewing MCP-generated content. The add-on never sends email automatically.

**User benefit:** Save time drafting partnership emails with accurate program details from Hi Energy AI.

**Data handling:** Draft content is written only to the user's Gmail drafts folder.

---

### `https://www.googleapis.com/auth/spreadsheets`

**Why needed:** Export Hi Energy search results (advertisers, deals, transactions, contacts) to new Google Sheets owned by the user.

**How used:** `SpreadsheetApp.create()` when the user runs **Create Sheet** or **Export to Google Sheet** after an MCP/API search.

**User benefit:** Share and analyze affiliate program data in Sheets without manual copy-paste.

**Data handling:** Spreadsheets are created in the user's Google Drive; Hi Energy does not retain sheet contents.

---

### `https://www.googleapis.com/auth/contacts.readonly` *(sensitive)*

**Why needed:** Match the email sender to the user's Google Contacts (name, organization) for richer context.

**How used:** People API `people.searchContacts` with the sender email, limited to 10 results (`contactLimit`).

**User benefit:** Recognize partners by contact name and company while reading email.

**Data handling:** Contact fields displayed in add-on UI only; not sent to Hi Energy MCP except when user explicitly runs a Hi Energy search (which uses Hi Energy credentials, not Contacts export).

---

### `https://www.googleapis.com/auth/userinfo.email`

**Why needed:** Identify the signed-in Google user for Auth0 login hint and Hi Energy account matching.

**How used:** OAuth2 / Session.getActiveUser().getEmail() for sign-in flows.

**User benefit:** Seamless link between Google identity and Hi Energy AI account.

---

### `https://www.googleapis.com/auth/script.locale`

**Why needed:** Read the host Workspace app's locale when `useLocaleFromApp` is enabled in the add-on manifest.

**How used:** CardService uses the locale for add-on UI strings and formatting.

**User benefit:** Sidebar labels and messages match the user's Gmail/Workspace language settings.

---

### `https://www.googleapis.com/auth/script.external_request`

**Why needed:** Call Hi Energy AI MCP server (`https://app.hienergy.ai/mcp`) and Auth0 token endpoints.

**How used:** `UrlFetchApp.fetch` in `McpClient.gs`, `Auth0.gs`, `ApiClient.gs`.

**User benefit:** Live search and MCP tools from Hi Energy AI.

---

## Demo video requirements checklist

Your video must show:

1. App name **Hi Energy AI** visible in OAuth consent screen
2. User installing/opening add-on in Gmail
3. OAuth consent showing **gmail.readonly**, **gmail.compose**, and **contacts.readonly** with user accepting
4. Feature using **gmail.readonly**: domain message search in sidebar
5. Feature using **contacts.readonly**: contact match for email sender
6. Feature using **gmail.compose**: create a Gmail draft from MCP advertiser data
7. Feature using **spreadsheets**: export advertiser or deal search results to a Google Sheet
8. Clear narration or on-screen text explaining each sensitive scope use

Duration: 2–5 minutes. Upload unlisted YouTube or Google Drive link in verification form.

## Contact for Google reviewers

| Role | Suggested |
|------|-----------|
| **Primary contact email** | support@hienergy.ai (or your verification contact) |
| **Test account** | Provide a Google test user + note that Hi Energy Auth0 login is required for full MCP search |

## Optional: limited use disclosure

This app accesses Google user data only to provide features visible in the add-on sidebar for the authenticated user. We do not use Google user data for advertising, sell it to third parties, or use it for purposes unrelated to the add-on's core functionality.
