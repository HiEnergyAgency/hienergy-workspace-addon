const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'appsscript.json'), 'utf8'));

describe('appsscript.json manifest', function () {
  it('registers Hi Energy AI branding', function () {
    expect(manifest.addOns.common.name).toBe('Hi Energy AI Workspace Add-on');
    expect(manifest.addOns.common.logoUrl).toContain('googleusercontent.com');
    expect(manifest.addOns.common.layoutProperties.primaryColor).toBe('#8b5cf6');
  });

  it('includes Gmail, MCP, Contacts, Sheets, and compose scopes', function () {
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/gmail.readonly');
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/gmail.compose');
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/contacts.readonly');
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/spreadsheets');
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/gmail.addons.execute');
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/script.external_request');
    expect(manifest.oauthScopes).toContain('https://www.googleapis.com/auth/script.locale');
    expect(manifest.urlFetchWhitelist).toContain('https://app.hienergy.ai/');
    expect(manifest.addOns.common.openLinkUrlPrefixes).toContain('https://app.hienergy.ai/');
    expect(manifest.addOns.common.openLinkUrlPrefixes).toContain('https://docs.google.com/');
  });

  it('enables the People advanced service', function () {
    expect(manifest.dependencies.enabledAdvancedServices).toEqual([
      expect.objectContaining({ userSymbol: 'People', serviceId: 'peopleapi' })
    ]);
  });

  it('enables Gmail and Sheets hosts', function () {
    expect(manifest.addOns.gmail.contextualTriggers).toHaveLength(1);
    expect(manifest.addOns.sheets).toEqual({});
    expect(manifest.addOns.common.homepageTrigger.enabled).toBe(true);
  });

  it('wires homepage, Gmail, and universal actions', function () {
    expect(manifest.addOns.common.homepageTrigger.runFunction).toBe('onHomepage');
    expect(manifest.addOns.gmail.contextualTriggers[0].onTriggerFunction).toBe('onGmailMessageOpen');

    const labels = manifest.addOns.common.universalActions.map(function (action) {
      return action.label;
    });
    expect(labels).toEqual(['Search', 'Settings', 'MCP Tools', 'Create Sheet', 'Draft Email']);
  });
});

describe('source files', function () {
  it('includes every Apps Script module in the repo root', function () {
    const expected = [
      'ApiClient.gs',
      'Auth0.gs',
      'Cards.gs',
      'Config.gs',
      'ContactsClient.gs',
      'GmailClient.gs',
      'GmailDrafts.gs',
      'Main.gs',
      'McpClient.gs',
      'McpExport.gs',
      'Setup.gs',
      'SheetsClient.gs'
    ];

    expected.forEach(function (file) {
      expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
    });
  });
});
