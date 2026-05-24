var HiEnergyMcpExport = (function () {
  function attrs_(record) {
    return (record && record.attributes) || record || {};
  }

  function idOf_(row, a) {
    return String((row && row.id) || (a && a.id) || '');
  }

  function advertiserHiEnergyUrl_(id) {
    var clean = String(id || '').trim();
    if (!clean) {
      return '';
    }
    return (
      HiEnergyConfig.appOrigin +
      (HiEnergyConfig.advertiserPath || '/a/') +
      encodeURIComponent(clean)
    );
  }

  function dealAdminUrl_(id) {
    var clean = String(id || '').trim();
    if (!clean) {
      return '';
    }
    return (
      HiEnergyConfig.appOrigin +
      (HiEnergyConfig.dealAdminPath || '/admin/deals/') +
      encodeURIComponent(clean)
    );
  }

  function publisherAdminUrl_(id) {
    var clean = String(id || '').trim();
    if (!clean) {
      return '';
    }
    return (
      HiEnergyConfig.appOrigin +
      (HiEnergyConfig.publisherAdminPath || '/admin/publishers/') +
      encodeURIComponent(clean)
    );
  }

  function publisherIdFrom_(attrs) {
    if (!attrs) {
      return '';
    }
    var direct = first_(
      attrs.publisher_id,
      attrs.publisher_slug,
      attrs.publisherId,
      attrs.publisherSlug
    );
    if (direct) {
      return String(direct);
    }
    var nested = attrs.publisher;
    if (nested && typeof nested === 'object') {
      var nestedAttrs =
        (nested.attributes && nested.attributes) ||
        (nested.data && nested.data.attributes) ||
        nested;
      return String(
        first_(
          nested.id,
          nested.slug,
          nestedAttrs.id,
          nestedAttrs.slug,
          nestedAttrs.publisher_id,
          nestedAttrs.publisher_slug
        ) || ''
      );
    }
    return '';
  }

  function publisherCell_(attrs) {
    var name = first_(
      attrs.publisher_name,
      attrs.publisher_display_name,
      typeof attrs.publisher === 'string' ? attrs.publisher : '',
      attrs.publisher && (attrs.publisher.name || attrs.publisher.display_name)
    );
    var pubId = publisherIdFrom_(attrs);
    if (pubId) {
      return hyperlink_(publisherAdminUrl_(pubId), name || pubId);
    }
    return name || '';
  }

  function hyperlink_(url, label) {
    var cleanUrl = String(url || '').trim();
    if (!cleanUrl) {
      return '';
    }
    var cleanLabel = String(label == null ? '' : label).trim() || cleanUrl;
    var safeUrl = cleanUrl.replace(/"/g, '""');
    var safeLabel = cleanLabel.replace(/"/g, '""');
    return '=HYPERLINK("' + safeUrl + '","' + safeLabel + '")';
  }

  function first_(/* values */) {
    for (var i = 0; i < arguments.length; i += 1) {
      var v = arguments[i];
      if (v !== undefined && v !== null && v !== '') {
        return v;
      }
    }
    return '';
  }

  function advertiserRows_(rows) {
    return rows.map(function (row) {
      var a = attrs_(row);
      var id = idOf_(row, a);
      var name = first_(a.display_name, a.name, id);
      return [
        hyperlink_(advertiserHiEnergyUrl_(a.slug || id), name),
        name,
        publisherCell_(a),
        a.domain || '',
        a.network_name || '',
        first_(a.program_status, a.status, a.advertiser_status),
        a.signup_url || a.join_url || a.application_url || '',
        a.url || ''
      ];
    });
  }

  function dealRows_(rows) {
    return rows.map(function (row) {
      var a = attrs_(row);
      var id = idOf_(row, a);
      var title = first_(a.title, a.name, id);
      var advertiserName = a.advertiser_name || '';
      return [
        hyperlink_(dealAdminUrl_(id), title),
        hyperlink_(
          advertiserHiEnergyUrl_(a.advertiser_slug || a.advertiser_id),
          advertiserName || a.advertiser_slug || a.advertiser_id
        ),
        title,
        advertiserName,
        first_(a.deal_type, a.type, a.category),
        first_(a.description, a.summary),
        first_(a.code, a.coupon_code, a.promo_code),
        first_(a.discount, a.value, a.amount, a.percent_off),
        a.start_date || a.starts_at || '',
        a.end_date || a.ends_at || a.expires_at || '',
        a.status || '',
        a.network_name || '',
        a.url || a.landing_url || ''
      ];
    });
  }

  function transactionRows_(rows) {
    return rows.map(function (row) {
      var a = attrs_(row);
      var id = idOf_(row, a);
      var advertiserName = first_(a.advertiser_name, a.advertiser_id);
      return [
        hyperlink_(
          advertiserHiEnergyUrl_(a.advertiser_slug || a.advertiser_id),
          advertiserName
        ),
        advertiserName,
        publisherCell_(a),
        first_(a.commission_amount, a.commission),
        first_(a.sale_amount, a.amount, a.order_value),
        a.network_name || '',
        a.transaction_date || a.event_date || a.created_at || '',
        a.status || '',
        first_(a.order_id, a.transaction_id)
      ];
    });
  }

  function contactGivenName_(attrs) {
    return first_(attrs.given_name, attrs.givenName, attrs.first_name, attrs.firstName);
  }

  function contactFamilyName_(attrs) {
    return first_(attrs.family_name, attrs.familyName, attrs.last_name, attrs.lastName);
  }

  function contactFullName_(attrs, id) {
    var given = contactGivenName_(attrs);
    var family = contactFamilyName_(attrs);
    var combined = [given, family].filter(Boolean).join(' ').trim();
    return (
      combined ||
      attrs.full_name ||
      attrs.display_name ||
      attrs.name ||
      attrs.email ||
      id ||
      ''
    );
  }

  function nestedAdvertiserAttrs_(attrs) {
    var advertiser = attrs.advertiser;
    if (!advertiser) {
      return {};
    }
    if (advertiser.attributes) {
      return advertiser.attributes;
    }
    if (advertiser.data && advertiser.data.attributes) {
      return advertiser.data.attributes;
    }
    if (advertiser.data) {
      return attrs_(advertiser.data);
    }
    return attrs_(advertiser);
  }

  function contactAdvertiserCompany_(attrs) {
    var nested = nestedAdvertiserAttrs_(attrs);
    return first_(
      attrs.advertiser_name,
      attrs.advertiser_company,
      attrs.advertiser_company_name,
      attrs.company_name,
      attrs.company,
      nested.display_name,
      nested.name,
      nested.company_name,
      nested.company,
      attrs.organization
    );
  }

  function linkedinProfile_(attrs) {
    var direct = first_(
      attrs.linkedin_url,
      attrs.linkedin,
      attrs.linkedin_profile_url,
      attrs.linkedin_profile,
      attrs.linkedinProfileUrl,
      attrs.social_linkedin
    );
    if (direct) {
      return direct;
    }
    var urls = attrs.urls;
    if (!Array.isArray(urls)) {
      return '';
    }
    for (var i = 0; i < urls.length; i += 1) {
      var entry = urls[i];
      if (!entry) {
        continue;
      }
      if (typeof entry === 'string' && entry.indexOf('linkedin.com') !== -1) {
        return entry;
      }
      var value = entry.url || entry.value || entry.href || '';
      var type = String(entry.type || entry.label || '').toLowerCase();
      if (value && (value.indexOf('linkedin.com') !== -1 || type.indexOf('linkedin') !== -1)) {
        return value;
      }
    }
    return '';
  }

  function contactRows_(rows) {
    return rows.map(function (row) {
      var a = attrs_(row);
      var id = idOf_(row, a);
      var company = contactAdvertiserCompany_(a);
      return [
        hyperlink_(
          advertiserHiEnergyUrl_(a.advertiser_slug || a.advertiser_id),
          company || a.advertiser_slug || a.advertiser_id
        ),
        company,
        contactFullName_(a, id),
        contactGivenName_(a),
        contactFamilyName_(a),
        a.email || '',
        a.job_title || a.title || '',
        a.phone || '',
        linkedinProfile_(a)
      ];
    });
  }

  function sheetRows_(rows) {
    return rows || [];
  }

  var SHEET_SPECS_ = {
    advertisers: {
      title: 'Advertisers',
      headers: [
        'Hi Energy link',
        'Name',
        'Publisher',
        'Domain',
        'Network',
        'Status',
        'Signup URL',
        'External URL'
      ],
      rows: advertiserRows_
    },
    deals: {
      title: 'Deals',
      headers: [
        'Hi Energy admin link',
        'Advertiser Hi Energy link',
        'Title',
        'Advertiser',
        'Type',
        'Description',
        'Code',
        'Discount',
        'Starts',
        'Ends',
        'Status',
        'Network',
        'Landing URL'
      ],
      rows: dealRows_
    },
    transactions: {
      title: 'Transactions',
      headers: [
        'Advertiser Hi Energy link',
        'Advertiser',
        'Publisher',
        'Commission',
        'Sale amount',
        'Network',
        'Date',
        'Status',
        'Order ID'
      ],
      rows: transactionRows_
    },
    contacts: {
      title: 'Contacts',
      headers: [
        'Advertiser Hi Energy link',
        'Advertiser company',
        'Name',
        'Given name',
        'Family name',
        'Email',
        'Title',
        'Phone',
        'LinkedIn profile'
      ],
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
        rows: spec.rows(sheetRows_(rows))
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
        rows: spec.rows(sheetRows_(rows))
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
        rows: spec.rows(sheetRows_(rows))
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
        rows: spec.rows(sheetRows_(rows))
      }
    ];
  }

  function applyContactCompanyFallback_(tables, fallback) {
    var company = String(fallback || '').trim();
    if (!company || !tables || !tables.length) {
      return;
    }
    tables.forEach(function (table) {
      if (!table.rows || table.headers[1] !== 'Advertiser company') {
        return;
      }
      table.rows.forEach(function (row) {
        if (!row[1]) {
          row[1] = company;
        }
      });
    });
  }

  function tablesFromContactsBody_(body, options) {
    var rows = (body && body.data) || (Array.isArray(body) ? body : []);
    if (!rows.length) {
      return [];
    }
    var spec = SHEET_SPECS_.contacts;
    var tables = [
      {
        name: spec.title,
        headers: spec.headers,
        rows: spec.rows(sheetRows_(rows))
      }
    ];
    applyContactCompanyFallback_(tables, options && options.advertiserCompanyFallback);
    return tables;
  }

  function tablesFromMcpResult_(toolName, body, options) {
    options = options || {};
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
      return tablesFromContactsBody_(body, options);
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
        '',
        contact.organization || '',
        contact.name || '',
        contact.givenName || '',
        contact.familyName || '',
        contact.email || '',
        contact.jobTitle || '',
        '',
        contact.phone || '',
        contact.linkedin || '',
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
        headers: SHEET_SPECS_.contacts.headers,
        rows: googleContactRows_(contacts.slice(0, HiEnergyConfig.sheetContactLimit))
      }
    ];
  }

  function titleCase_(value) {
    var str = String(value || '').trim();
    if (!str) {
      return '';
    }
    return str
      .split(/\s+/)
      .map(function (word) {
        return word.length > 2
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word;
      })
      .join(' ');
  }

  function createSheetTitle_(label, query, suffix) {
    var date = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'MMM d, yyyy'
    );
    var pretty = titleCase_(query) || 'Search';
    var parts = [
      HiEnergyConfig.sheetTitlePrefix,
      label,
      pretty
    ];
    if (suffix) {
      parts.push(suffix);
    }
    parts.push(date);
    return parts.join(' · ');
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

  function saveExportSession_(session) {
    if (!session) {
      return;
    }
    try {
      PropertiesService.getUserProperties().setProperty(
        HiEnergyConfig.propExportSession,
        JSON.stringify(session)
      );
    } catch (err) {
      console.warn('Could not save export session: ' + err);
    }
  }

  function readExportSession_() {
    try {
      var raw = PropertiesService.getUserProperties().getProperty(HiEnergyConfig.propExportSession);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function clearExportSession_() {
    PropertiesService.getUserProperties().deleteProperty(HiEnergyConfig.propExportSession);
  }

  return {
    tablesFromSearchBody: tablesFromSearchBody_,
    tablesFromMcpResult: tablesFromMcpResult_,
    tablesFromGoogleContacts: tablesFromGoogleContacts_,
    publisherIdFromAttrs: publisherIdFrom_,
    publisherAdminUrl: publisherAdminUrl_,
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
    readCachedGoogleContactsSearch: readCachedGoogleContactsSearch_,
    saveExportSession: saveExportSession_,
    readExportSession: readExportSession_,
    clearExportSession: clearExportSession_
  };
})();
