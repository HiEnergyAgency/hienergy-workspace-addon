var HiEnergyConfig = (function () {
  var DEFAULT_API_BASE = 'https://app.hienergy.ai/api/v1';
  var APP_ORIGIN = 'https://app.hienergy.ai';
  var PROP_API_KEY = 'HIENERGY_API_KEY';
  var PROP_API_BASE = 'HIENERGY_API_BASE';
  var PROP_MCP_URL = 'HIENERGY_MCP_URL';
  var DEFAULT_AUTH0_AUDIENCE = 'https://api.hienergyrocket.com/mcp';
  var DEFAULT_MCP_URL = 'https://app.hienergy.ai/mcp';

  return {
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
    mcpClientName: 'Hi Energy Workspace Add-on',
    mcpClientVersion: '1.0.0',
    auth0Scope: 'openid profile email',
    defaultAuth0Audience: DEFAULT_AUTH0_AUDIENCE
  };
})();
