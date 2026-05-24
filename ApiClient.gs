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

  function cleanArgs_(args) {
    var cleaned = {};
    Object.keys(args || {}).forEach(function (key) {
      var value = args[key];
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }

  function normalizeSearchBody_(body) {
    if (!body || typeof body !== 'object') {
      return { results: {} };
    }
    if (body.results) {
      return body;
    }
    if (body.data && body.data.results) {
      return body.data;
    }
    if (body.structuredContent && body.structuredContent.results) {
      return body.structuredContent;
    }
    return body;
  }

  function isValidSearchBody_(body) {
    var normalized = normalizeSearchBody_(body);
    return Boolean(normalized && typeof normalized.results === 'object');
  }

  function withToolFallback_(toolName, toolArgs, path, options) {
    var result = HiEnergyMcp.callTool(toolName, toolArgs);
    if (result.ok) {
      return result;
    }
    return request_(path, options);
  }

  function universalSearch_(query, types) {
    var typesValue = types && types.length ? types.join(',') : null;
    var toolArgs = cleanArgs_({
      q: query,
      per_type_limit: HiEnergyConfig.perTypeLimit,
      types: typesValue
    });
    var restQuery = cleanArgs_({
      q: query,
      per_type_limit: HiEnergyConfig.perTypeLimit,
      types: typesValue
    });

    var result = HiEnergyMcp.callTool('universal_search', toolArgs);
    if (result.ok && isValidSearchBody_(result.body)) {
      return {
        ok: true,
        code: result.code,
        body: normalizeSearchBody_(result.body),
        error: null
      };
    }

    var fallback = request_('/search', { query: restQuery });
    if (fallback.ok) {
      fallback.body = normalizeSearchBody_(fallback.body);
    }
    return fallback;
  }

  function search_(query, types) {
    return universalSearch_(query, types);
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
    var result = HiEnergyMcp.callTool(name, args || {});
    if (result.ok && name === 'universal_search') {
      result.body = normalizeSearchBody_(result.body);
    }
    return result;
  }

  return {
    hasAuth: hasAuth_,
    hasApiKey: hasApiKey_,
    saveCredentials: saveCredentials_,
    clearCredentials: clearCredentials_,
    getApiBase: apiBase_,
    getMcpUrl: HiEnergyMcp.getMcpUrl,
    search: search_,
    universalSearch: universalSearch_,
    advertiserByDomain: advertiserByDomain_,
    advertiser: advertiser_,
    deals: deals_,
    transactions: transactions_,
    listMcpTools: listMcpTools_,
    callMcpTool: callMcpTool_
  };
})();
