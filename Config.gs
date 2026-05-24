var HiEnergyConfig = (function () {
  var DEFAULT_API_BASE = 'https://app.hienergy.ai/api/v1';
  var APP_ORIGIN = 'https://app.hienergy.ai';
  var PROP_API_KEY = 'HIENERGY_API_KEY';
  var PROP_API_BASE = 'HIENERGY_API_BASE';
  var DEFAULT_AUTH0_AUDIENCE = 'https://api.hienergyrocket.com/mcp';

  return {
    defaultApiBase: DEFAULT_API_BASE,
    appOrigin: APP_ORIGIN,
    propApiKey: PROP_API_KEY,
    propApiBase: PROP_API_BASE,
    docsUrl: APP_ORIGIN + '/api_documentation',
    authDocsUrl: APP_ORIGIN + '/api_documentation/mcp',
    perTypeLimit: 5,
    auth0Scope: 'openid profile email',
    defaultAuth0Audience: DEFAULT_AUTH0_AUDIENCE
  };
})();
