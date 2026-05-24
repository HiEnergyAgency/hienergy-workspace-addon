var HiEnergyConfig = (function () {
  var DEFAULT_API_BASE = 'https://app.hienergy.ai/api/v1';
  var APP_ORIGIN = 'https://app.hienergy.ai';
  var PROP_API_KEY = 'HIENERGY_API_KEY';
  var PROP_API_BASE = 'HIENERGY_API_BASE';
  var PROP_MCP_URL = 'HIENERGY_MCP_URL';
  var DEFAULT_AUTH0_AUDIENCE = 'https://api.hienergyrocket.com/mcp';
  var DEFAULT_MCP_URL = 'https://app.hienergy.ai/mcp';
  var BRAND_NAME = 'Hi Energy AI';
  var BRAND_TAGLINE = 'Search affiliate programs, advertisers, and deals';
  var BRAND_LOGO_URL = APP_ORIGIN + '/branding/hienergy-logo-black.svg';

  return {
    brandName: BRAND_NAME,
    brandTagline: BRAND_TAGLINE,
    brandLogoUrl: BRAND_LOGO_URL,
    brandPrimaryColor: '#8b5cf6',
    brandSecondaryColor: '#6d28d9',
    defaultApiBase: DEFAULT_API_BASE,
    defaultMcpUrl: DEFAULT_MCP_URL,
    appOrigin: APP_ORIGIN,
    propApiKey: PROP_API_KEY,
    propApiBase: PROP_API_BASE,
    propMcpUrl: PROP_MCP_URL,
    docsUrl: APP_ORIGIN + '/api_documentation',
    authDocsUrl: APP_ORIGIN + '/api_documentation/mcp',
    perTypeLimit: 5,
    contactLimit: 10,
    messageLimit: 10,
    mcpToolLimit: 12,
    mcpProtocolVersion: '2025-11-25',
    mcpClientName: BRAND_NAME + ' Workspace Add-on',
    mcpClientVersion: '1.0.0',
    auth0Scope: 'openid profile email',
    defaultAuth0Audience: DEFAULT_AUTH0_AUDIENCE
  };
})();
