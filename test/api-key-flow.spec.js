const { loadCoreProject } = require('./helpers/gas-runtime');

describe('HiEnergyApi credentials', function () {
  it('starts with no API key', function () {
    const ctx = loadCoreProject();
    expect(ctx.HiEnergyApi.hasApiKey()).toBe(false);
    expect(ctx.HiEnergyApi.maskedApiKey()).toBe('');
    expect(ctx.HiEnergyApi.authMode()).toBe('auth0');
  });

  it('saves a key and reports a masked preview', function () {
    const ctx = loadCoreProject({
      HiEnergyAuth: {
        isConfigured: function () {
          return false;
        },
        hasAccess: function () {
          return false;
        }
      }
    });
    ctx.HiEnergyApi.saveCredentials('super-secret-key-1234');
    expect(ctx.HiEnergyApi.hasApiKey()).toBe(true);
    expect(ctx.HiEnergyApi.maskedApiKey()).toBe('••••1234');
    expect(ctx.HiEnergyApi.authMode()).toBe('api_key');
  });

  it('replaces an existing key when a new one is saved', function () {
    const ctx = loadCoreProject({
      HiEnergyAuth: {
        isConfigured: function () {
          return false;
        },
        hasAccess: function () {
          return false;
        }
      }
    });
    ctx.HiEnergyApi.saveCredentials('old-aaaa-1111');
    expect(ctx.HiEnergyApi.maskedApiKey()).toBe('••••1111');
    ctx.HiEnergyApi.saveCredentials('new-bbbb-9999');
    expect(ctx.HiEnergyApi.maskedApiKey()).toBe('••••9999');
  });

  it('clears only the API key with clearApiKey, preserving API base', function () {
    const ctx = loadCoreProject({
      HiEnergyAuth: {
        isConfigured: function () {
          return false;
        },
        hasAccess: function () {
          return false;
        }
      }
    });
    ctx.HiEnergyApi.saveApiBase('https://custom.example.com');
    ctx.HiEnergyApi.saveCredentials('keep-this-base-2222');
    ctx.HiEnergyApi.clearApiKey();
    expect(ctx.HiEnergyApi.hasApiKey()).toBe(false);
    expect(ctx.HiEnergyApi.getApiBase()).toBe('https://custom.example.com');
  });

  it('clearCredentials wipes key and base together', function () {
    const ctx = loadCoreProject({
      HiEnergyAuth: {
        isConfigured: function () {
          return false;
        },
        hasAccess: function () {
          return false;
        }
      }
    });
    ctx.HiEnergyApi.saveCredentials('to-be-removed-3333', 'https://temp.example.com');
    ctx.HiEnergyApi.clearCredentials();
    expect(ctx.HiEnergyApi.hasApiKey()).toBe(false);
    expect(ctx.HiEnergyApi.getApiBase()).toBe(ctx.HiEnergyConfig.defaultApiBase);
  });

  it('saves and resets the MCP url override', function () {
    const ctx = loadCoreProject();
    ctx.HiEnergyApi.saveMcpUrl('https://staging.hienergy.ai/mcp/');
    expect(ctx.HiEnergyApi.getMcpUrl()).toBe('https://staging.hienergy.ai/mcp');
    ctx.HiEnergyApi.saveMcpUrl('');
    expect(ctx.HiEnergyApi.getMcpUrl()).toBe(ctx.HiEnergyConfig.defaultMcpUrl);
  });
});
