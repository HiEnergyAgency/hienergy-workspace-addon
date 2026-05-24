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
    HiEnergyMcp.resetSession();
  }

  function clearCredentials_() {
    var props = userProps_();
    props.deleteProperty(HiEnergyConfig.propApiKey);
    props.deleteProperty(HiEnergyConfig.propApiBase);
    HiEnergyMcp.resetSession();
  }

  function request_(path, options) {
    options = options || {};

    if (!HiEnergyAuth.isConfigured() && !hasApiKey_()) {
      return { ok: false, code: 0, error: 'AUTH0_NOT_CONFIGURED', body: null };
    }

    if (!hasAuth_()) {
      return { ok: false, code: 0, error: 'AUTH_REQUIRED', body: null };
    }

    var apiPath = path.indexOf('/api/') === 0 ? path : '/api/v1' + path;
    return HiEnergyMcp.apiRequest(
      apiPath,
      options.method || 'GET',
      options.query || null,
      options.payload || null
    );
  }

  function withToolFallback_(toolName, toolArgs, path, options) {
    var result = HiEnergyMcp.callTool(toolName, toolArgs);
    if (result.ok) {
      return result;
    }
    return request_(path, options);
  }

  function search_(query, types) {
    return withToolFallback_(
      'universal_search',
      {
        q: query,
        per_type_limit: HiEnergyConfig.perTypeLimit,
        types: types && types.length ? types.join(',') : undefined
      },
      '/search',
      {
        query: {
          q: query,
          per_type_limit: HiEnergyConfig.perTypeLimit,
          types: types && types.length ? types.join(',') : null
        }
      }
    );
  }

  function advertiserByDomain_(domain) {
    return withToolFallback_(
      'search_advertisers_by_domain',
      { domain: domain },
      '/advertisers/search_by_domain',
      { query: { domain: domain } }
    );
  }

  function advertiser_(idOrSlug) {
    return withToolFallback_(
      'get_advertiser',
      { id: idOrSlug },
      '/advertisers/' + encodeURIComponent(idOrSlug)
    );
  }

  function deals_(query) {
    return withToolFallback_(
      'search_deals',
      {
        q: query,
        limit: HiEnergyConfig.perTypeLimit
      },
      '/deals',
      {
        query: {
          q: query,
          limit: HiEnergyConfig.perTypeLimit
        }
      }
    );
  }

  function transactions_(query) {
    return withToolFallback_(
      'search_transactions',
      {
        days: 30,
        sort: 'commission_desc',
        limit: HiEnergyConfig.perTypeLimit,
        advertiser_id: query && query.advertiserId ? query.advertiserId : undefined,
        q: query && query.q ? query.q : undefined
      },
      '/transactions',
      {
        query: {
          days: 30,
          sort: 'commission_desc',
          limit: HiEnergyConfig.perTypeLimit,
          advertiser_id: query && query.advertiserId ? query.advertiserId : null,
          q: query && query.q ? query.q : null
        }
      }
    );
  }

  function listMcpTools_() {
    if (!HiEnergyAuth.isConfigured() && !hasApiKey_()) {
      return { ok: false, code: 0, error: 'AUTH0_NOT_CONFIGURED', body: null };
    }
    if (!hasAuth_()) {
      return { ok: false, code: 0, error: 'AUTH_REQUIRED', body: null };
    }
    return HiEnergyMcp.listTools();
  }

  function callMcpTool_(name, args) {
    if (!HiEnergyAuth.isConfigured() && !hasApiKey_()) {
      return { ok: false, code: 0, error: 'AUTH0_NOT_CONFIGURED', body: null };
    }
    if (!hasAuth_()) {
      return { ok: false, code: 0, error: 'AUTH_REQUIRED', body: null };
    }
    return HiEnergyMcp.callTool(name, args || {});
  }

  return {
    hasAuth: hasAuth_,
    hasApiKey: hasApiKey_,
    saveCredentials: saveCredentials_,
    clearCredentials: clearCredentials_,
    getApiBase: apiBase_,
    getMcpUrl: HiEnergyMcp.getMcpUrl,
    search: search_,
    advertiserByDomain: advertiserByDomain_,
    advertiser: advertiser_,
    deals: deals_,
    transactions: transactions_,
    listMcpTools: listMcpTools_,
    callMcpTool: callMcpTool_
  };
})();
