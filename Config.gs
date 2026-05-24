var HiEnergyConfig = (function () {
  var DEFAULT_API_BASE = 'https://app.hienergy.ai/api/v1';
  var APP_ORIGIN = 'https://app.hienergy.ai';
  var PROP_API_KEY = 'HIENERGY_API_KEY';
  var PROP_API_BASE = 'HIENERGY_API_BASE';
  var PROP_MCP_URL = 'HIENERGY_MCP_URL';
  var PROP_HOST_APP = 'HIENERGY_HOST_APP';
  var DEFAULT_AUTH0_AUDIENCE = 'https://api.hienergyrocket.com/mcp';
  var DEFAULT_MCP_URL = 'https://app.hienergy.ai/mcp';
  var BRAND_NAME = 'Hi Energy AI Workspace Add-on';
  var BRAND_TAGLINE = 'Search affiliate programs, advertisers, and deals';
  // Same PNG as the Hi Energy AI Chrome extension (icons/icon128.png).
  var BRAND_LOGO_URL =
    'https://lh3.googleusercontent.com/Tp71UPO0ZbOXtS2p7NKJDWF1sLg0HrGWH9LO4F_EmweBAS58yU5R6TsZqG2Ae4jho5rEWEOVYkaxq3M8APpIrgwwit0=s128-rj-sc0x00ffffff';

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
    propHostApp: PROP_HOST_APP,
    propExportSession: 'HIENERGY_EXPORT_SESSION',
    docsUrl: APP_ORIGIN + '/api_documentation',
    authDocsUrl: APP_ORIGIN + '/api_documentation/mcp',
    advertiserPath: '/a/',
    dealPath: '/deals/',
    dealAdminPath: '/admin/deals/',
    privacyPolicyUrl: APP_ORIGIN + '/privacy_policy',
    termsOfServiceUrl: APP_ORIGIN + '/terms_of_service',
    perTypeLimit: 5,
    interactiveSearchLimit: 25,
    contactLimit: 10,
    messageLimit: 10,
    mcpToolLimit: 12,
    sheetRowLimit: 500,
    exportPageSize: 100,
    exportMaxPages: 50,
    exportTimeBudgetMs: 22000,
    sheetTitlePrefix: 'Hi Energy AI',
    advertiserSearchLimit: 500,
    sheetContactLimit: 500,
    mcpProtocolVersion: '2025-11-25',
    mcpClientName: BRAND_NAME,
    mcpClientVersion: '1.0.0',
    auth0Scope: 'openid profile email',
    defaultAuth0Audience: DEFAULT_AUTH0_AUDIENCE
  };
})();
