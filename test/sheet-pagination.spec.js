const { createGasContext, loadGasFiles } = require('./helpers/gas-runtime');

function loadSheets(overrides) {
  const runtime = createGasContext(overrides);
  loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'SheetsClient.gs']);
  return runtime.context;
}

describe('HiEnergySheets.paginateRows', function () {
  it('walks pages until results are exhausted', function () {
    // Simulate a server that caps a single response at 100 rows even when
    // the client asks for more, but reports an accurate total so the
    // paginator keeps walking pages until everything is fetched.
    const ctx = loadSheets();
    const calls = [];
    let rowId = 0;
    const serverPageCap = 100;
    const totalAvailable = 230;
    const fetcher = function (page, limit) {
      calls.push({ page: page, limit: limit });
      if (rowId >= totalAvailable) {
        return { ok: true, body: { data: [], meta: { total: totalAvailable } } };
      }
      const rows = [];
      const want = Math.min(serverPageCap, limit, totalAvailable - rowId);
      for (let i = 0; i < want; i += 1) {
        rowId += 1;
        rows.push({ id: String(rowId), attributes: { name: 'Row ' + rowId } });
      }
      return { ok: true, body: { data: rows, meta: { total: totalAvailable } } };
    };

    const result = ctx.HiEnergySheets.paginateRows(fetcher);
    expect(result.ok).toBe(true);
    expect(result.body.data).toHaveLength(totalAvailable);
    expect(result.body.meta.total).toBe(totalAvailable);
    expect(result.body.meta.fetched).toBe(totalAvailable);
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });

  it('caps at sheetRowLimit (500) even when more rows are available', function () {
    const ctx = loadSheets();
    let rowId = 0;
    const fetcher = function (_page, limit) {
      const rows = [];
      for (let i = 0; i < limit; i += 1) {
        rowId += 1;
        rows.push({ id: String(rowId), attributes: { name: 'Row ' + rowId } });
      }
      return { ok: true, body: { data: rows, meta: { total: 5000 } } };
    };

    const result = ctx.HiEnergySheets.paginateRows(fetcher);
    expect(result.body.data).toHaveLength(500);
    expect(result.body.meta.truncatedAt).toBe(500);
  });

  it('dedupes rows by id across pages', function () {
    const ctx = loadSheets();
    const fetcher = function (page, limit) {
      const rows = [];
      const startId = page === 1 ? 1 : limit; // page 2 overlaps the last id of page 1
      for (let i = 0; i < limit; i += 1) {
        rows.push({ id: String(startId + i) });
      }
      if (page > 2) {
        return { ok: true, body: { data: [] } };
      }
      return { ok: true, body: { data: rows } };
    };

    const result = ctx.HiEnergySheets.paginateRows(fetcher);
    const ids = result.body.data.map(function (r) { return r.id; });
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('100');
    expect(ids).toContain('199');
    expect(ids.length).toBeGreaterThan(100);
  });

  it('stops paginating when the server total is reached', function () {
    const ctx = loadSheets();
    const calls = [];
    const fetcher = function (page) {
      calls.push(page);
      if (page === 1) {
        return {
          ok: true,
          body: {
            data: [{ id: '1' }, { id: '2' }, { id: '3' }],
            meta: { total: 3 }
          }
        };
      }
      return { ok: true, body: { data: [{ id: 'should-not-be-fetched' }] } };
    };

    const result = ctx.HiEnergySheets.paginateRows(fetcher);
    expect(result.body.data).toHaveLength(3);
    expect(calls).toEqual([1]);
  });

  it('returns the underlying error when first page fails', function () {
    const ctx = loadSheets();
    const fetcher = function () {
      return { ok: false, error: 'AUTH_REQUIRED', message: 'Sign in' };
    };
    const result = ctx.HiEnergySheets.paginateRows(fetcher);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('AUTH_REQUIRED');
  });

  it('fetches the next page when the first page returns fewer rows than requested', function () {
    const ctx = loadSheets();
    const fetcher = function (page) {
      if (page === 1) {
        const rows = [];
        for (let i = 0; i < 15; i += 1) {
          rows.push({ id: String(i) });
        }
        return { ok: true, body: { data: rows } };
      }
      if (page === 2) {
        const rows = [];
        for (let i = 15; i < 30; i += 1) {
          rows.push({ id: String(i) });
        }
        return { ok: true, body: { data: rows } };
      }
      return { ok: true, body: { data: [] } };
    };

    const result = ctx.HiEnergySheets.paginateRows(fetcher);
    expect(result.body.data).toHaveLength(30);
    expect(result.pagination.exhausted).toBe(true);
  });

  it('keeps partial results when a later page fails', function () {
    const ctx = loadSheets();
    const firstPageRows = 100;
    const fetcher = function (page) {
      if (page === 1) {
        const rows = [];
        for (let i = 0; i < firstPageRows; i += 1) {
          rows.push({ id: String(i + 1) });
        }
        // Server reports a much larger total so paginator tries page 2.
        return { ok: true, body: { data: rows, meta: { total: 5000 } } };
      }
      return { ok: false, error: 'API_RATE_LIMITED' };
    };
    const result = ctx.HiEnergySheets.paginateRows(fetcher);
    expect(result.ok).toBe(true);
    expect(result.body.data).toHaveLength(firstPageRows);
  });
});
