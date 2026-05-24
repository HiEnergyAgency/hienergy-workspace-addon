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

  it('appends with a range sized to the batch, not through the last row index', function () {
    var rangeCalls = [];
    var sheet = {
      name: 'Advertisers',
      getLastRow: function () {
        return 2200;
      },
      getLastColumn: function () {
        return 2;
      },
      getRange: function (row, col, numRows, numCols) {
        rangeCalls.push({ row: row, col: col, numRows: numRows, numCols: numCols });
        return {
          getValues: function () {
            return [['Name', 'Status']];
          },
          setValues: function (v) {
            sheet.appended = v;
          },
          setFontWeight: function () {}
        };
      },
      setFrozenRows: function () {}
    };
    var spreadsheet = {
      getUrl: function () {
        return 'https://docs.google.com/spreadsheets/d/active789/edit';
      },
      getId: function () {
        return 'active789';
      },
      getSheetByName: function () {
        return sheet;
      },
      insertSheet: function () {
        throw new Error('Should not insert when sheet exists');
      }
    };

    var runtime = createGasContext({
      userProperties: { HIENERGY_HOST_APP: 'SHEETS' }
    });
    runtime.context.SpreadsheetApp = {
      getActiveSpreadsheet: function () {
        return spreadsheet;
      },
      create: function () {
        throw new Error('Should not create a new spreadsheet');
      }
    };
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);

    var rows = [];
    for (var i = 0; i < 100; i += 1) {
      rows.push(['Row ' + i, 'active']);
    }

    var result = runtime.context.HiEnergySheets.createFromTables(
      'Test',
      [{ name: 'Advertisers', headers: ['Name', 'Status'], rows: rows }],
      { append: true }
    );

    expect(result.ok).toBe(true);
    expect(result.rowCount).toBe(100);
    expect(rangeCalls.length).toBeGreaterThan(0);
    var writeCall = rangeCalls[rangeCalls.length - 1];
    expect(writeCall.row).toBe(2201);
    expect(writeCall.numRows).toBe(100);
    expect(writeCall.numCols).toBe(2);
    expect(sheet.appended).toHaveLength(100);
  });
});
