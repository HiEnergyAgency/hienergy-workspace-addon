const { loadGasFiles, createGasContext } = require('./helpers/gas-runtime');

describe('HiEnergyConfig', function () {
  const ctx = createGasContext().context;
  loadGasFiles(ctx, ['Config.gs']);

  it('uses Hi Energy AI branding', function () {
    expect(ctx.HiEnergyConfig.brandName).toBe('Hi Energy AI');
    expect(ctx.HiEnergyConfig.brandTagline).toContain('affiliate');
    expect(ctx.HiEnergyConfig.brandLogoUrl).toContain('googleusercontent.com');
  });

  it('points MCP and API defaults at app.hienergy.ai', function () {
    expect(ctx.HiEnergyConfig.defaultMcpUrl).toBe('https://app.hienergy.ai/mcp');
    expect(ctx.HiEnergyConfig.defaultApiBase).toBe('https://app.hienergy.ai/api/v1');
    expect(ctx.HiEnergyConfig.privacyPolicyUrl).toBe('https://app.hienergy.ai/privacy_policy');
    expect(ctx.HiEnergyConfig.termsOfServiceUrl).toBe('https://app.hienergy.ai/terms_of_service');
  });

  it('uses the MCP protocol version expected by the server', function () {
    expect(ctx.HiEnergyConfig.mcpProtocolVersion).toBe('2025-11-25');
  });
});
