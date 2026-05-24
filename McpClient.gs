var HiEnergyMcp = (function () {
  var INIT_CACHE_KEY = 'hienergy_mcp_initialized';
  var INIT_CACHE_TTL = 1800;
  var requestCounter_ = 0;

  function userProps_() {
    return PropertiesService.getUserProperties();
  }

  function scriptProps_() {
    return PropertiesService.getScriptProperties();
  }

  function mcpUrl_() {
    var userUrl = userProps_().getProperty(HiEnergyConfig.propMcpUrl);
    if (userUrl) {
      return String(userUrl).replace(/\/$/, '');
    }
    var scriptUrl = scriptProps_().getProperty(HiEnergyConfig.propMcpUrl);
    if (scriptUrl) {
      return String(scriptUrl).replace(/\/$/, '');
    }
    return HiEnergyConfig.defaultMcpUrl;
  }

  function authHeaders_() {
    if (HiEnergyAuth.hasAccess()) {
      var token = HiEnergyAuth.getAccessToken();
      if (token) {
        return { Authorization: 'Bearer ' + token };
      }
    }

    var key = userProps_().getProperty(HiEnergyConfig.propApiKey);
    if (key) {
      return { 'X-Api-Key': key };
    }

    return null;
  }

  function nextId_() {
    requestCounter_ += 1;
    return requestCounter_;
  }

  function parseContent_(content) {
    if (!content || !content.length) {
      return null;
    }

    for (var i = 0; i < content.length; i++) {
      var item = content[i];
      if (!item || !item.text) {
        continue;
      }
      try {
        return JSON.parse(item.text);
      } catch (err) {
        return { text: item.text };
      }
    }

    return null;
  }

  function extractBody_(result) {
    if (!result) {
      return null;
    }
    if (result.structuredContent !== undefined && result.structuredContent !== null) {
      return result.structuredContent;
    }
    var parsed = parseContent_(result.content);
    if (parsed !== null) {
      return parsed;
    }
    return result;
  }

  function extractErrorMessage_(result) {
    var body = extractBody_(result);
    if (body && (body.message || body.error)) {
      return body.message || body.error;
    }
    if (result && result.message) {
      return result.message;
    }
    return 'MCP tool call failed.';
  }

  function normalizeRpcResult_(payload, httpCode) {
    if (httpCode === 401) {
      if (HiEnergyAuth.hasAccess()) {
        HiEnergyAuth.reset();
      }
      return {
        ok: false,
        code: httpCode,
        body: payload,
        error: 'API_UNAUTHORIZED',
        message: HiEnergyConfig.brandName + ' rejected this sign-in.'
      };
    }

    if (httpCode === 429) {
      return {
        ok: false,
        code: httpCode,
        body: payload,
        error: 'API_RATE_LIMITED',
        message: 'Too many requests. Wait a minute and try again.'
      };
    }

    if (!payload || typeof payload !== 'object') {
      return {
        ok: false,
        code: httpCode,
        body: payload,
        error: 'MCP_ERROR',
        message: 'Unexpected MCP response.'
      };
    }

    if (payload.error) {
      return {
        ok: false,
        code: httpCode,
        body: payload.error,
        error: 'MCP_ERROR',
        message: payload.error.message || 'MCP request failed.'
      };
    }

    var result = payload.result || {};
    if (result.isError) {
      return {
        ok: false,
        code: httpCode,
        body: extractBody_(result),
        error: 'MCP_TOOL_ERROR',
        message: extractErrorMessage_(result)
      };
    }

    return {
      ok: true,
      code: httpCode,
      body: extractBody_(result),
      error: null
    };
  }

  function fetchWithRetry_(url, fetchOptions, maxAttempts) {
    maxAttempts = maxAttempts || 3;
    var lastError = null;
    for (var attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        var response = UrlFetchApp.fetch(url, fetchOptions);
        var code = response.getResponseCode();
        if (code >= 500 || code === 429) {
          if (attempt < maxAttempts) {
            Utilities.sleep(Math.min(2000, 250 * Math.pow(2, attempt - 1)));
            continue;
          }
        }
        return response;
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          Utilities.sleep(Math.min(2000, 250 * Math.pow(2, attempt - 1)));
          continue;
        }
      }
    }
    if (lastError) {
      throw lastError;
    }
    return null;
  }

  function rpc_(method, params) {
    var headers = authHeaders_();
    if (!headers) {
      return { ok: false, code: 0, error: 'AUTH_REQUIRED', body: null };
    }

    var payload = {
      jsonrpc: '2.0',
      id: nextId_(),
      method: method,
      params: params || {}
    };

    var fetchOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: Object.assign(
        {
          Accept: 'application/json',
          'MCP-Protocol-Version': HiEnergyConfig.mcpProtocolVersion
        },
        headers
      ),
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response;
    try {
      response = fetchWithRetry_(mcpUrl_(), fetchOptions, 3);
    } catch (err) {
      return {
        ok: false,
        code: 0,
        error: 'NETWORK_ERROR',
        message: 'Network error contacting MCP server: ' + err,
        body: null
      };
    }

    var httpCode = response.getResponseCode();
    var text = response.getContentText() || '';
    var parsed = null;

    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        parsed = { raw: text };
      }
    }

    if (httpCode >= 200 && httpCode < 300) {
      return normalizeRpcResult_(parsed, httpCode);
    }

    var message = (parsed && parsed.error && parsed.error.message) ||
      (parsed && (parsed.message || parsed.error)) ||
      text ||
      ('HTTP ' + httpCode);

    if (httpCode === 401) {
      if (HiEnergyAuth.hasAccess()) {
        HiEnergyAuth.reset();
      }
      return { ok: false, code: httpCode, body: parsed, error: 'API_UNAUTHORIZED', message: message };
    }

    return { ok: false, code: httpCode, body: parsed, error: 'MCP_ERROR', message: message };
  }

  function ensureInitialized_() {
    var cache = CacheService.getUserCache();
    if (cache.get(INIT_CACHE_KEY)) {
      return;
    }

    var result = rpc_('initialize', {
      protocolVersion: HiEnergyConfig.mcpProtocolVersion,
      capabilities: {},
      clientInfo: {
        name: HiEnergyConfig.mcpClientName,
        version: HiEnergyConfig.mcpClientVersion
      }
    });

    if (result.ok) {
      cache.put(INIT_CACHE_KEY, '1', INIT_CACHE_TTL);
    }
  }

  function callTool_(name, args) {
    ensureInitialized_();
    var cleaned = {};
    Object.keys(args || {}).forEach(function (key) {
      var value = args[key];
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return rpc_('tools/call', {
      name: name,
      arguments: cleaned
    });
  }

  function listTools_() {
    ensureInitialized_();
    return rpc_('tools/list');
  }

  function apiRequest_(path, method, query, body) {
    var args = {
      path: path,
      method: method || 'GET'
    };

    if (query && Object.keys(query).length) {
      args.query = query;
    }
    if (body) {
      args.body = body;
    }

    return callTool_('api_request', args);
  }

  function resetSession_() {
    CacheService.getUserCache().remove(INIT_CACHE_KEY);
  }

  return {
    getMcpUrl: mcpUrl_,
    callTool: callTool_,
    listTools: listTools_,
    apiRequest: apiRequest_,
    resetSession: resetSession_
  };
})();
