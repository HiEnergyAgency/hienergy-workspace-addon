# Demo video script — OAuth verification

Record at **1920×1080** or **1280×720**, 2–5 minutes. Use a test Google account and Hi Energy AI test credentials.

## Before recording

1. Deploy latest add-on (Test or Production deployment).
2. Install on a clean test Gmail account (or remove prior authorizations).
3. Prepare sample email from a known domain (e.g. a partner `@example.com`).
4. Ensure Auth0 script properties are set so sign-in works on camera.

## Scene 1 — Introduction (0:00–0:20)

**On screen:** Gmail inbox.

**Narration:**
> This is Hi Energy AI, a Google Workspace add-on for Gmail. It helps affiliate and partnership teams search Hi Energy program data and see context for the email they're reading.

**Action:** Open Gmail → open add-on icon → sidebar shows **Hi Energy AI**.

---

## Scene 2 — OAuth consent (0:20–1:00)

**On screen:** First open or re-authorize flow.

**Narration:**
> When you first use the add-on, Google asks for permission. Hi Energy AI requests read-only access to Gmail and Contacts so it can show sender context and related messages. It does not send email or change your mailbox.

**Action:**
1. Trigger consent (fresh install or revoke + reopen).
2. **Pause on consent screen** — zoom/highlight:
   - See your Gmail messages and settings (`gmail.readonly`)
   - See and download your contacts (`contacts.readonly`)
3. Click **Allow**.

**Required:** App name **Hi Energy AI** and both sensitive scopes clearly visible.

---

## Scene 3 — Contacts scope in use (1:00–1:45)

**On screen:** Open an email from a sender who exists in Google Contacts.

**Narration:**
> With contacts.readonly, the add-on looks up the sender in your Google Contacts and shows their name and organization in the sidebar.

**Action:**
1. Open partner email.
2. Point to **Contact** section in sidebar (name, company).
3. Optionally open Google Contacts in another tab to show the same person (proves data source).

---

## Scene 4 — Gmail read scope in use (1:45–2:30)

**On screen:** Same email; sidebar **Recent messages** section.

**Narration:**
> With gmail.readonly, Hi Energy AI searches your mailbox for other messages from the same domain — for example all mail from acme.com — and lists recent threads. This is read-only search; nothing is deleted or sent.

**Action:**
1. Scroll to recent messages / domain search results.
2. Show 2–3 thread subjects/snippets.
3. Optional: show Gmail search bar with `from:@domain.com` to correlate.

---

## Scene 5 — Hi Energy sign-in and search (2:30–3:30)

**On screen:** Add-on sign-in card.

**Narration:**
> Hi Energy program data uses a separate sign-in to Hi Energy AI. Google data is not uploaded to Hi Energy; only explicit searches call the Hi Energy MCP server.

**Action:**
1. Click **Sign in with Hi Energy AI** → complete Auth0 (blur secrets if needed).
2. Run **Search** universal action → query e.g. "nike".
3. Show advertisers/deals results.

---

## Scene 6 — Closing (3:30–4:00)

**On screen:** Sidebar overview.

**Narration:**
> Hi Energy AI uses Gmail and Contacts read access only to display context in this sidebar for the signed-in user. Thank you.

**Action:** End on sidebar with email context + search visible.

---

## Upload

- YouTube: **Unlisted** — paste link in OAuth verification form.
- Or Google Drive: share link with "Anyone with the link" for Google reviewers.

## Filename suggestion

`hi-energy-ai-workspace-addon-oauth-demo.mp4`
