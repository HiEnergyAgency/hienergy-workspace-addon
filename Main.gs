function onHomepage() {
  return ensureAuthenticatedHome_();
}

function onSettings() {
  return HiEnergyCards.settings();
}

function handleSignIn() {
  HiEnergyAuth.requireAuthorization();
}

function onSearchAction(e) {
  ensureAuthenticated_();
  var query = e && e.parameters ? String(e.parameters.query || '').trim() : '';
  if (query) {
    return HiEnergyCards.searchResults(query, HiEnergyApi.search(query));
  }
  return HiEnergyCards.search();
}

function handleSaveApiKeySettings(e) {
  var form = (e && e.formInput) || {};
  var apiKey = String(form.apiKey || '').trim();
  var apiBase = String(form.apiBase || '').trim();

  if (apiKey) {
    HiEnergyApi.saveCredentials(apiKey, apiBase || HiEnergyConfig.defaultApiBase);
  } else if (apiBase) {
    var props = PropertiesService.getUserProperties();
    props.setProperty(HiEnergyConfig.propApiBase, apiBase.replace(/\/$/, ''));
  }

  return HiEnergyCards.settings();
}

function handleRemoveApiKeySettings() {
  HiEnergyApi.clearCredentials();
  return HiEnergyCards.settings();
}

function handleDisconnectSettings() {
  HiEnergyAuth.reset();
  HiEnergyApi.clearCredentials();
  return HiEnergyCards.connect();
}

function handleSearch(e) {
  var form = (e && e.formInput) || {};
  var query = String(form.query || '').trim();
  var scope = String(form.scope || 'all');

  if (!query) {
    return HiEnergyCards.error('Missing query', 'Enter a brand, domain, or deal keyword to search.');
  }

  if (scope === 'contacts') {
    return HiEnergyCards.contacts(query, HiEnergyContacts.search(query));
  }

  if (scope === 'messages') {
    return HiEnergyCards.messages('Search: ' + query, HiEnergyGmail.searchMessages(query));
  }

  ensureAuthenticated_();

  if (scope === 'transactions') {
    var txnResult = HiEnergyApi.transactions({ q: query });
    return HiEnergyCards.transactions('Search: ' + query, txnResult);
  }

  if (scope === 'deals') {
    var dealsResult = HiEnergyApi.deals(query);
    return HiEnergyCards.deals('Search: ' + query, dealsResult);
  }

  var types = scope === 'advertisers' ? ['advertisers'] : null;
  var result = HiEnergyApi.search(query, types);
  return HiEnergyCards.searchResults(query, result);
}

function handleOpenAdvertiser(e) {
  ensureAuthenticated_();
  var id = e && e.parameters ? e.parameters.id : '';
  if (!id) {
    return HiEnergyCards.error('Missing advertiser', 'No advertiser id was provided.');
  }
  return HiEnergyCards.advertiser(HiEnergyApi.advertiser(id));
}

function handleDomainLookup(e) {
  ensureAuthenticated_();
  var domain = e && e.parameters ? e.parameters.domain : '';
  if (!domain) {
    return HiEnergyCards.error('Missing domain', 'Could not read a domain from the message.');
  }

  var result = HiEnergyApi.advertiserByDomain(domain);
  if (!result.ok) {
    return HiEnergyCards.advertiser(result);
  }

  var body = result.body || {};
  var rows = body.data || [];
  if (!rows.length) {
    return HiEnergyCards.error('No advertiser', 'No Hi Energy advertiser matched domain <b>' + domain + '</b>.');
  }

  if (rows.length === 1) {
    var slug = rows[0].attributes && (rows[0].attributes.slug || rows[0].id);
    return HiEnergyCards.advertiser(HiEnergyApi.advertiser(slug || rows[0].id));
  }

  return HiEnergyCards.searchResults(domain, {
    ok: true,
    body: {
      results: {
        advertisers: {
          data: rows,
          total: rows.length
        }
      }
    }
  });
}

function handleAdvertiserDeals(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var name = params.name || 'Advertiser';
  var id = params.id || '';
  return HiEnergyCards.deals(name, HiEnergyApi.deals(id));
}

function handleAdvertiserTransactions(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var name = params.name || 'Advertiser';
  var id = params.id || '';
  return HiEnergyCards.transactions(name, HiEnergyApi.transactions({ advertiserId: id }));
}

function handleViewThread(e) {
  var params = (e && e.parameters) || {};
  var messageId = params.messageId || '';
  if (!messageId) {
    return HiEnergyCards.error('Missing message', 'No message id was provided.');
  }
  return HiEnergyCards.messages('Thread', HiEnergyGmail.getThreadMessages(messageId));
}

function handleViewDomainMessages(e) {
  var params = (e && e.parameters) || {};
  var domain = params.domain || '';
  if (!domain) {
    return HiEnergyCards.error('Missing domain', 'No domain was provided.');
  }
  return HiEnergyCards.messages('Messages from ' + domain, HiEnergyGmail.searchByDomain(domain));
}

function handleLookupContact(e) {
  var params = (e && e.parameters) || {};
  var email = params.email || '';
  if (!email) {
    return HiEnergyCards.error('Missing email', 'No email address was provided.');
  }
  return HiEnergyCards.contactLookup(email, HiEnergyContacts.lookupByEmail(email));
}

function onMcpTools() {
  ensureAuthenticated_();
  return HiEnergyCards.mcpTools(HiEnergyApi.listMcpTools());
}

function handleMcpToolPrompt(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var toolName = params.tool || '';
  if (!toolName) {
    return HiEnergyCards.error('Missing tool', 'No MCP tool was selected.');
  }
  return HiEnergyCards.mcpToolPrompt(toolName, params.description || '');
}

function handleMcpToolCall(e) {
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var params = (e && e.parameters) || {};
  var toolName = params.tool || '';
  var query = String(form.query || '').trim();

  if (!toolName) {
    return HiEnergyCards.error('Missing tool', 'No MCP tool was selected.');
  }

  var args = buildMcpToolArgs_(toolName, query, params);
  return HiEnergyCards.mcpToolResult(toolName, query, HiEnergyApi.callMcpTool(toolName, args));
}

function buildMcpToolArgs_(toolName, query, params) {
  if (toolName === 'search_advertisers_by_domain' || toolName === 'search_domains') {
    return { domain: query || params.domain || '' };
  }
  if (toolName === 'get_advertiser') {
    return { id: query || params.id || '' };
  }
  if (toolName === 'get_advertiser_contacts') {
    return { advertiser: query || params.advertiser || '' };
  }
  if (toolName === 'recommend_report') {
    return { goal: query || params.goal || '' };
  }
  if (toolName === 'search_deals' || toolName === 'search_transactions' || toolName === 'search_users') {
    return { q: query, limit: HiEnergyConfig.perTypeLimit };
  }
  if (toolName === 'universal_search') {
    return { q: query, per_type_limit: HiEnergyConfig.perTypeLimit };
  }
  if (toolName === 'search_advertisers') {
    return { name: query, limit: HiEnergyConfig.perTypeLimit };
  }
  return { q: query };
}

function onGmailMessageOpen(e) {
  var context = HiEnergyGmail.getContextFromEvent(e);
  if (!context || !context.domain) {
    return HiEnergyApi.hasAuth() ? HiEnergyCards.search() : HiEnergyCards.connect();
  }

  var contactResult = context.senderEmail
    ? HiEnergyContacts.lookupByEmail(context.senderEmail)
    : { ok: true, contact: null };

  var messagesResult = HiEnergyGmail.searchByDomain(context.domain, 3);

  return HiEnergyCards.gmailContext(context, contactResult, messagesResult);
}

function ensureAuthenticatedHome_() {
  if (!HiEnergyAuth.isConfigured() && !HiEnergyApi.hasApiKey()) {
    return HiEnergyCards.connect();
  }
  if (!HiEnergyApi.hasAuth()) {
    return HiEnergyCards.connect();
  }
  return HiEnergyCards.search();
}

function ensureAuthenticated_() {
  if (HiEnergyApi.hasAuth()) {
    return;
  }
  if (HiEnergyAuth.isConfigured()) {
    HiEnergyAuth.requireAuthorization();
  }
}
