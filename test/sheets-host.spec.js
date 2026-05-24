const { createGasContext, loadGasFiles } = require('./helpers/gas-runtime');

describe('HiEnergySheets in Sheets host', function () {
  it('writes export tabs into the active spreadsheet when host is SHEETS', function () {
    const sheets = [];
    const spreadsheet = {
      getUrl: function () {
        return 'https://docs.google.com/spreadsheets/d/active123/edit';
      },
      getId: function () {
        return 'active123';
      },
      getSheetByName: function (name) {
        return sheets.find(function (s) {
          return s.name === name;
        });
      },
      insertSheet: function (name) {
        const sheet = {
          name: name,
          cleared: false,
          values: null,
          clear: function () {
            this.cleared = true;
          },
          getRange: function () {
            return {
              setValues: function (v) {
                sheet.values = v;
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
        throw new Error('Should not create a new spreadsheet in Sheets host');
      }
    };
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);

    const result = runtime.context.HiEnergySheets.createFromTables('Test', [
      {
        name: 'Advertisers',
        headers: ['Name'],
        rows: [['Acme']]
      }
    ]);

    expect(result.ok).toBe(true);
    expect(result.usedActiveSpreadsheet).toBe(true);
    expect(result.url).toContain('active123');
    expect(sheets).toHaveLength(1);
    expect(sheets[0].values[0][0]).toBe('Name');
    expect(sheets[0].values[1][0]).toBe('Acme');
  });

  it('writes into the active spreadsheet even when cached host is GMAIL', function () {
    const sheets = [];
    const spreadsheet = {
      getUrl: function () {
        return 'https://docs.google.com/spreadsheets/d/active456/edit';
      },
      getId: function () {
        return 'active456';
      },
      getSheetByName: function () {
        return null;
      },
      insertSheet: function (name) {
        const sheet = {
          name: name,
          values: null,
          clear: function () {},
          getRange: function () {
            return {
              setValues: function (v) {
                sheet.values = v;
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
      userProperties: { HIENERGY_HOST_APP: 'GMAIL' }
    });
    runtime.context.SpreadsheetApp = {
      getActiveSpreadsheet: function () {
        return spreadsheet;
      },
      create: function () {
        throw new Error('Should not create a new spreadsheet when active sheet is open');
      }
    };
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);

    const result = runtime.context.HiEnergySheets.createFromTables('Test', [
      { name: 'Deals', headers: ['Title'], rows: [['Sale']] }
    ]);

    expect(result.usedActiveSpreadsheet).toBe(true);
    expect(result.url).toContain('active456');
  });
});
