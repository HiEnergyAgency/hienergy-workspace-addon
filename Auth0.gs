var HiEnergyAuth = (function () {
  var SERVICE_NAME = 'hienergy_auth0';

  function scriptProps_() {
    return PropertiesService.getScriptProperties();
  }

  function scriptProp_(key, fallback) {
    var value = scriptProps_().getProperty(key);
    if (value === null || value === undefined || String(value).trim() === '') {
      return fallback || '';
    }
    return String(value).trim();
  }

  function isConfigured_() {
    return Boolean(
      scriptProp_('AUTH0_DOMAIN') &&
        scriptProp_('AUTH0_CLIENT_ID') &&
        scriptProp_('AUTH0_CLIENT_SECRET') &&
        scriptProp_('AUTH0_AUDIENCE')
    );
  }

  function normalizedDomain_() {
    return scriptProp_('AUTH0_DOMAIN').replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  function getService_() {
    if (!isConfigured_()) {
      throw new Error('AUTH0_NOT_CONFIGURED');
    }

    var domain = normalizedDomain_();
    return OAuth2.createService(SERVICE_NAME)
      .setAuthorizationBaseUrl('https://' + domain + '/authorize')
      .setTokenUrl('https://' + domain + '/oauth/token')
      .setClientId(scriptProp_('AUTH0_CLIENT_ID'))
      .setClientSecret(scriptProp_('AUTH0_CLIENT_SECRET'))
      .setScope(HiEnergyConfig.auth0Scope)
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      .setCache(CacheService.getUserCache())
      .setParam('audience', scriptProp_('AUTH0_AUDIENCE'));
  }

  function hasAccess_() {
    if (!isConfigured_()) {
      return false;
    }
    try {
      return getService_().hasAccess();
    } catch (err) {
      console.warn('Auth0 hasAccess failed: ' + err);
      return false;
    }
  }

  function getAccessToken_() {
    var service = getService_();
    if (!service.hasAccess()) {
      return null;
    }
    return service.getAccessToken();
  }

  function requireAuthorization_() {
    if (!isConfigured_()) {
      throw new Error('AUTH0_NOT_CONFIGURED');
    }
    var service = getService_();
    if (!service.hasAccess()) {
      CardService.newAuthorizationException()
        .setAuthorizationUrl(service.getAuthorizationUrl())
        .setResourceDisplayName('Hi Energy Rocket')
        .throwException();
    }
  }

  function reset_() {
    if (!isConfigured_()) {
      return;
    }
    getService_().reset();
  }

  function handleCallback_(request) {
    if (!isConfigured_()) {
      return HtmlService.createHtmlOutput('Auth0 is not configured for this add-on deployment.');
    }

    var service = getService_();
    var authorized = service.handleCallback(request);
    if (authorized) {
      return HtmlService.createHtmlOutput(
        '<p>Signed in to Hi Energy Rocket.</p><p>Return to Gmail or your Workspace app and reopen the add-on.</p>'
      );
    }
    return HtmlService.createHtmlOutput('Sign-in was denied or failed. Close this tab and try again.');
  }

  function configurationSummary_() {
    return {
      domain: scriptProp_('AUTH0_DOMAIN'),
      audience: scriptProp_('AUTH0_AUDIENCE'),
      clientIdPresent: Boolean(scriptProp_('AUTH0_CLIENT_ID')),
      clientSecretPresent: Boolean(scriptProp_('AUTH0_CLIENT_SECRET')),
      configured: isConfigured_()
    };
  }

  return {
    isConfigured: isConfigured_,
    hasAccess: hasAccess_,
    getAccessToken: getAccessToken_,
    requireAuthorization: requireAuthorization_,
    reset: reset_,
    handleCallback: handleCallback_,
    configurationSummary: configurationSummary_
  };
})();

function authCallback(request) {
  return HiEnergyAuth.handleCallback(request);
}
