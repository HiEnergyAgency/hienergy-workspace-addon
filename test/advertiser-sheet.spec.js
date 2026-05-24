const { loadCoreProject, loadGasFiles, createGasContext } = require('./helpers/gas-runtime');

describe('HiEnergyApi.searchAdvertisers', function () {
  let ctx;
  let fetchMock;

  beforeEach(function () {
    fetchMock = vi.fn(function () {
      return {
        getResponseCode: function () {
          return 200;
        },
        getContentText: function () {
          return JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: {
              structuredContent: {
                data: [
                  {
                    id: '1',
                    attributes: {
                      display_name: 'Nike',
                      domain: 'nike.com',
                      network_name: 'Impact'
                    }
                  }
                ]
              }
            }
          });
        }
      };
    });

    ctx = loadCoreProject({ fetch: fetchMock });
  });

  it('calls the search_advertisers MCP tool with name and limit', function () {
    ctx.HiEnergyApi.searchAdvertisers('nike');

    const toolCalls = fetchMock.mock.calls.filter(function (call) {
      const payload = JSON.parse(call[1].payload);
      return payload.method === 'tools/call' && payload.params.name === 'search_advertisers';
    });
    expect(toolCalls.length).toBeGreaterThan(0);
    const payload = JSON.parse(toolCalls[0][1].payload);
    expect(payload.params.arguments.name).toBe('nike');
    expect(payload.params.arguments.limit).toBe(500);
  });

  it('returns advertiser rows from MCP structuredContent', function () {
    const result = ctx.HiEnergyApi.searchAdvertisers('nike');

    expect(result.ok).toBe(true);
    expect(result.body.data).toHaveLength(1);
    expect(result.body.data[0].attributes.display_name).toBe('Nike');
  });

  it('requires a query', function () {
    const result = ctx.HiEnergyApi.searchAdvertisers('  ');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('MISSING_QUERY');
  });
});

describe('HiEnergySheets.exportAdvertisers', function () {
  it('creates a sheet from advertiser API results', function () {
    const runtime = createAdvertiserSheetRuntime();
    loadAdvertiserSheetModules(runtime.context);

    runtime.context.HiEnergyApi = {
      hasAuth: function () {
        return true;
      },
      searchAdvertisers: function () {
        return {
          ok: true,
          body: {
            data: [
              {
                id: '1',
                attributes: {
                  display_name: 'Nike',
                  domain: 'nike.com',
                  network_name: 'Impact',
                  program_status: 'active',
                  commission_rate: '10%',
                  slug: 'nike',
                  url: 'https://app.hienergy.ai/advertisers/nike'
                }
              }
            ]
          }
        };
      }
    };

    const result = runtime.context.HiEnergySheets.exportAdvertisers('nike', 'name');
    expect(result.ok).toBe(true);
    expect(result.url).toContain('docs.google.com');
    expect(result.rowCount).toBe(1);
  });
});

describe('HiEnergyApi.searchDeals', function () {
  let ctx;
  let fetchMock;

  beforeEach(function () {
    fetchMock = vi.fn(function () {
      return {
        getResponseCode: function () {
          return 200;
        },
        getContentText: function () {
          return JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: {
              structuredContent: {
                data: [{ id: 'd1', attributes: { title: 'Spring sale' } }]
              }
            }
          });
        }
      };
    });

    ctx = loadCoreProject({ fetch: fetchMock });
  });

  it('calls search_deals with sheet row limit', function () {
    ctx.HiEnergyApi.searchDeals('coupon');

    const toolCalls = fetchMock.mock.calls.filter(function (call) {
      const payload = JSON.parse(call[1].payload);
      return payload.method === 'tools/call' && payload.params.name === 'search_deals';
    });
    const payload = JSON.parse(toolCalls[0][1].payload);
    expect(payload.params.arguments.q).toBe('coupon');
    expect(payload.params.arguments.limit).toBe(500);
  });
});

describe('HiEnergyMcpExport google contacts', function () {
  it('builds google contact tables', function () {
    const runtime = createGasContext({});
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs']);

    const tables = runtime.context.HiEnergyMcpExport.tablesFromGoogleContacts([
      {
        name: 'Jane Doe',
        email: 'jane@acme.com',
        organization: 'Acme',
        phone: '+1 555-0100',
        resourceName: 'people/c1'
      }
    ]);

    expect(tables[0].headers[0]).toBe('Advertiser Hi Energy link');
    expect(tables[0].headers[1]).toBe('Advertiser company');
    expect(tables[0].rows[0][1]).toBe('Acme');
    expect(tables[0].rows[0][2]).toBe('Jane Doe');
    expect(tables[0].rows[0][5]).toBe('jane@acme.com');
  });
});

function createAdvertiserSheetRuntime() {
  const { createGasContext } = require('./helpers/gas-runtime');
  const sheets = [];

  function createSheetMock() {
    return {
      setName: function () {},
      getRange: function () {
        return {
          setValues: function () {},
          setFontWeight: function () {}
        };
      },
      setFrozenRows: function () {}
    };
  }

  const runtime = createGasContext({});
  runtime.context.SpreadsheetApp = {
    create: function () {
      sheets.push(createSheetMock());
      return {
        getActiveSheet: function () {
          return sheets[0];
        },
        insertSheet: function () {
          const sheet = createSheetMock();
          sheets.push(sheet);
          return sheet;
        },
        getSpreadsheetTimeZone: function () {
          return 'America/Los_Angeles';
        },
        getUrl: function () {
          return 'https://docs.google.com/spreadsheets/d/adv123/edit';
        },
        getId: function () {
          return 'adv123';
        }
      };
    }
  };
  return runtime;
}

function loadAdvertiserSheetModules(context) {
  const { loadGasFiles } = require('./helpers/gas-runtime');
  loadGasFiles(context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);
}
