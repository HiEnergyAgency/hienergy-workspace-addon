const { loadGasFiles, createGasContext } = require('./helpers/gas-runtime');

describe('HiEnergyMcpExport', function () {
  let ctx;

  beforeEach(function () {
    const runtime = createGasContext({});
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs']);
    ctx = runtime.context;
  });

  it('flattens universal search results into sheet tables', function () {
    const tables = ctx.HiEnergyMcpExport.tablesFromSearchBody({
      results: {
        advertisers: {
          data: [
            {
              id: '1',
              attributes: {
                display_name: 'Acme',
                domain: 'acme.com',
                network_name: 'Impact',
                program_status: 'active',
                commission_rate: '10%'
              }
            }
          ],
          total: 1
        },
        deals: {
          data: [
            {
              id: '2',
              attributes: {
                title: 'Spring sale',
                advertiser_name: 'Acme',
                country: 'US',
                status: 'live'
              }
            }
          ],
          total: 1
        }
      }
    });

    expect(tables).toHaveLength(2);
    expect(tables[0].headers[0]).toBe('Hi Energy link');
    expect(tables[0].rows[0][0]).toBe('https://app.hienergy.ai/a/1');
    expect(tables[0].rows[0][1]).toBe('Acme');
    expect(tables[1].headers[0]).toBe('Hi Energy admin link');
    expect(tables[1].rows[0][0]).toBe('https://app.hienergy.ai/admin/deals/2');
    expect(tables[1].rows[0][2]).toBe('Spring sale');
  });

  it('builds a partnership draft from advertiser context', function () {
    const draft = ctx.HiEnergyMcpExport.buildPartnershipDraft({
      recipientEmail: 'partner@acme.com',
      recipientName: 'Alex',
      advertiser: {
        data: {
          attributes: {
            display_name: 'Acme',
            network_name: 'Impact',
            commission_rate: '10%'
          }
        }
      },
      deals: [
        {
          attributes: {
            title: 'Spring sale',
            country: 'US'
          }
        }
      ]
    });

    expect(draft.to).toBe('partner@acme.com');
    expect(draft.subject).toContain('Acme');
    expect(draft.body).toContain('Hi Alex');
    expect(draft.body).toContain('Spring sale');
  });

  it('exports contacts with advertiser link first plus given name and LinkedIn', function () {
    const tables = ctx.HiEnergyMcpExport.tablesFromMcpResult('get_advertiser_contacts', {
      data: [
        {
          id: 'c1',
          attributes: {
            given_name: 'Alex',
            family_name: 'Smith',
            email: 'alex@nike.com',
            advertiser_id: 'nike',
            advertiser_name: 'Nike',
            linkedin_url: 'https://www.linkedin.com/in/alexsmith'
          }
        }
      ]
    });

    expect(tables[0].headers[0]).toBe('Advertiser Hi Energy link');
    expect(tables[0].headers[1]).toBe('Advertiser company');
    expect(tables[0].headers[2]).toBe('Name');
    expect(tables[0].headers[3]).toBe('Given name');
    expect(tables[0].headers[9]).toBe('LinkedIn profile');
    expect(tables[0].rows[0][0]).toBe('https://app.hienergy.ai/a/nike');
    expect(tables[0].rows[0][1]).toBe('Nike');
    expect(tables[0].rows[0][2]).toBe('Alex Smith');
    expect(tables[0].rows[0][3]).toBe('Alex');
    expect(tables[0].rows[0][9]).toBe('https://www.linkedin.com/in/alexsmith');
  });

  it('fills advertiser company from export query when contact rows omit it', function () {
    const tables = ctx.HiEnergyMcpExport.tablesFromMcpResult(
      'get_advertiser_contacts',
      {
        data: [
          {
            id: 'c2',
            attributes: {
              given_name: 'Sam',
              email: 'sam@nike.com',
              advertiser_id: 'nike'
            }
          }
        ]
      },
      { advertiserCompanyFallback: 'Nike' }
    );

    expect(tables[0].rows[0][1]).toBe('Nike');
  });
});

describe('HiEnergySheets', function () {
  it('creates a spreadsheet from tabular MCP data', function () {
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
            return 'https://docs.google.com/spreadsheets/d/test123/edit';
          },
          getId: function () {
            return 'test123';
          }
        };
      }
    };

    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);

    const result = runtime.context.HiEnergySheets.createFromTables('Test export', [
      {
        name: 'Advertisers',
        headers: ['Name', 'Domain'],
        rows: [['Acme', 'acme.com']]
      }
    ]);

    expect(result.ok).toBe(true);
    expect(result.url).toContain('docs.google.com');
    expect(result.rowCount).toBe(1);
  });
});

describe('HiEnergyGmailDrafts', function () {
  it('creates a Gmail draft', function () {
    const runtime = createGasContext({
      GmailApp: {
        createDraft: function () {
          return {
            getId: function () {
              return 'draft123';
            },
            getMessage: function () {
              return {
                getId: function () {
                  return 'msg123';
                }
              };
            }
          };
        }
      }
    });

    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'GmailDrafts.gs']);

    const result = runtime.context.HiEnergyGmailDrafts.createDraft(
      'partner@acme.com',
      'Hello',
      'Body text'
    );

    expect(result.ok).toBe(true);
    expect(result.draftId).toBe('draft123');
    expect(result.gmailUrl).toContain('drafts');
  });
});
