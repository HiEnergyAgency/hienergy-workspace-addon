var HiEnergyApi = (function () {
  function userProps_() {
    return PropertiesService.getUserProperties();
  }

  function apiKey_() {
    return userProps_().getProperty(HiEnergyConfig.propApiKey);
  }

  function apiBase_() {
    return userProps_().getProperty(HiEnergyConfig.propApiBase) || HiEnergyConfig.defaultApiBase;
  }

  function hasApiKey_() {
    return Boolean(apiKey_());
  }

  function hasAuth_() {
    return HiEnergyAuth.hasAccess() || hasApiKey_();
  }

  function saveCredentials_(apiKey, apiBase) {
    var props = userProps_();
    props.setProperty(HiEnergyConfig.propApiKey, String(apiKey || '').trim());
    if (apiBase) {
      props.setProperty(HiEnergyConfig.propApiBase, String(apiBase).replace(/\/$/, ''));
    }
  }

  function clearCredentials_() {
    var props = userProps_();
    props.deleteProperty(HiEnergyConfig.propApiKey);
    props.deleteProperty(HiEnergyConfig.propApiBase);
  }

  function authHeaders_() {
    if (HiEnergyAuth.hasAccess()) {
      var token = HiEnergyAuth.getAccessToken();
      if (token) {
        return { Authorization: 'Bearer ' + token };
      }
    }

    var key = apiKey_();
    if (key) {
      return { 'X-Api-Key': key };
    }

    return null;
  }

  function request_(path, options) {
    options = options || {};

    if (!HiEnergyAuth.isConfigured() && !hasApiKey_()) {
      return { ok: false, code: 0, error: 'AUTH0_NOT_CONFIGURED', body: null };
    }

    if (!hasAuth_()) {
      return { ok: false, code: 0, error: 'AUTH_REQUIRED', body: null };
    }

    var headers = authHeaders_();
    if (!headers) {
      return { ok: false, code: 0, error: 'AUTH_REQUIRED', body: null };
    }

    var base = apiBase_().replace(/\/$/, '');
    var url = base + path;
    if (options.query) {
      var parts = [];
      Object.keys(options.query).forEach(function (name) {
        var value = options.query[name];
        if (value === null || value === undefined || value === '') {
          return;
        }
        parts.push(encodeURIComponent(name) + '=' + encodeURIComponent(String(value)));
      });
      if (parts.length) {
        url += (url.indexOf('?') >= 0 ? '&' : '?') + parts.join('&');
      }
    }

    var fetchOptions = {
      method: (options.method || 'get').toUpperCase(),
      headers: Object.assign({ Accept: 'application/json' }, headers),
      muteHttpExceptions: true
    };

    if (options.payload) {
      fetchOptions.contentType = 'application/json';
      fetchOptions.payload = JSON.stringify(options.payload);
    }

    var response = UrlFetchApp.fetch(url, fetchOptions);
    var code = response.getResponseCode();
    var text = response.getContentText() || '';
    var body = null;

    if (text) {
      try {
        body = JSON.parse(text);
      } catch (parseError) {
        body = { raw: text };
      }
    }

    if (code >= 200 && code < 300) {
      return { ok: true, code: code, body: body, error: null };
    }

    var message = (body && (body.message || body.error)) || text || ('HTTP ' + code);
    if (code === 401) {
      if (HiEnergyAuth.hasAccess()) {
        HiEnergyAuth.reset();
      }
      return { ok: false, code: code, body: body, error: 'API_UNAUTHORIZED', message: message };
    }
    if (code === 429) {
      return { ok: false, code: code, body: body, error: 'API_RATE_LIMITED', message: message };
    }

    return { ok: false, code: code, body: body, error: 'API_ERROR', message: message };
  }

  function search_(query, types) {
    return request_('/search', {
      query: {
        q: query,
        per_type_limit: HiEnergyConfig.perTypeLimit,
        types: types && types.length ? types.join(',') : null
      }
    });
  }

  function advertiserByDomain_(domain) {
    return request_('/advertisers/search_by_domain', {
      query: { domain: domain }
    });
  }

  function advertiser_(idOrSlug) {
    return request_('/advertisers/' + encodeURIComponent(idOrSlug));
  }

  function deals_(query) {
    return request_('/deals', {
      query: {
        q: query,
        limit: HiEnergyConfig.perTypeLimit
      }
    });
  }

  function transactions_(query) {
    return request_('/transactions', {
      query: {
        days: 30,
        sort: 'commission_desc',
        limit: HiEnergyConfig.perTypeLimit,
        advertiser_id: query && query.advertiserId ? query.advertiserId : null,
        q: query && query.q ? query.q : null
      }
    });
  }

  return {
    hasAuth: hasAuth_,
    hasApiKey: hasApiKey_,
    saveCredentials: saveCredentials_,
    clearCredentials: clearCredentials_,
    getApiBase: apiBase_,
    search: search_,
    advertiserByDomain: advertiserByDomain_,
    advertiser: advertiser_,
    deals: deals_,
    transactions: transactions_
  };
})();
