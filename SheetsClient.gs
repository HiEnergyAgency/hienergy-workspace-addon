var HiEnergySheets = (function () {
  function sanitizeSheetName_(name) {
    return String(name || 'Data')
      .replace(/[[\]*\\?:]/g, ' ')
      .trim()
      .substring(0, 100) || 'Data';
  }

  function writeTable_(sheet, headers, rows) {
    var values = [headers].concat(rows || []);
    if (!values.length) {
      return 0;
    }
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return values.length - 1;
  }

  function useActiveSpreadsheet_() {
    var host = PropertiesService.getUserProperties().getProperty(HiEnergyConfig.propHostApp);
    return host === 'SHEETS';
  }

  function writeTablesToSpreadsheet_(spreadsheet, tables) {
    var totalRows = 0;
    tables.forEach(function (table) {
      var sheetName = sanitizeSheetName_(table.name);
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
      } else {
        sheet.clear();
      }
      totalRows += writeTable_(sheet, table.headers, table.rows);
    });
    return {
      ok: true,
      url: spreadsheet.getUrl(),
      spreadsheetId: spreadsheet.getId(),
      sheetCount: tables.length,
      rowCount: totalRows,
      usedActiveSpreadsheet: true
    };
  }

  function mergeExportMeta_(exportResult, paginatedBody) {
    if (!exportResult || !exportResult.ok || !paginatedBody || !paginatedBody.meta) {
      return exportResult;
    }
    var meta = paginatedBody.meta;
    exportResult.fetchedRows = meta.fetched;
    exportResult.totalAvailable = meta.total;
    exportResult.truncated = typeof meta.total === 'number' && meta.total > meta.fetched;
    return exportResult;
  }

  function attachPaginationStats_(tables, meta) {
    if (!tables || !tables.length || !meta) {
      return tables;
    }
    tables[0].meta = meta;
    return tables;
  }

  function createFromTables_(title, tables) {
    if (!tables || !tables.length) {
      return { ok: false, error: 'NO_DATA', message: 'No rows to export.' };
    }

    try {
      if (useActiveSpreadsheet_()) {
        var active = SpreadsheetApp.getActiveSpreadsheet();
        if (active) {
          return writeTablesToSpreadsheet_(active, tables);
        }
      }

      var spreadsheet = SpreadsheetApp.create(String(title).substring(0, 200));
      var totalRows = 0;

      tables.forEach(function (table, index) {
        var sheet = index === 0 ? spreadsheet.getActiveSheet() : spreadsheet.insertSheet();
        sheet.setName(sanitizeSheetName_(table.name));
        totalRows += writeTable_(sheet, table.headers, table.rows);
      });

      spreadsheet.getSpreadsheetTimeZone();
      var url = spreadsheet.getUrl();

      return {
        ok: true,
        url: url,
        spreadsheetId: spreadsheet.getId(),
        sheetCount: tables.length,
        rowCount: totalRows,
        usedActiveSpreadsheet: false
      };
    } catch (err) {
      console.warn('Sheet create failed: ' + err);
      return { ok: false, error: 'SHEETS_ERROR', message: String(err) };
    }
  }

  function createFromSearchResult_(query, body) {
    var tables = HiEnergyMcpExport.tablesFromSearchBody(body);
    var title =
      HiEnergyConfig.sheetTitlePrefix +
      ' — ' +
      (query || 'Search') +
      ' — ' +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    return createFromTables_(title, tables);
  }

  function createFromMcpToolResult_(toolName, query, body) {
    var tables = HiEnergyMcpExport.tablesFromMcpResult(toolName, body);
    var title =
      HiEnergyConfig.sheetTitlePrefix +
      ' — ' +
      (toolName || 'MCP') +
      (query ? ' — ' + query : '') +
      ' — ' +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    return createFromTables_(title, tables);
  }

  function exportCachedSearch_() {
    var cached = HiEnergyMcpExport.readCachedSearch();
    if (!cached || !cached.body) {
      return {
        ok: false,
        error: 'NO_CACHE',
        message: 'Run a Hi Energy search first, then export the latest results.'
      };
    }
    return createFromSearchResult_(cached.query, cached.body);
  }

  function exportCachedMcpTool_() {
    var cached = HiEnergyMcpExport.readCachedMcpTool();
    if (!cached || !cached.body) {
      return {
        ok: false,
        error: 'NO_CACHE',
        message: 'Run an MCP tool first, then export the latest results.'
      };
    }
    return createFromMcpToolResult_(cached.toolName, cached.query, cached.body);
  }

  function extractRows_(body) {
    if (!body) {
      return [];
    }
    if (Array.isArray(body)) {
      return body;
    }
    if (Array.isArray(body.data)) {
      return body.data;
    }
    if (body.data && Array.isArray(body.data.data)) {
      return body.data.data;
    }
    if (body.structuredContent) {
      return extractRows_(body.structuredContent);
    }
    return [];
  }

  function extractTotal_(body) {
    if (!body) {
      return null;
    }
    if (body.meta && typeof body.meta.total === 'number') {
      return body.meta.total;
    }
    if (typeof body.total === 'number') {
      return body.total;
    }
    if (body.data && body.data.meta && typeof body.data.meta.total === 'number') {
      return body.data.meta.total;
    }
    if (body.structuredContent) {
      return extractTotal_(body.structuredContent);
    }
    return null;
  }

  function paginateRows_(fetchPage) {
    var maxRows = HiEnergyConfig.sheetRowLimit;
    var pageSize = HiEnergyConfig.exportPageSize || 100;
    var collected = [];
    var seen = {};
    var lastBody = null;
    var totalFromServer = null;

    for (var page = 1; page <= 50; page += 1) {
      if (collected.length >= maxRows) {
        break;
      }

      var remaining = maxRows - collected.length;
      var pageLimit = Math.min(pageSize, remaining);

      var result = fetchPage(page, pageLimit);
      if (!result || !result.ok) {
        if (collected.length) {
          break;
        }
        return result;
      }

      lastBody = result.body || {};
      var rows = extractRows_(lastBody);
      if (!rows.length) {
        break;
      }

      var addedThisPage = 0;
      for (var i = 0; i < rows.length && collected.length < maxRows; i += 1) {
        var row = rows[i];
        var rowId =
          row && (row.id || (row.attributes && row.attributes.id));
        var key = rowId ? 'id:' + rowId : 'idx:' + collected.length + ':' + JSON.stringify(row).length;
        if (!rowId || !seen[key]) {
          seen[key] = true;
          collected.push(row);
          addedThisPage += 1;
        }
      }

      var serverTotal = extractTotal_(lastBody);
      if (typeof serverTotal === 'number') {
        totalFromServer = serverTotal;
        if (collected.length >= serverTotal) {
          break;
        }
      }

      if (addedThisPage === 0 || rows.length < pageLimit) {
        break;
      }
    }

    return {
      ok: true,
      body: {
        data: collected,
        meta: {
          total: typeof totalFromServer === 'number' ? totalFromServer : collected.length,
          fetched: collected.length,
          truncatedAt: HiEnergyConfig.sheetRowLimit
        }
      }
    };
  }

  function createFromAdvertiserSearch_(query, searchMode, body) {
    var tables = HiEnergyMcpExport.tablesFromMcpResult(
      searchMode === 'domain' ? 'search_advertisers_by_domain' : 'search_advertisers',
      body
    );
    var modeLabel = searchMode === 'domain' ? 'domain' : 'name';
    return createFromTables_(
      HiEnergyMcpExport.createSheetTitle('Advertisers', query, modeLabel),
      tables
    );
  }

  function createFromApiResult_(label, query, toolName, body, suffix) {
    var tables = HiEnergyMcpExport.tablesFromMcpResult(toolName, body);
    return createFromTables_(HiEnergyMcpExport.createSheetTitle(label, query, suffix), tables);
  }

  function createFromGoogleContacts_(query, contacts) {
    var tables = HiEnergyMcpExport.tablesFromGoogleContacts(contacts);
    return createFromTables_(HiEnergyMcpExport.createSheetTitle('Google Contacts', query), tables);
  }

  function exportAdvertisers_(query, searchMode) {
    ensureAuthenticatedForExport_();

    var normalized = String(query || '').trim();
    if (!normalized) {
      return { ok: false, error: 'MISSING_QUERY', message: 'Enter an advertiser name or domain.' };
    }

    var mode = searchMode === 'domain' ? 'domain' : 'name';
    var result;
    if (mode === 'domain') {
      result = HiEnergyApi.advertiserByDomain(normalized);
    } else {
      result = paginateRows_(function (page, limit) {
        return HiEnergyApi.searchAdvertisers(normalized, limit, page);
      });
    }

    if (!result.ok) {
      return result;
    }

    HiEnergyMcpExport.cacheAdvertiserSearch(normalized, mode, result);
    var sheet = createFromAdvertiserSearch_(normalized, mode, result.body);
    return mergeExportMeta_(sheet, result.body);
  }

  function exportCachedAdvertisers_() {
    var cached = HiEnergyMcpExport.readCachedAdvertiserSearch();
    if (!cached || !cached.body) {
      return {
        ok: false,
        error: 'NO_CACHE',
        message: 'Search advertisers first, then export the latest results.'
      };
    }
    return createFromAdvertiserSearch_(cached.query, cached.searchMode, cached.body);
  }

  function exportDeals_(query) {
    ensureAuthenticatedForExport_();

    var normalized = String(query || '').trim();
    if (!normalized) {
      return { ok: false, error: 'MISSING_QUERY', message: 'Enter a deal keyword to search.' };
    }

    var result = paginateRows_(function (page, limit) {
      return HiEnergyApi.searchDeals(normalized, limit, page);
    });
    if (!result.ok) {
      return result;
    }

    HiEnergyMcpExport.cacheDealsSearch(normalized, result);
    return mergeExportMeta_(
      createFromApiResult_('Deals', normalized, 'search_deals', result.body),
      result.body
    );
  }

  function exportCachedDeals_() {
    var cached = HiEnergyMcpExport.readCachedDealsSearch();
    if (!cached || !cached.body) {
      return {
        ok: false,
        error: 'NO_CACHE',
        message: 'Search deals first, then export the latest results.'
      };
    }
    return createFromApiResult_('Deals', cached.query, 'search_deals', cached.body);
  }

  function exportTransactions_(query, days, advertiserId) {
    ensureAuthenticatedForExport_();

    var normalized = String(query || '').trim();
    var advertiser = String(advertiserId || '').trim();
    var dayRange = parseInt(days, 10) || 30;
    var result = paginateRows_(function (page, limit) {
      return HiEnergyApi.searchTransactions({
        q: normalized || undefined,
        advertiserId: advertiser || undefined,
        days: dayRange,
        limit: limit,
        page: page
      });
    });

    if (!result.ok) {
      return result;
    }

    HiEnergyMcpExport.cacheTransactionsSearch(normalized || 'Recent', result, { days: dayRange });
    return mergeExportMeta_(
      createFromApiResult_(
        'Transactions',
        normalized || 'Recent',
        'search_transactions',
        result.body,
        dayRange + ' days'
      ),
      result.body
    );
  }

  function exportCachedTransactions_() {
    var cached = HiEnergyMcpExport.readCachedTransactionsSearch();
    if (!cached || !cached.body) {
      return {
        ok: false,
        error: 'NO_CACHE',
        message: 'Search transactions first, then export the latest results.'
      };
    }
    var suffix = cached.meta && cached.meta.days ? cached.meta.days + ' days' : '';
    return createFromApiResult_('Transactions', cached.query, 'search_transactions', cached.body, suffix);
  }

  function exportAdvertiserContacts_(advertiser) {
    ensureAuthenticatedForExport_();

    var normalized = String(advertiser || '').trim();
    if (!normalized) {
      return {
        ok: false,
        error: 'MISSING_ADVERTISER',
        message: 'Enter an advertiser id or slug for contacts.'
      };
    }

    var result = paginateRows_(function (page, limit) {
      return HiEnergyApi.advertiserContacts(normalized, page, limit);
    });
    if (!result.ok) {
      return result;
    }

    HiEnergyMcpExport.cacheAdvertiserContactsSearch(normalized, result);
    return mergeExportMeta_(
      createFromApiResult_('Contacts', normalized, 'get_advertiser_contacts', result.body),
      result.body
    );
  }

  function exportCachedAdvertiserContacts_() {
    var cached = HiEnergyMcpExport.readCachedAdvertiserContactsSearch();
    if (!cached || !cached.body) {
      return {
        ok: false,
        error: 'NO_CACHE',
        message: 'Fetch contacts first, then export the latest results.'
      };
    }
    return createFromApiResult_(
      'Contacts',
      cached.query,
      'get_advertiser_contacts',
      cached.body
    );
  }

  function exportGoogleContacts_(query) {
    var normalized = String(query || '').trim();
    if (!normalized) {
      return { ok: false, error: 'MISSING_QUERY', message: 'Enter a name, email, or company to search.' };
    }

    var result = HiEnergyContacts.searchForSheet(normalized);
    if (!result.ok) {
      return result;
    }

    HiEnergyMcpExport.cacheGoogleContactsSearch(normalized, result);
    return createFromGoogleContacts_(normalized, result.contacts || []);
  }

  function exportCachedGoogleContacts_() {
    var cached = HiEnergyMcpExport.readCachedGoogleContactsSearch();
    var contacts = (cached && cached.contacts) || [];
    if (!cached || !contacts.length) {
      return {
        ok: false,
        error: 'NO_CACHE',
        message: 'Search Google Contacts first, then export the latest results.'
      };
    }
    return createFromGoogleContacts_(cached.query, contacts);
  }

  function exportSearch_(query, scope, searchMode) {
    if (scope === 'advertisers') {
      return exportAdvertisers_(query, searchMode || 'name');
    }
    if (scope === 'deals') {
      return exportDeals_(query);
    }
    if (scope === 'transactions') {
      return exportTransactions_(query);
    }

    ensureAuthenticatedForExport_();

    var typesByScope = {
      advertisers: ['advertisers'],
      deals: ['deals'],
      transactions: ['transactions']
    };
    var types = typesByScope[scope] || null;
    var result = HiEnergyApi.universalSearch(query, types);
    if (!result.ok) {
      return result;
    }

    HiEnergyMcpExport.cacheSearchResult(query, scope, result);
    return createFromSearchResult_(query, result.body);
  }

  function ensureAuthenticatedForExport_() {
    if (!HiEnergyApi.hasAuth()) {
      if (HiEnergyAuth.isConfigured()) {
        HiEnergyAuth.requireAuthorization();
      }
    }
  }

  return {
    createFromTables: createFromTables_,
    createFromSearchResult: createFromSearchResult_,
    createFromMcpToolResult: createFromMcpToolResult_,
    exportCachedSearch: exportCachedSearch_,
    exportCachedMcpTool: exportCachedMcpTool_,
    exportCachedAdvertisers: exportCachedAdvertisers_,
    exportAdvertisers: exportAdvertisers_,
    exportDeals: exportDeals_,
    exportCachedDeals: exportCachedDeals_,
    exportTransactions: exportTransactions_,
    exportCachedTransactions: exportCachedTransactions_,
    exportAdvertiserContacts: exportAdvertiserContacts_,
    exportCachedAdvertiserContacts: exportCachedAdvertiserContacts_,
    exportGoogleContacts: exportGoogleContacts_,
    exportCachedGoogleContacts: exportCachedGoogleContacts_,
    exportSearch: exportSearch_,
    paginateRows: paginateRows_
  };
})();
