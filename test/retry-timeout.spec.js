const { createGasContext, loadGasFiles, loadCoreProject } = require('./helpers/gas-runtime');

describe('paginateRows_ time budget', function () {
  it('stops paginating when the deadline is exceeded and reports timedOut', function () {
    const runtime = createGasContext({});
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);

    let now = 1_000_000;
    const realDateNow = Date.now;
    Date.now = function () { return now; };

    let page = 0;
    const fetcher = function (p, limit) {
      page = p;
      // each fetch consumes 6 seconds of wall-clock budget
      now += 6000;
      const rows = [];
      for (let i = 0; i < limit; i += 1) {
        rows.push({ id: String((p - 1) * limit + i + 1) });
      }
      return { ok: true, body: { data: rows, meta: { total: 10000 } } };
    };

    try {
      const result = runtime.context.HiEnergySheets.paginateRows(fetcher, {
        fetchAll: true,
        timeBudgetMs: 10000
      });
      expect(result.pagination.timedOut).toBe(true);
      expect(result.pagination.exhausted).toBe(false);
      expect(result.pagination.nextPage).toBeGreaterThan(1);
      expect(page).toBeLessThan(5);
    } finally {
      Date.now = realDateNow;
    }
  });
});

describe('MCP fetch retry', function () {
  it('retries 5xx responses before giving up', function () {
    let attempts = 0;
    const fetchMock = function () {
      attempts += 1;
      if (attempts < 3) {
        return {
          getResponseCode: function () { return 503; },
          getContentText: function () { return ''; }
        };
      }
      return {
        getResponseCode: function () { return 200; },
        getContentText: function () {
          return JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { structuredContent: { ok: true } }
          });
        }
      };
    };
    const ctx = loadCoreProject({ fetch: fetchMock });
    const result = ctx.HiEnergyMcp.callTool('search_advertisers', { name: 'nike' });
    expect(attempts).toBeGreaterThanOrEqual(3);
    expect(result.ok).toBe(true);
  });

  it('returns a NETWORK_ERROR when fetch throws repeatedly', function () {
    const fetchMock = function () {
      throw new Error('boom');
    };
    const ctx = loadCoreProject({ fetch: fetchMock });
    const result = ctx.HiEnergyMcp.callTool('search_advertisers', { name: 'nike' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('NETWORK_ERROR');
  });
});
