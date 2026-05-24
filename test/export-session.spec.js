const { createGasContext, loadGasFiles } = require('./helpers/gas-runtime');

function setupSheetsHost(overrides) {
  overrides = overrides || {};
  const sheets = [];
  const spreadsheet = {
    getUrl: function () {
      return 'https://docs.google.com/spreadsheets/d/abc/edit';
    },
    getId: function () {
      return 'abc';
    },
    getSheetByName: function (name) {
      return sheets.find(function (s) {
        return s.name === name;
      });
    },
    insertSheet: function (name) {
      const sheet = {
        name: name,
        values: [],
        clear: function () {
          this.values = [];
        },
        getLastRow: function () {
          return this.values.length;
        },
        getRange: function () {
          const self = this;
          return {
            setValues: function (v) {
              v.forEach(function (row) {
                self.values.push(row);
              });
            },
            setFontWeight: function () {}
          };
        },
        setFrozenRows: function () {}
      };
      sheets.push(sheet);
      return sheet;
    }
  };

  const runtime = createGasContext({
    userProperties: { HIENERGY_HOST_APP: 'SHEETS' }
  });
  runtime.context.SpreadsheetApp = {
    getActiveSpreadsheet: function () {
      return spreadsheet;
    },
    create: function () {
      throw new Error('Should not create new sheet in active context');
    }
  };

  const apiCalls = [];
  runtime.context.HiEnergyApi = {
    searchAdvertisers: function (query, limit, page) {
      apiCalls.push({ tool: 'advertisers', page: page, limit: limit });
      const pageNum = page || 1;
      if (pageNum > 3) {
        return { ok: true, body: { data: [] } };
      }
      const rows = [];
      const count = pageNum === 3 ? 50 : 100;
      const start = (pageNum - 1) * 100;
      for (let i = 0; i < count; i += 1) {
        rows.push({ id: String(start + i + 1), attributes: { display_name: 'Row ' + (start + i + 1) } });
      }
      return { ok: true, body: { data: rows, meta: { total: 250 } } };
    },
    hasAuth: function () {
      return true;
    }
  };
  runtime.context.HiEnergyAuth = overrides.HiEnergyAuth || {
    isConfigured: function () {
      return true;
    },
    hasAccess: function () {
      return true;
    },
    requireAuthorization: function () {}
  };

  loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);
  return { ctx: runtime.context, sheets: sheets, apiCalls: apiCalls };
}

describe('exportPaginated + session', function () {
  it('walks every page of 100 until the API returns empty', function () {
    const { ctx, sheets, apiCalls } = setupSheetsHost();
    const result = ctx.HiEnergySheets.exportAdvertisers('nike', 'name');
    expect(result.ok).toBe(true);
    expect(result.rowCount).toBe(250);
    expect(apiCalls.length).toBeGreaterThanOrEqual(3);
    expect(sheets[0].values.length).toBeGreaterThanOrEqual(250);
  });
});

describe('exportMoreFromSession', function () {
  it('returns NO_SESSION when nothing has been exported yet', function () {
    const runtime = createGasContext({});
    runtime.context.HiEnergyApi = { hasAuth: function () { return true; } };
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);

    const result = runtime.context.HiEnergySheets.exportMoreFromSession(false);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('NO_SESSION');
  });

  it('reports EXHAUSTED when the saved session is finished', function () {
    const runtime = createGasContext({
      userProperties: {
        HIENERGY_EXPORT_SESSION: JSON.stringify({
          exportType: 'advertisers',
          query: 'nike',
          exhausted: true,
          nextPage: 4,
          seenKeys: []
        })
      }
    });
    runtime.context.HiEnergyApi = { hasAuth: function () { return true; } };
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);

    const result = runtime.context.HiEnergySheets.exportMoreFromSession(false);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('EXHAUSTED');
  });
});
