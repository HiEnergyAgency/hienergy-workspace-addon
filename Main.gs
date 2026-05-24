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
  ensureAuthenticated_();
  var form = (e && e.formInput) || {};
  var query = String(form.query || '').trim();
  var scope = String(form.scope || 'all');

  if (!query) {
    return HiEnergyCards.error('Missing query', 'Enter a brand, domain, or deal keyword to search.');
  }

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

function onGmailMessageOpen(e) {
  if (!HiEnergyApi.hasAuth()) {
    return HiEnergyCards.connect();
  }

  var domain = extractDomainFromGmailEvent_(e);
  if (!domain) {
    return HiEnergyCards.search();
  }

  return HiEnergyCards.gmailContext(domain, 'Look up programs for this sender');
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

function extractDomainFromGmailEvent_(e) {
  try {
    var accessToken = e.gmail.accessToken;
    var messageId = e.gmail.messageId;
    if (!accessToken || !messageId) {
      return null;
    }

    var message = GmailApp.getMessageById(messageId);
    if (!message) {
      return null;
    }

    var from = message.getFrom() || '';
    var match = from.match(/@([\w.-]+\.\w+)/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }

    var body = message.getPlainBody() || '';
    var urlMatch = body.match(/https?:\/\/(?:www\.)?([\w.-]+\.\w+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toLowerCase();
    }
  } catch (err) {
    console.warn('Gmail context parse failed: ' + err);
  }

  return null;
}
