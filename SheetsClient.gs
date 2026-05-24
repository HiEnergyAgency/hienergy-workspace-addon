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

  function activeSpreadsheet_() {
    try {
      return SpreadsheetApp.getActiveSpreadsheet();
    } catch (err) {
      return null;
    }
  }

  function useActiveSpreadsheet_() {
    if (activeSpreadsheet_()) {
      return true;
    }
    return PropertiesService.getUserProperties().getProperty(HiEnergyConfig.propHostApp) === 'SHEETS';
  }

  function writeTablesToSpreadsheet_(spreadsheet, tables, options) {
    options = options || {};
    var totalRows = 0;
    tables.forEach(function (table) {
      var sheetName = sanitizeSheetName_(table.name);
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        totalRows += writeTable_(sheet, table.headers, table.rows);
        return;
      }
      if (options.append) {
        totalRows += appendRowsToSheet_(sheet, table.headers, table.rows);
        return;
      }
      sheet.clear();
      totalRows += writeTable_(sheet, table.headers, table.rows);
    });
    return {
      ok: true,
      url: spreadsheet.getUrl(),
      spreadsheetId: spreadsheet.getId(),
      sheetCount: tables.length,
      rowCount: totalRows,
      usedActiveSpreadsheet: true,
      appended: !!options.append
    };
  }

  function appendRowsToSheet_(sheet, headers, rows) {
    if (!rows || !rows.length) {
      return 0;
    }
    var lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      return writeTable_(sheet, headers, rows);
    }
    var startRow = lastRow + 1;
    sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);
    return rows.length;
  }

  function mergeExportMeta_(exportResult, paginatedBody, paginationState) {
    if (!exportResult || !exportResult.ok) {
      return exportResult;
    }
    if (paginatedBody && paginatedBody.meta) {
      var meta = paginatedBody.meta;
      exportResult.fetchedRows = meta.fetched;
      exportResult.totalAvailable = meta.total;
      exportResult.truncated =
        meta.hasMore ||
        (typeof meta.total === 'number' && meta.total > meta.fetched);
    }
    if (paginationState) {
      exportResult.hasMore = !paginationState.exhausted;
      exportResult.exhausted = !!paginationState.exhausted;
      exportResult.rowsThisBatch = paginationState.rowsThisBatch || exportResult.rowCount;
    }
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
      var active = activeSpreadsheet_();
      if (active) {
        return writeTablesToSpreadsheet_(active, tables);
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

  function rowDedupeKey_(row) {
    var rowId = row && (row.id || (row.attributes && row.attributes.id));
    if (rowId) {
      return 'id:' + rowId;
    }
    return 'hash:' + JSON.stringify(row);
  }

  function rebuildSeen_(seenKeys) {
    var seen = {};
    (seenKeys || []).forEach(function (key) {
      seen[key] = true;
    });
    return seen;
  }

  function paginateRows_(fetchPage, options) {
    options = options || {};
    var maxRows = options.maxRows !== undefined ? options.maxRows : HiEnergyConfig.sheetRowLimit;
    var fetchAll = options.fetchAll === true;
    if (fetchAll) {
      maxRows = 0;
    }
    var unlimited = maxRows <= 0;
    var pageSize = HiEnergyConfig.exportPageSize || 100;
    var maxPages = options.maxPages || HiEnergyConfig.exportMaxPages || 50;
    var startPage = options.startPage || 1;
    var seen = options.seen || rebuildSeen_(options.seenKeys);
    var collected = [];
    var batchRows = [];
    var totalFromServer = null;
    var exhausted = false;
    var lastPageFetched = startPage - 1;

    for (var page = startPage; page < startPage + maxPages; page += 1) {
      if (!unlimited && collected.length >= maxRows) {
        break;
      }

      var remaining = unlimited ? pageSize : maxRows - collected.length;
      var pageLimit = Math.min(pageSize, remaining > 0 ? remaining : pageSize);

      var result = fetchPage(page, pageLimit);
      if (!result || !result.ok) {
        if (batchRows.length || collected.length) {
          exhausted = true;
          break;
        }
        return result;
      }

      var lastBody = result.body || {};
      var rows = extractRows_(lastBody);
      if (!rows.length) {
        exhausted = true;
        break;
      }

      var addedThisPage = 0;
      for (var i = 0; i < rows.length; i += 1) {
        if (!unlimited && collected.length >= maxRows) {
          break;
        }
        var row = rows[i];
        var key = rowDedupeKey_(row);
        if (seen[key]) {
          continue;
        }
        seen[key] = true;
        collected.push(row);
        batchRows.push(row);
        addedThisPage += 1;
      }

      lastPageFetched = page;

      var serverTotal = extractTotal_(lastBody);
      if (typeof serverTotal === 'number') {
        totalFromServer = serverTotal;
        if (collected.length >= serverTotal) {
          exhausted = true;
          break;
        }
      }

      if (addedThisPage === 0) {
        exhausted = true;
        break;
      }
    }

    var seenKeyList = Object.keys(seen);
    var hasMore = !exhausted;

    return {
      ok: true,
      body: {
        data: batchRows,
        meta: {
          total: typeof totalFromServer === 'number' ? totalFromServer : null,
          fetched: batchRows.length,
          cumulative: collected.length,
          hasMore: hasMore,
          truncatedAt: unlimited ? null : HiEnergyConfig.sheetRowLimit
        }
      },
      pagination: {
        nextPage: lastPageFetched + 1,
        seenKeys: seenKeyList,
        exhausted: exhausted,
        hasMore: hasMore,
        totalCollected: collected.length
      }
    };
  }

  function buildFetchPageForExport_(exportType, params) {
    var query = params.query || '';
    if (exportType === 'advertisers') {
      return function (page, limit) {
        return HiEnergyApi.searchAdvertisers(query, limit, page);
      };
    }
    if (exportType === 'deals') {
      return function (page, limit) {
        return HiEnergyApi.searchDeals(query, limit, page);
      };
    }
    if (exportType === 'transactions') {
      return function (page, limit) {
        return HiEnergyApi.searchTransactions({
          q: query || undefined,
          advertiserId: params.advertiserId || undefined,
          days: params.days || 30,
          limit: limit,
          page: page
        });
      };
    }
    if (exportType === 'contacts') {
      return function (page, limit) {
        return HiEnergyApi.advertiserContacts(query, page, limit);
      };
    }
    return null;
  }

  function toolNameForExport_(exportType) {
    var map = {
      advertisers: 'search_advertisers',
      deals: 'search_deals',
      transactions: 'search_transactions',
      contacts: 'get_advertiser_contacts'
    };
    return map[exportType] || 'mcp_export';
  }

  function sheetLabelForExport_(exportType) {
    var map = {
      advertisers: 'Advertisers',
      deals: 'Deals',
      transactions: 'Transactions',
      contacts: 'Contacts'
    };
    return map[exportType] || 'Export';
  }

  function saveExportSession_(exportType, params, pagination, spreadsheetId) {
    HiEnergyMcpExport.saveExportSession({
      exportType: exportType,
      query: params.query || '',
      searchMode: params.searchMode || 'name',
      transactionDays: params.days || 30,
      advertiserId: params.advertiserId || '',
      toolName: toolNameForExport_(exportType),
      sheetTabName: sheetLabelForExport_(exportType),
      spreadsheetId: spreadsheetId || '',
      nextPage: pagination.nextPage,
      seenKeys: pagination.seenKeys,
      exhausted: pagination.exhausted,
      totalCollected: pagination.totalCollected || 0
    });
  }

  function writeExportTables_(tables, title, options) {
    options = options || {};
    var active = activeSpreadsheet_();
    if (active) {
      var written = writeTablesToSpreadsheet_(active, tables, { append: !!options.append });
      if (!options.skipSession && options.exportType && options.pagination) {
        saveExportSession_(options.exportType, options.params || {}, options.pagination, written.spreadsheetId);
      }
      return written;
    }
    return createFromTables_(title, tables);
  }

  function exportPaginated_(exportType, params, options) {
    options = options || {};
    var fetchPage = buildFetchPageForExport_(exportType, params);
    if (!fetchPage) {
      return { ok: false, error: 'UNSUPPORTED_EXPORT', message: 'Unsupported export type.' };
    }

    var paginateOptions = {
      maxRows: options.fetchAll ? 0 : HiEnergyConfig.sheetRowLimit,
      fetchAll: !!options.fetchAll,
      startPage: options.startPage || 1,
      seenKeys: options.seenKeys || null,
      seen: options.seen || null,
      maxPages: options.maxPages
    };

    var result = paginateRows_(fetchPage, paginateOptions);
    if (!result.ok) {
      return result;
    }

    var batch = result.body.data || [];
    if (!batch.length && result.pagination.exhausted) {
      return {
        ok: false,
        error: 'NO_DATA',
        message: 'No more rows to export.'
      };
    }

    var tables = HiEnergyMcpExport.tablesFromMcpResult(toolNameForExport_(exportType), {
      data: batch
    });
    if (!tables.length) {
      return { ok: false, error: 'NO_DATA', message: 'No rows to export.' };
    }

    var title = HiEnergyMcpExport.createSheetTitle(
      sheetLabelForExport_(exportType),
      params.query,
      params.suffix
    );
    var written = writeExportTables_(tables, title, {
      append: !!options.append,
      exportType: exportType,
      params: params,
      pagination: result.pagination,
      skipSession: !!options.skipSession
    });

    return mergeExportMeta_(written, result.body, {
      exhausted: result.pagination.exhausted,
      hasMore: result.pagination.hasMore,
      rowsThisBatch: batch.length
    });
  }

  function exportMoreFromSession_(fetchAll) {
    var session = HiEnergyMcpExport.readExportSession();
    if (!session) {
      return {
        ok: false,
        error: 'NO_SESSION',
        message: 'Run an export first, then use Add more rows.'
      };
    }
    if (session.exhausted) {
      return {
        ok: false,
        error: 'EXHAUSTED',
        message: 'All available rows have already been exported.'
      };
    }

    var params = {
      query: session.query,
      searchMode: session.searchMode,
      days: session.transactionDays,
      advertiserId: session.advertiserId
    };

    return exportPaginated_(session.exportType, params, {
      append: true,
      startPage: session.nextPage,
      seenKeys: session.seenKeys,
      fetchAll: !!fetchAll,
      maxPages: fetchAll ? HiEnergyConfig.exportMaxPages : null
    });
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
    if (mode === 'domain') {
      var domainResult = HiEnergyApi.advertiserByDomain(normalized);
      if (!domainResult.ok) {
        return domainResult;
      }
      HiEnergyMcpExport.cacheAdvertiserSearch(normalized, mode, domainResult);
      var domainSheet = createFromAdvertiserSearch_(normalized, mode, domainResult.body);
      HiEnergyMcpExport.saveExportSession({
        exportType: 'advertisers',
        query: normalized,
        searchMode: 'domain',
        toolName: 'search_advertisers_by_domain',
        sheetTabName: 'Advertisers',
        exhausted: true,
        nextPage: 1,
        seenKeys: [],
        totalCollected: domainSheet.rowCount || 0
      });
      return domainSheet;
    }

    var exported = exportPaginated_('advertisers', { query: normalized, searchMode: mode });
    if (exported.ok) {
      HiEnergyMcpExport.cacheAdvertiserSearch(normalized, mode, {
        ok: true,
        body: { data: [], meta: { fetched: exported.rowCount } }
      });
    }
    return exported;
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

    var exported = exportPaginated_('deals', { query: normalized });
    if (exported.ok) {
      HiEnergyMcpExport.cacheDealsSearch(normalized, { ok: true, body: { data: [] } });
    }
    return exported;
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
    var exported = exportPaginated_('transactions', {
      query: normalized,
      days: dayRange,
      advertiserId: advertiser,
      suffix: dayRange + ' days'
    });
    if (exported.ok) {
      HiEnergyMcpExport.cacheTransactionsSearch(normalized || 'Recent', { ok: true, body: { data: [] } }, {
        days: dayRange
      });
    }
    return exported;
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

    var exported = exportPaginated_('contacts', { query: normalized });
    if (exported.ok) {
      HiEnergyMcpExport.cacheAdvertiserContactsSearch(normalized, { ok: true, body: { data: [] } });
    }
    return exported;
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

    if (scope === 'contacts' || scope === 'advertiser_contacts') {
      return exportAdvertiserContacts_(query);
    }

    ensureAuthenticatedForExport_();

    if (scope === 'all') {
      var combinedBody = { results: {} };
      var totalRows = 0;
      var lastExport = null;
      ['advertisers', 'deals', 'transactions'].forEach(function (type, index) {
        var part = exportPaginated_(type, { query: query }, {
          skipSession: true,
          append: index > 0
        });
        if (part.ok) {
          lastExport = part;
          totalRows += part.rowCount || 0;
        }
      });
      if (!lastExport || !lastExport.ok) {
        return lastExport || { ok: false, error: 'NO_DATA', message: 'No rows to export.' };
      }
      HiEnergyMcpExport.saveExportSession({
        exportType: 'all',
        query: query,
        toolName: 'universal_search',
        sheetTabName: 'Advertisers',
        exhausted: false,
        nextPage: 1,
        seenKeys: [],
        totalCollected: totalRows
      });
      lastExport.hasMore = true;
      lastExport.sheetCount = 3;
      return lastExport;
    }

    var typesByScope = {
      advertisers: 'advertisers',
      deals: 'deals',
      transactions: 'transactions'
    };
    var exportType = typesByScope[scope];
    if (exportType) {
      return exportPaginated_(exportType, { query: query, searchMode: searchMode || 'name' });
    }

    return { ok: false, error: 'UNSUPPORTED_SCOPE', message: 'Unsupported export scope.' };
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
    exportMoreFromSession: exportMoreFromSession_,
    paginateRows: paginateRows_
  };
})();
