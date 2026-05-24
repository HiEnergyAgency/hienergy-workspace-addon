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
    var trimmedKey = String(apiKey || '').trim();
    if (trimmedKey) {
      props.setProperty(HiEnergyConfig.propApiKey, trimmedKey);
    }
    if (apiBase) {
      props.setProperty(HiEnergyConfig.propApiBase, String(apiBase).replace(/\/$/, ''));
    }
    HiEnergyMcp.resetSession();
  }

  function saveApiBase_(apiBase) {
    var props = userProps_();
    var trimmed = String(apiBase || '').trim();
    if (!trimmed) {
      props.deleteProperty(HiEnergyConfig.propApiBase);
    } else {
      props.setProperty(HiEnergyConfig.propApiBase, trimmed.replace(/\/$/, ''));
    }
    HiEnergyMcp.resetSession();
  }

  function saveMcpUrl_(mcpUrl) {
    var props = userProps_();
    var trimmed = String(mcpUrl || '').trim();
    if (!trimmed) {
      props.deleteProperty(HiEnergyConfig.propMcpUrl);
    } else {
      props.setProperty(HiEnergyConfig.propMcpUrl, trimmed.replace(/\/$/, ''));
    }
    HiEnergyMcp.resetSession();
  }

  function clearApiKey_() {
    userProps_().deleteProperty(HiEnergyConfig.propApiKey);
    HiEnergyMcp.resetSession();
  }

  function clearCredentials_() {
    var props = userProps_();
    props.deleteProperty(HiEnergyConfig.propApiKey);
    props.deleteProperty(HiEnergyConfig.propApiBase);
    HiEnergyMcp.resetSession();
  }

  function maskedApiKey_() {
    var key = apiKey_();
    if (!key) {
      return '';
    }
    if (key.length <= 6) {
      return '••••' + key.slice(-2);
    }
    return '••••' + key.slice(-4);
  }

  function authMode_() {
    if (HiEnergyAuth && HiEnergyAuth.hasAccess && HiEnergyAuth.hasAccess()) {
      return 'auth0';
    }
    if (hasApiKey_()) {
      return 'api_key';
    }
    return 'none';
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

  function normalizeRecord_(record) {
    if (!record || typeof record !== 'object') {
      return null;
    }
    if (record.attributes && typeof record.attributes === 'object') {
      return record;
    }
    var attrs = {};
    Object.keys(record).forEach(function (key) {
      if (key !== 'id' && key !== 'type') {
        attrs[key] = record[key];
      }
    });
    return {
      id: record.id,
      type: record.type,
      attributes: attrs
    };
  }

  function normalizeSearchBucket_(bucket) {
    if (!bucket || typeof bucket !== 'object') {
      return bucket;
    }
    var rows = bucket.data;
    if (!Array.isArray(rows)) {
      return bucket;
    }
    return Object.assign({}, bucket, {
      data: rows
        .map(normalizeRecord_)
        .filter(function (row) {
          return row !== null;
        })
    });
  }

  function normalizeSearchBody_(body) {
    if (!body || typeof body !== 'object') {
      return { results: {} };
    }
    var container = body;
    if (body.data && body.data.results) {
      container = body.data;
    } else if (body.structuredContent && body.structuredContent.results) {
      container = body.structuredContent;
    }
    var results = (container && container.results) || {};
    var normalized = {};
    Object.keys(results).forEach(function (type) {
      normalized[type] = normalizeSearchBucket_(results[type]);
    });
    return { results: normalized };
  }

  function extractSearchResults_(body) {
    if (!body || typeof body !== 'object') {
      return null;
    }
    if (body.results) {
      return body.results;
    }
    if (body.data && body.data.results) {
      return body.data.results;
    }
    if (body.structuredContent && body.structuredContent.results) {
      return body.structuredContent.results;
    }
    return null;
  }

  function isValidSearchBody_(body) {
    var results = extractSearchResults_(body);
    if (!results || typeof results !== 'object') {
      return false;
    }
    return Object.keys(results).some(function (type) {
      var bucket = results[type];
      var rows = bucket && bucket.data;
      return Array.isArray(rows) && rows.length > 0;
    });
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

  function searchAdvertisers_(query, limit, page) {
    var rowLimit = limit || HiEnergyConfig.advertiserSearchLimit;
    var normalized = String(query || '').trim();
    if (!normalized) {
      return { ok: false, error: 'MISSING_QUERY', message: 'Enter an advertiser name to search.' };
    }

    var toolArgs = cleanArgs_({
      name: normalized,
      limit: rowLimit,
      page: page || null
    });
    var restQuery = cleanArgs_({
      name: normalized,
      limit: rowLimit,
      page: page || null
    });

    return withToolFallback_('search_advertisers', toolArgs, '/advertisers', { query: restQuery });
  }

  function deals_(query, limit, page) {
    var rowLimit = limit || HiEnergyConfig.perTypeLimit;
    var normalized = String(query || '').trim();
    if (!normalized) {
      return { ok: false, error: 'MISSING_QUERY', message: 'Enter a deal keyword to search.' };
    }

    var toolArgs = cleanArgs_({
      q: normalized,
      limit: rowLimit,
      page: page || null
    });
    var restQuery = cleanArgs_({
      q: normalized,
      limit: rowLimit,
      page: page || null
    });

    return withToolFallback_('search_deals', toolArgs, '/deals', { query: restQuery });
  }

  function searchDeals_(query, limit, page) {
    return deals_(query, limit || HiEnergyConfig.sheetRowLimit, page || null);
  }

  function transactions_(query, limit) {
    var rowLimit = limit || HiEnergyConfig.perTypeLimit;
    var options = typeof query === 'object' && query !== null ? query : { q: query };
    var toolArgs = cleanArgs_({
      days: options.days || 30,
      sort: options.sort || 'commission_desc',
      limit: rowLimit,
      page: options.page || null,
      advertiser_id: options.advertiserId,
      q: options.q
    });
    var restQuery = cleanArgs_({
      days: options.days || 30,
      sort: options.sort || 'commission_desc',
      limit: rowLimit,
      page: options.page || null,
      advertiser_id: options.advertiserId || null,
      q: options.q || null
    });

    return withToolFallback_('search_transactions', toolArgs, '/transactions', { query: restQuery });
  }

  function searchTransactions_(query, limit, days) {
    var options =
      typeof query === 'object' && query !== null
        ? query
        : {
            q: query,
            days: days || 30,
            limit: limit || HiEnergyConfig.sheetRowLimit
          };
    if (limit && !options.limit) {
      options.limit = limit;
    }
    return transactions_(options, options.limit || HiEnergyConfig.sheetRowLimit);
  }

  function advertiserContacts_(advertiser, page, limit) {
    var normalized = String(advertiser || '').trim();
    if (!normalized) {
      return {
        ok: false,
        error: 'MISSING_ADVERTISER',
        message: 'Enter an advertiser id or slug for contacts.'
      };
    }

    var toolArgs = cleanArgs_({
      advertiser: normalized,
      page: page || null,
      limit: limit || null
    });
    var restQuery = cleanArgs_({
      advertiser: normalized,
      page: page || null,
      limit: limit || null
    });

    return withToolFallback_(
      'get_advertiser_contacts',
      toolArgs,
      '/advertisers/' + encodeURIComponent(normalized) + '/contacts',
      { query: restQuery }
    );
  }

  function legacyDeals_(query) {
    return deals_(query, HiEnergyConfig.perTypeLimit);
  }

  function legacyTransactions_(query) {
    return transactions_(query, HiEnergyConfig.perTypeLimit);
  }

  function getMcpUrl_() {
    if (typeof HiEnergyMcp !== 'undefined' && HiEnergyMcp.getMcpUrl) {
      return HiEnergyMcp.getMcpUrl();
    }
    var userUrl = userProps_().getProperty(HiEnergyConfig.propMcpUrl);
    if (userUrl) {
      return String(userUrl).replace(/\/$/, '');
    }
    var scriptUrl = PropertiesService.getScriptProperties().getProperty(HiEnergyConfig.propMcpUrl);
    if (scriptUrl) {
      return String(scriptUrl).replace(/\/$/, '');
    }
    return HiEnergyConfig.defaultMcpUrl;
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
    maskedApiKey: maskedApiKey_,
    authMode: authMode_,
    saveCredentials: saveCredentials_,
    saveApiBase: saveApiBase_,
    saveMcpUrl: saveMcpUrl_,
    clearApiKey: clearApiKey_,
    clearCredentials: clearCredentials_,
    getApiBase: apiBase_,
    getMcpUrl: getMcpUrl_,
    search: search_,
    universalSearch: universalSearch_,
    advertiserByDomain: advertiserByDomain_,
    advertiser: advertiser_,
    searchAdvertisers: searchAdvertisers_,
    searchDeals: searchDeals_,
    searchTransactions: searchTransactions_,
    advertiserContacts: advertiserContacts_,
    deals: legacyDeals_,
    transactions: legacyTransactions_,
    listMcpTools: listMcpTools_,
    callMcpTool: callMcpTool_
  };
})();
