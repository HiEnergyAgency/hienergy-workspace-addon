function onHomepage(e) {
  return ensureAuthenticatedHome_(e);
}

function openUrlAction_(e) {
  var url = (e && e.parameters && e.parameters.url) || '';
  if (!url) {
    return CardService.newActionResponseBuilder().build();
  }
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink().setUrl(url))
    .build();
}

function hostAppFromEvent_(e) {
  var common = e && e.commonEventObject;
  if (common && common.hostApp) {
    return String(common.hostApp);
  }
  var params = e && e.parameters;
  if (params && params.hostApp) {
    return String(params.hostApp);
  }
  return '';
}

function inferHostFromContext_() {
  try {
    if (SpreadsheetApp.getActiveSpreadsheet()) {
      return 'SHEETS';
    }
  } catch (err) {
    // Not in a spreadsheet context.
  }
  return '';
}

function resolveHostApp_(e) {
  var fromEvent = hostAppFromEvent_(e);
  if (fromEvent) {
    PropertiesService.getUserProperties().setProperty(HiEnergyConfig.propHostApp, fromEvent);
    return fromEvent;
  }
  var inferred = inferHostFromContext_();
  if (inferred) {
    PropertiesService.getUserProperties().setProperty(HiEnergyConfig.propHostApp, inferred);
    return inferred;
  }
  return PropertiesService.getUserProperties().getProperty(HiEnergyConfig.propHostApp) || '';
}

function isGmailHost_(hostApp) {
  return hostApp === 'GMAIL';
}

function isSheetsHost_(hostApp) {
  return hostApp === 'SHEETS';
}

function isSlidesHost_(hostApp) {
  return hostApp === 'SLIDES';
}

function isDocsHost_(hostApp) {
  return hostApp === 'DOCS';
}

function onSettings() {
  return HiEnergyCards.settings();
}

function handleSignIn() {
  HiEnergyAuth.requireAuthorization();
}

function onSearchAction(e) {
  ensureAuthenticated_();
  var hostApp = resolveHostApp_(e);
  var query = e && e.parameters ? String(e.parameters.query || '').trim() : '';
  if (query) {
    var result = HiEnergyApi.universalSearch(query);
    if (result.ok) {
      HiEnergyMcpExport.cacheSearchResult(query, 'all', result);
    }
    return HiEnergyCards.searchResults(query, result);
  }
  return HiEnergyCards.search(null, { hostApp: hostApp });
}

function handleSaveApiKeySettings(e) {
  var form = (e && e.formInput) || {};
  var apiKey = String(form.apiKey || '').trim();

  if (!apiKey) {
    return HiEnergyCards.error(
      'No API key entered',
      'Paste your Hi Energy AI API key in the field, then click Save again.'
    );
  }

  HiEnergyApi.saveCredentials(apiKey);
  return HiEnergyApi.hasAuth() ? HiEnergyCards.search() : HiEnergyCards.settings();
}

function handleRemoveApiKeySettings() {
  HiEnergyApi.clearApiKey();
  return HiEnergyCards.settings();
}

function handleSignOutAuth0() {
  HiEnergyAuth.reset();
  return HiEnergyCards.settings();
}

function handleSaveBackendUrls(e) {
  var form = (e && e.formInput) || {};
  var apiBase = String(form.apiBase || '').trim();
  var mcpUrl = String(form.mcpUrl || '').trim();

  if (apiBase) {
    HiEnergyApi.saveApiBase(apiBase);
  }
  if (mcpUrl) {
    HiEnergyApi.saveMcpUrl(mcpUrl);
  }

  return HiEnergyCards.settings();
}

function handleResetBackendUrls() {
  HiEnergyApi.saveApiBase('');
  HiEnergyApi.saveMcpUrl('');
  return HiEnergyCards.settings();
}

function handleDisconnectSettings() {
  HiEnergyAuth.reset();
  HiEnergyApi.clearCredentials();
  return HiEnergyCards.connect();
}

function handleSearch(e) {
  var form = (e && e.formInput) || {};
  var params = (e && e.parameters) || {};
  var query = String(form.query || params.query || '').trim();
  var scope = String(form.scope || params.scope || 'all');
  var hostApp = resolveHostApp_(e);
  var resultOptions = { hostApp: hostApp };

  if (!query) {
    return HiEnergyCards.error('Missing query', 'Enter a brand, domain, or deal keyword to search.');
  }

  if (scope === 'contacts') {
    var contactsResult = HiEnergyContacts.search(query);
    return HiEnergyCards.contacts(query, contactsResult);
  }

  if (scope === 'messages') {
    var hostApp = resolveHostApp_(e);
    if (hostApp && !isGmailHost_(hostApp)) {
      return HiEnergyCards.error(
        'Gmail only',
        'Message search runs in Gmail. In Sheets, Docs, Drive, or Calendar use advertiser, deal, or transaction search.'
      );
    }
    return HiEnergyCards.messages('Search: ' + query, HiEnergyGmail.searchMessages(query));
  }

  ensureAuthenticated_();

  if (scope === 'advertisers') {
    var advertiserResult = HiEnergyApi.searchAdvertisers(query, HiEnergyConfig.interactiveSearchLimit);
    if (advertiserResult.ok) {
      HiEnergyMcpExport.cacheAdvertiserSearch(query, 'name', advertiserResult);
      var rows = (advertiserResult.body && advertiserResult.body.data) || [];
      return HiEnergyCards.searchResults(
        query,
        {
          ok: true,
          body: {
            results: {
              advertisers: {
                data: rows,
                total: rows.length
              }
            }
          }
        },
        Object.assign({ exportType: 'advertisers' }, resultOptions)
      );
    }
    return HiEnergyCards.searchResults(
      query,
      advertiserResult,
      Object.assign({ exportType: 'advertisers' }, resultOptions)
    );
  }

  if (scope === 'deals') {
    var dealsResult = HiEnergyApi.searchDeals(query, HiEnergyConfig.interactiveSearchLimit);
    if (dealsResult.ok) {
      HiEnergyMcpExport.cacheDealsSearch(query, dealsResult);
    }
    return HiEnergyCards.deals(query, dealsResult, 'deals');
  }

  if (scope === 'transactions') {
    var transactionsResult = HiEnergyApi.searchTransactions({
      q: query,
      days: 30,
      limit: HiEnergyConfig.interactiveSearchLimit
    });
    if (transactionsResult.ok) {
      HiEnergyMcpExport.cacheTransactionsSearch(query, transactionsResult, { days: 30 });
    }
    return HiEnergyCards.transactions(query, transactionsResult, 'transactions');
  }

  var typesByScope = {
    deals: ['deals'],
    transactions: ['transactions']
  };
  var types = typesByScope[scope] || null;
  var result = HiEnergyApi.universalSearch(query, types);
  if (result.ok) {
    HiEnergyMcpExport.cacheSearchResult(query, scope, result);
  }
  return HiEnergyCards.searchResults(query, result, resultOptions);
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

  HiEnergyMcpExport.cacheAdvertiserSearch(domain, 'domain', result);

  var body = result.body || {};
  var rows = body.data || [];
  if (!rows.length) {
    return HiEnergyCards.error('No advertiser', 'No ' + HiEnergyConfig.brandName + ' advertiser matched domain <b>' + domain + '</b>.');
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
  }, { exportType: 'advertisers' });
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

function onReports() {
  ensureAuthenticated_();
  return HiEnergyCards.reports(HiEnergyApi.listMcpTools());
}

function handleRunAndExportMcpTool(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var form = (e && e.formInput) || {};
  var toolName = params.tool || '';
  if (!toolName) {
    return HiEnergyCards.error('Missing tool', 'No MCP tool was selected.');
  }
  var query = String(form.query || params.query || '').trim();
  var args = buildMcpToolArgs_(toolName, query, params);
  var result = HiEnergyApi.callMcpTool(toolName, args);
  if (!result.ok) {
    return HiEnergyCards.apiError(result);
  }
  HiEnergyMcpExport.cacheMcpToolResult(toolName, query, result);
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.createFromMcpToolResult(toolName, query, result.body));
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
  var result = HiEnergyApi.callMcpTool(toolName, args);
  if (result.ok) {
    HiEnergyMcpExport.cacheMcpToolResult(toolName, query, result);
    if (toolName === 'universal_search') {
      HiEnergyMcpExport.cacheSearchResult(query, params.types || 'all', result);
    }
    if (toolName === 'search_advertisers') {
      HiEnergyMcpExport.cacheAdvertiserSearch(query, 'name', result);
    }
    if (toolName === 'search_advertisers_by_domain' || toolName === 'search_domains') {
      HiEnergyMcpExport.cacheAdvertiserSearch(query || params.domain || '', 'domain', result);
    }
    if (toolName === 'search_deals') {
      HiEnergyMcpExport.cacheDealsSearch(query, result);
    }
    if (toolName === 'search_transactions') {
      HiEnergyMcpExport.cacheTransactionsSearch(query, result, { days: 30 });
    }
    if (toolName === 'get_advertiser_contacts') {
      HiEnergyMcpExport.cacheAdvertiserContactsSearch(query || params.advertiser || '', result);
    }
  }
  return HiEnergyCards.mcpToolResult(toolName, query, result);
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
    return cleanUniversalSearchArgs_(query, params);
  }
  if (toolName === 'search_advertisers') {
    return { name: query, limit: HiEnergyConfig.perTypeLimit };
  }
  return { q: query };
}

function cleanUniversalSearchArgs_(query, params) {
  var args = {
    q: query,
    per_type_limit: HiEnergyConfig.perTypeLimit
  };
  if (params.types) {
    args.types = params.types;
  }
  return args;
}

function onGmailMessageOpen(e) {
  var context = HiEnergyGmail.getContextFromEvent(e);
  if (!context || !context.domain) {
    return HiEnergyApi.hasAuth()
      ? HiEnergyCards.search(null, { hostApp: 'GMAIL' })
      : HiEnergyCards.connect();
  }

  var contactResult = context.senderEmail
    ? HiEnergyContacts.lookupByEmail(context.senderEmail)
    : { ok: true, contact: null };

  var messagesResult = HiEnergyGmail.searchByDomain(context.domain, 3);

  return HiEnergyCards.gmailContext(context, contactResult, messagesResult);
}

function ensureAuthenticatedHome_(e) {
  if (!HiEnergyAuth.isConfigured() && !HiEnergyApi.hasApiKey()) {
    return HiEnergyCards.connect();
  }
  if (!HiEnergyApi.hasAuth()) {
    return HiEnergyCards.connect();
  }
  return HiEnergyCards.search(null, { hostApp: resolveHostApp_(e) });
}

function ensureAuthenticated_() {
  if (HiEnergyApi.hasAuth()) {
    return;
  }
  if (HiEnergyAuth.isConfigured()) {
    HiEnergyAuth.requireAuthorization();
  }
}

function onCreateSheetAction(e) {
  var params = (e && e.parameters) || {};
  return HiEnergyCards.createSheet({
    hostApp: resolveHostApp_(e),
    exportType: params.exportType || '',
    query: params.query || ''
  });
}

function handleCreateSheet(e) {
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var type = String(form.exportType || 'advertisers');
  var query = String(form.query || '').trim();
  var searchMode = String(form.searchMode || 'name');
  var days = String(form.transactionDays || '30');

  var needsQuery = type !== 'transactions';
  if (needsQuery && !query) {
    return HiEnergyCards.error(
      'Add a search term',
      'Enter a brand, domain, or keyword above, then click Create sheet.'
    );
  }

  if (type === 'advertisers') {
    return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportAdvertisers(query, searchMode));
  }
  if (type === 'deals') {
    return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportDeals(query));
  }
  if (type === 'transactions') {
    var advertiserFilter = String(form.transactionAdvertiserId || '').trim();
    return HiEnergyCards.sheetResultResponse(
      HiEnergySheets.exportTransactions(query, days, advertiserFilter)
    );
  }
  if (type === 'contacts' || type === 'advertiser_contacts') {
    return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportAdvertiserContacts(query));
  }
  if (type === 'google_contacts') {
    return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportGoogleContacts(query));
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportSearch(query, 'all', searchMode));
}

function handleCreateSheetFromSearch(e) {
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var query = String(form.query || '').trim();
  var scope = String(form.scope || 'all');
  var searchMode = String(form.searchMode || 'name');

  if (!query) {
    return HiEnergyCards.error('Missing query', 'Enter a search query to fetch MCP data for the sheet.');
  }

  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportSearch(query, scope, searchMode));
}

function handleCreateAdvertiserSheet(e) {
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var query = String(form.query || form.advertiserQuery || '').trim();
  var searchMode = String(form.advertiserSearchMode || form.searchMode || 'name');

  if (!query) {
    return HiEnergyCards.error('Missing query', 'Enter an advertiser name or domain to search.');
  }

  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportAdvertisers(query, searchMode));
}

function handleExportCachedAdvertisersToSheet(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var query = String(params.query || '').trim();
  if (query) {
    var mode = String(params.searchMode || 'name');
    return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportAdvertisers(query, mode));
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportCachedAdvertisers());
}

function handleCreateDealsSheet(e) {
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var query = String(form.dealsQuery || form.query || '').trim();
  if (!query) {
    return HiEnergyCards.error('Missing query', 'Enter a deal keyword to search.');
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportDeals(query));
}

function handleExportCachedDealsToSheet(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var query = String(params.query || '').trim();
  if (query) {
    return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportDeals(query));
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportCachedDeals());
}

function handleCreateTransactionsSheet(e) {
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var query = String(form.transactionsQuery || form.query || '').trim();
  var days = String(form.transactionDays || '30');
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportTransactions(query, days));
}

function handleExportCachedTransactionsToSheet(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var query = String(params.query || '').trim();
  if (query || params.days) {
    return HiEnergyCards.sheetResultResponse(
      HiEnergySheets.exportTransactions(query, String(params.days || '30'))
    );
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportCachedTransactions());
}

function handleCreateAdvertiserContactsSheet(e) {
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var params = (e && e.parameters) || {};
  var advertiser = String(form.advertiserContactsQuery || params.advertiser || '').trim();
  if (!advertiser) {
    return HiEnergyCards.error('Missing advertiser', 'Enter an advertiser id or slug.');
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportAdvertiserContacts(advertiser));
}

function handleExportCachedAdvertiserContactsToSheet(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var query = String(params.query || '').trim();
  if (query) {
    return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportAdvertiserContacts(query));
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportCachedAdvertiserContacts());
}

function handleCreateGoogleContactsSheet(e) {
  var form = (e && e.formInput) || {};
  var params = (e && e.parameters) || {};
  var query = String(form.googleContactsQuery || params.query || '').trim();
  if (!query) {
    return HiEnergyCards.error('Missing query', 'Enter a name, email, or company to search.');
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportGoogleContacts(query));
}

function handleExportCachedGoogleContactsToSheet() {
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportCachedGoogleContacts());
}

function handleExportCachedSearchToSheet(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var query = String(params.query || '').trim();
  if (query) {
    var mode = String(params.searchMode || 'name');
    return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportSearch(query, 'all', mode));
  }
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportCachedSearch());
}

function handleExportMcpResultToSheet() {
  ensureAuthenticated_();
  return HiEnergyCards.sheetResultResponse(HiEnergySheets.exportCachedMcpTool());
}

function handleAddMoreRowsToSheet(e) {
  ensureAuthenticated_();
  return HiEnergyCards.sheetResultResponse(
    HiEnergySheets.exportMoreFromSession(false),
    { hostApp: resolveHostApp_(e) }
  );
}

function handleFetchAllRemainingRows(e) {
  ensureAuthenticated_();
  return HiEnergyCards.sheetResultResponse(
    HiEnergySheets.exportMoreFromSession(true),
    { hostApp: resolveHostApp_(e) }
  );
}

function onDraftEmailAction(e) {
  ensureAuthenticated_();
  var hostApp = resolveHostApp_(e);
  if (hostApp && !isGmailHost_(hostApp)) {
    return HiEnergyCards.error(
      'Gmail drafts',
      'Draft Email creates messages in Gmail. Open the add-on from Gmail, or use Create Sheet in this app.'
    );
  }
  return HiEnergyCards.draftEmail();
}

function handleDraftEmailFromContext(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var domain = params.domain || '';
  if (!domain) {
    return HiEnergyCards.error('Missing domain', 'Could not read a domain from the message.');
  }

  var context = {
    senderEmail: params.senderEmail || '',
    senderName: params.senderName || '',
    message: {
      id: params.messageId || '',
      subject: params.subject || ''
    }
  };

  var prepared = HiEnergyGmailDrafts.prepareFromDomain(domain, context);
  if (!prepared.ok) {
    return HiEnergyCards.error('Draft failed', prepared.message || prepared.error || 'Could not prepare draft.');
  }

  return HiEnergyCards.draftEmailForm(prepared.draft, {
    replyToMessageId: prepared.replyToMessageId || ''
  });
}

function handleDraftEmailToContact(e) {
  ensureAuthenticated_();
  var hostApp = resolveHostApp_(e);
  if (hostApp && !isGmailHost_(hostApp)) {
    return HiEnergyCards.error(
      'Gmail drafts',
      'Drafts open in Gmail. Open this add-on in Gmail to email this contact.'
    );
  }

  var params = (e && e.parameters) || {};
  var email = String(params.email || '').trim();
  if (!email) {
    return HiEnergyCards.error('Missing email', 'This contact has no email address on file.');
  }

  var prepared = HiEnergyGmailDrafts.prepareFromContact({
    email: email,
    name: params.name || '',
    advertiserId: params.advertiserId || '',
    advertiserName: params.advertiserName || '',
    senderName: ''
  });

  if (!prepared.ok) {
    return HiEnergyCards.error('Draft failed', prepared.message || prepared.error || 'Could not prepare draft.');
  }

  return HiEnergyCards.draftEmailForm(prepared.draft, {});
}

function handleDraftEmailFromAdvertiser(e) {
  ensureAuthenticated_();
  var params = (e && e.parameters) || {};
  var id = params.id || '';
  var name = params.name || '';
  if (!id) {
    return HiEnergyCards.error('Missing advertiser', 'No advertiser id was provided.');
  }

  var prepared = HiEnergyGmailDrafts.prepareFromAdvertiser(id, name);
  if (!prepared.ok) {
    return HiEnergyCards.apiError(prepared);
  }

  return HiEnergyCards.draftEmailForm(prepared.draft, {});
}

function handlePrepareDraftEmail(e) {
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var domain = String(form.domain || '').trim();
  var advertiserId = String(form.advertiserId || '').trim();

  if (domain) {
    var fromDomain = HiEnergyGmailDrafts.prepareFromDomain(domain, {});
    if (!fromDomain.ok) {
      return HiEnergyCards.error('Draft failed', fromDomain.message || fromDomain.error || 'Could not prepare draft.');
    }
    return HiEnergyCards.draftEmailForm(fromDomain.draft, {
      replyToMessageId: fromDomain.replyToMessageId || ''
    });
  }

  if (advertiserId) {
    var fromAdvertiser = HiEnergyGmailDrafts.prepareFromAdvertiser(advertiserId, '');
    if (!fromAdvertiser.ok) {
      return HiEnergyCards.apiError(fromAdvertiser);
    }
    return HiEnergyCards.draftEmailForm(fromAdvertiser.draft, {});
  }

  return HiEnergyCards.error('Missing input', 'Enter a domain or advertiser id to load MCP data.');
}

function handleCreateDraftEmail(e) {
  var form = (e && e.formInput) || {};
  var params = (e && e.parameters) || {};
  var to = String(form.to || '').trim();
  var subject = String(form.subject || '').trim();
  var body = String(form.body || '').trim();
  var options = {};

  if (params.replyToMessageId) {
    options.replyToMessageId = params.replyToMessageId;
  }

  return HiEnergyCards.draftResult(HiEnergyGmailDrafts.createDraft(to, subject, body, options));
}
