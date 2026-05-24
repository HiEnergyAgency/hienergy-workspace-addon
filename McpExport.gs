var HiEnergyMcpExport = (function () {
  function attrs_(record) {
    return (record && record.attributes) || record || {};
  }

  function advertiserRows_(rows) {
    return rows.map(function (row) {
      var a = attrs_(row);
      return [
        a.display_name || a.name || row.id || '',
        a.domain || '',
        a.network_name || '',
        a.program_status || a.status || '',
        a.commission_rate || a.average_commission_rate || '',
        a.slug || '',
        a.url || '',
        String(row.id || a.id || '')
      ];
    });
  }

  function dealRows_(rows) {
    return rows.map(function (row) {
      var a = attrs_(row);
      return [
        a.title || a.name || row.id || '',
        a.advertiser_name || '',
        a.country || '',
        a.status || '',
        String(row.id || a.id || '')
      ];
    });
  }

  function transactionRows_(rows) {
    return rows.map(function (row) {
      var a = attrs_(row);
      return [
        a.advertiser_name || a.advertiser_id || '',
        a.commission_amount || a.commission || '',
        a.network_name || '',
        a.transaction_date || '',
        a.status || '',
        String(row.id || a.id || '')
      ];
    });
  }

  function contactRows_(rows) {
    return rows.map(function (row) {
      var a = attrs_(row);
      return [
        [a.given_name, a.family_name].filter(Boolean).join(' ') || a.email || row.id || '',
        a.email || '',
        a.job_title || '',
        a.phone || '',
        String(row.id || a.id || '')
      ];
    });
  }

  var SHEET_SPECS_ = {
    advertisers: {
      title: 'Advertisers',
      headers: ['Name', 'Domain', 'Network', 'Status', 'Commission', 'Slug', 'URL', 'ID'],
      rows: advertiserRows_
    },
    deals: {
      title: 'Deals',
      headers: ['Title', 'Advertiser', 'Country', 'Status', 'ID'],
      rows: dealRows_
    },
    transactions: {
      title: 'Transactions',
      headers: ['Advertiser', 'Commission', 'Network', 'Date', 'Status', 'ID'],
      rows: transactionRows_
    },
    contacts: {
      title: 'Contacts',
      headers: ['Name', 'Email', 'Title', 'Phone', 'ID'],
      rows: contactRows_
    }
  };

  function tablesFromSearchBody_(body) {
    var results = (body && body.results) || {};
    var tables = [];

    Object.keys(SHEET_SPECS_).forEach(function (type) {
      var bucket = results[type] || {};
      var rows = bucket.data || (Array.isArray(bucket) ? bucket : []);
      if (!rows.length) {
        return;
      }
      var spec = SHEET_SPECS_[type];
      tables.push({
        name: spec.title,
        headers: spec.headers,
        rows: spec.rows(rows.slice(0, HiEnergyConfig.sheetRowLimit))
      });
    });

    return tables;
  }

  function tablesFromAdvertiserList_(rows) {
    if (!rows || !rows.length) {
      return [];
    }
    var spec = SHEET_SPECS_.advertisers;
    return [
      {
        name: spec.title,
        headers: spec.headers,
        rows: spec.rows(rows.slice(0, HiEnergyConfig.sheetRowLimit))
      }
    ];
  }

  function tablesFromDealsBody_(body) {
    var rows = (body && body.data) || (Array.isArray(body) ? body : []);
    if (!rows.length) {
      return [];
    }
    var spec = SHEET_SPECS_.deals;
    return [
      {
        name: spec.title,
        headers: spec.headers,
        rows: spec.rows(rows.slice(0, HiEnergyConfig.sheetRowLimit))
      }
    ];
  }

  function tablesFromTransactionsBody_(body) {
    var rows = (body && body.data) || (Array.isArray(body) ? body : []);
    if (!rows.length) {
      return [];
    }
    var spec = SHEET_SPECS_.transactions;
    return [
      {
        name: spec.title,
        headers: spec.headers,
        rows: spec.rows(rows.slice(0, HiEnergyConfig.sheetRowLimit))
      }
    ];
  }

  function tablesFromContactsBody_(body) {
    var rows = (body && body.data) || (Array.isArray(body) ? body : []);
    if (!rows.length) {
      return [];
    }
    var spec = SHEET_SPECS_.contacts;
    return [
      {
        name: spec.title,
        headers: spec.headers,
        rows: spec.rows(rows.slice(0, HiEnergyConfig.sheetRowLimit))
      }
    ];
  }

  function tablesFromMcpResult_(toolName, body) {
    if (toolName === 'universal_search' || !toolName) {
      return tablesFromSearchBody_(body);
    }
    if (toolName === 'search_advertisers' || toolName === 'search_advertisers_by_domain') {
      var advertisers = (body && body.data) || body || [];
      return tablesFromAdvertiserList_(Array.isArray(advertisers) ? advertisers : []);
    }
    if (toolName === 'search_deals') {
      return tablesFromDealsBody_(body);
    }
    if (toolName === 'search_transactions') {
      return tablesFromTransactionsBody_(body);
    }
    if (toolName === 'get_advertiser_contacts') {
      return tablesFromContactsBody_(body);
    }

    return [
      {
        name: 'MCP Data',
        headers: ['JSON'],
        rows: [[JSON.stringify(body)]]
      }
    ];
  }

  function summarizeDeals_(deals) {
    if (!deals || !deals.length) {
      return '';
    }
    return deals
      .slice(0, 5)
      .map(function (row) {
        var a = attrs_(row);
        return '- ' + (a.title || a.name || 'Deal') + (a.country ? ' (' + a.country + ')' : '');
      })
      .join('\n');
  }

  function buildPartnershipDraft_(options) {
    options = options || {};
    var advertiser = options.advertiser || {};
    var attrs = attrs_(advertiser.data || advertiser);
    var name = options.recipientName || options.senderName || 'there';
    var advertiserName = attrs.display_name || attrs.name || options.domain || 'your program';
    var lines = [
      'Hi ' + name + ',',
      '',
      'I am reaching out regarding the ' + advertiserName + ' affiliate program'
    ];

    if (attrs.network_name) {
      lines.push(' on ' + attrs.network_name);
    }
    lines.push('.');

    if (attrs.commission_rate || attrs.average_commission_rate) {
      lines.push('');
      lines.push(
        'I noticed the program offers ' + (attrs.commission_rate || attrs.average_commission_rate) + ' commission.'
      );
    }

    var dealsText = summarizeDeals_(options.deals);
    if (dealsText) {
      lines.push('');
      lines.push('Active promotions I found:');
      lines.push(dealsText);
    }

    lines.push('');
    lines.push('Would you be open to discussing a partnership?');
    lines.push('');
    lines.push('Best,');
    lines.push('');
    lines.push('---');
    lines.push('Draft prepared with ' + HiEnergyConfig.brandName + ' (app.hienergy.ai)');

    var subject = options.subject;
    if (!subject) {
      subject = 'Partnership inquiry — ' + advertiserName;
      if (options.originalSubject) {
        subject = 'Re: ' + options.originalSubject;
      }
    }

    return {
      to: options.recipientEmail || '',
      subject: subject,
      body: lines.join('\n')
    };
  }

  function cacheKey_(prefix) {
    return 'hienergy_export_' + prefix;
  }

  function cacheSearchResult_(query, scope, result) {
    if (!result || !result.ok) {
      return;
    }
    try {
      PropertiesService.getUserProperties().setProperty(
        cacheKey_('search'),
        JSON.stringify({
          query: query,
          scope: scope || 'all',
          body: result.body,
          cachedAt: new Date().toISOString()
        })
      );
    } catch (err) {
      console.warn('Could not cache search result: ' + err);
    }
  }

  function readCachedSearch_() {
    try {
      var raw = PropertiesService.getUserProperties().getProperty(cacheKey_('search'));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function cacheMcpToolResult_(toolName, query, result) {
    if (!result || !result.ok) {
      return;
    }
    try {
      PropertiesService.getUserProperties().setProperty(
        cacheKey_('mcp'),
        JSON.stringify({
          toolName: toolName,
          query: query || '',
          body: result.body,
          cachedAt: new Date().toISOString()
        })
      );
    } catch (err) {
      console.warn('Could not cache MCP tool result: ' + err);
    }
  }

  function readCachedMcpTool_() {
    try {
      var raw = PropertiesService.getUserProperties().getProperty(cacheKey_('mcp'));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function googleContactRows_(contacts) {
    return contacts.map(function (contact) {
      return [
        contact.name || '',
        contact.email || '',
        contact.organization || '',
        contact.phone || '',
        contact.resourceName || ''
      ];
    });
  }

  function tablesFromGoogleContacts_(contacts) {
    if (!contacts || !contacts.length) {
      return [];
    }
    return [
      {
        name: 'Google Contacts',
        headers: ['Name', 'Email', 'Organization', 'Phone', 'Resource'],
        rows: googleContactRows_(contacts.slice(0, HiEnergyConfig.sheetContactLimit))
      }
    ];
  }

  function createSheetTitle_(label, query, suffix) {
    return (
      HiEnergyConfig.sheetTitlePrefix +
      ' ' +
      label +
      ' — ' +
      (query || 'Search') +
      (suffix ? ' (' + suffix + ')' : '') +
      ' — ' +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
    );
  }

  var EXPORT_CACHE_TTL_ = 21600;

  function exportCacheStore_() {
    try {
      return CacheService.getUserCache();
    } catch (err) {
      return null;
    }
  }

  function cacheTypedExport_(type, query, result, meta) {
    if (!result || !result.ok) {
      return;
    }
    try {
      var payload = JSON.stringify({
        query: query || '',
        meta: meta || {},
        body: result.body,
        contacts: result.contacts,
        cachedAt: new Date().toISOString()
      });
      var cache = exportCacheStore_();
      if (cache && payload.length < 95000) {
        cache.put(cacheKey_(type), payload, EXPORT_CACHE_TTL_);
        return;
      }
      // Payload too large for cache or cache unavailable — keep a metadata-only
      // marker in properties so the UI can still re-run the live export.
      PropertiesService.getUserProperties().setProperty(
        cacheKey_(type),
        JSON.stringify({
          query: query || '',
          meta: meta || {},
          cachedAt: new Date().toISOString(),
          oversize: true
        })
      );
    } catch (err) {
      console.warn('Could not cache export result: ' + err);
    }
  }

  function readCachedTypedExport_(type) {
    try {
      var cache = exportCacheStore_();
      var raw = cache ? cache.get(cacheKey_(type)) : null;
      if (!raw) {
        raw = PropertiesService.getUserProperties().getProperty(cacheKey_(type));
      }
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function cacheAdvertiserSearch_(query, searchMode, result) {
    cacheTypedExport_('advertisers', query, result, { searchMode: searchMode || 'name' });
  }

  function readCachedAdvertiserSearch_() {
    var cached = readCachedTypedExport_('advertisers');
    if (!cached) {
      return null;
    }
    return {
      query: cached.query,
      searchMode: (cached.meta && cached.meta.searchMode) || 'name',
      body: cached.body,
      cachedAt: cached.cachedAt
    };
  }

  function cacheDealsSearch_(query, result) {
    cacheTypedExport_('deals', query, result, {});
  }

  function readCachedDealsSearch_() {
    return readCachedTypedExport_('deals');
  }

  function cacheTransactionsSearch_(query, result, meta) {
    cacheTypedExport_('transactions', query, result, meta || {});
  }

  function readCachedTransactionsSearch_() {
    return readCachedTypedExport_('transactions');
  }

  function cacheAdvertiserContactsSearch_(query, result) {
    cacheTypedExport_('advertiser_contacts', query, result, {});
  }

  function readCachedAdvertiserContactsSearch_() {
    return readCachedTypedExport_('advertiser_contacts');
  }

  function cacheGoogleContactsSearch_(query, result) {
    cacheTypedExport_('google_contacts', query, result, {});
  }

  function readCachedGoogleContactsSearch_() {
    return readCachedTypedExport_('google_contacts');
  }

  return {
    tablesFromSearchBody: tablesFromSearchBody_,
    tablesFromMcpResult: tablesFromMcpResult_,
    tablesFromGoogleContacts: tablesFromGoogleContacts_,
    createSheetTitle: createSheetTitle_,
    buildPartnershipDraft: buildPartnershipDraft_,
    cacheSearchResult: cacheSearchResult_,
    readCachedSearch: readCachedSearch_,
    cacheMcpToolResult: cacheMcpToolResult_,
    readCachedMcpTool: readCachedMcpTool_,
    cacheAdvertiserSearch: cacheAdvertiserSearch_,
    readCachedAdvertiserSearch: readCachedAdvertiserSearch_,
    cacheDealsSearch: cacheDealsSearch_,
    readCachedDealsSearch: readCachedDealsSearch_,
    cacheTransactionsSearch: cacheTransactionsSearch_,
    readCachedTransactionsSearch: readCachedTransactionsSearch_,
    cacheAdvertiserContactsSearch: cacheAdvertiserContactsSearch_,
    readCachedAdvertiserContactsSearch: readCachedAdvertiserContactsSearch_,
    cacheGoogleContactsSearch: cacheGoogleContactsSearch_,
    readCachedGoogleContactsSearch: readCachedGoogleContactsSearch_
  };
})();
