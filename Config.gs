var HiEnergyConfig = (function () {
  var DEFAULT_API_BASE = 'https://app.hienergy.ai/api/v1';
  var APP_ORIGIN = 'https://app.hienergy.ai';
  var PROP_API_KEY = 'HIENERGY_API_KEY';
  var PROP_API_BASE = 'HIENERGY_API_BASE';

  return {
    defaultApiBase: DEFAULT_API_BASE,
    appOrigin: APP_ORIGIN,
    propApiKey: PROP_API_KEY,
    propApiBase: PROP_API_BASE,
    docsUrl: APP_ORIGIN + '/api_documentation/api_key',
    perTypeLimit: 5
  };
})();
