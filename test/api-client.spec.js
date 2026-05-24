const { loadCoreProject } = require('./helpers/gas-runtime');

describe('HiEnergyApi.universalSearch', function () {
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
                results: {
                  advertisers: {
                    data: [{ id: '1', attributes: { display_name: 'Nike' } }],
                    total: 1
                  }
                }
              }
            }
          });
        }
      };
    });

    ctx = loadCoreProject({ fetch: fetchMock });
  });

  it('calls the universal_search MCP tool with query and limit', function () {
    ctx.HiEnergyApi.universalSearch('nike');

    const toolCalls = fetchMock.mock.calls.filter(function (call) {
      const payload = JSON.parse(call[1].payload);
      return payload.method === 'tools/call' && payload.params.name === 'universal_search';
    });
    expect(toolCalls.length).toBeGreaterThan(0);
    const payload = JSON.parse(toolCalls[0][1].payload);
    expect(payload.method).toBe('tools/call');
    expect(payload.params.name).toBe('universal_search');
    expect(payload.params.arguments.q).toBe('nike');
    expect(payload.params.arguments.per_type_limit).toBe(5);
  });

  it('passes a types filter for advertiser-only search', function () {
    ctx.HiEnergyApi.universalSearch('nike', ['advertisers']);

    const toolCalls = fetchMock.mock.calls.filter(function (call) {
      const payload = JSON.parse(call[1].payload);
      return payload.method === 'tools/call' && payload.params.name === 'universal_search';
    });
    const payload = JSON.parse(toolCalls[0][1].payload);
    expect(payload.params.arguments.types).toBe('advertisers');
  });

  it('normalizes MCP structuredContent into search results', function () {
    const result = ctx.HiEnergyApi.universalSearch('nike');

    expect(result.ok).toBe(true);
    expect(result.body.results.advertisers.data).toHaveLength(1);
    expect(result.body.results.advertisers.data[0].attributes.display_name).toBe('Nike');
  });

  it('wraps flat MCP rows in attributes for card rendering', function () {
    fetchMock.mockImplementation(function () {
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
                results: {
                  advertisers: {
                    data: [{ id: '9', display_name: 'Flat Co', domain: 'flat.co' }],
                    total: 1
                  }
                }
              }
            }
          });
        }
      };
    });

    const result = ctx.HiEnergyApi.universalSearch('flat');
    expect(result.body.results.advertisers.data[0].attributes.display_name).toBe('Flat Co');
    expect(result.body.results.advertisers.data[0].attributes.domain).toBe('flat.co');
  });

  it('falls back to api_request when universal_search returns an invalid body', function () {
    fetchMock.mockImplementation(function (_url, options) {
      const payload = JSON.parse(options.payload);
      if (payload.method === 'tools/call' && payload.params.name === 'universal_search') {
        return {
          getResponseCode: function () {
            return 200;
          },
          getContentText: function () {
            return JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              result: { structuredContent: { unexpected: true } }
            });
          }
        };
      }

      if (payload.method === 'tools/call' && payload.params.name === 'api_request') {
        return {
          getResponseCode: function () {
            return 200;
          },
          getContentText: function () {
            return JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              result: {
                structuredContent: {
                  results: {
                    deals: { data: [{ id: 'd1' }], total: 1 }
                  }
                }
              }
            });
          }
        };
      }

      return {
        getResponseCode: function () {
          return 200;
        },
        getContentText: function () {
          return JSON.stringify({ jsonrpc: '2.0', id: 0, result: {} });
        }
      };
    });

    const result = ctx.HiEnergyApi.universalSearch('coupon');
    expect(result.ok).toBe(true);
    expect(result.body.results.deals.data).toHaveLength(1);
  });
});

describe('HiEnergyApi auth gates', function () {
  it('requires auth before listing MCP tools', function () {
    const ctx = loadCoreProject({
      HiEnergyAuth: {
        isConfigured: function () {
          return true;
        },
        hasAccess: function () {
          return false;
        },
        getAccessToken: function () {
          return null;
        },
        reset: function () {}
      }
    });

    const result = ctx.HiEnergyApi.listMcpTools();
    expect(result.ok).toBe(false);
    expect(result.error).toBe('AUTH_REQUIRED');
  });
});
