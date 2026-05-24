const { loadGasFiles, createGasContext } = require('./helpers/gas-runtime');

describe('HiEnergyMcp', function () {
  it('returns API_UNAUTHORIZED and resets auth on HTTP 401', function () {
    const reset = vi.fn();
    const ctx = createGasContext({
      fetch: function () {
        return {
          getResponseCode: function () {
            return 401;
          },
          getContentText: function () {
            return JSON.stringify({ error: { message: 'Unauthorized' } });
          }
        };
      },
      HiEnergyAuth: {
        isConfigured: function () {
          return true;
        },
        hasAccess: function () {
          return true;
        },
        getAccessToken: function () {
          return 'expired-token';
        },
        reset: reset
      }
    }).context;

    loadGasFiles(ctx, ['Config.gs', 'McpClient.gs']);

    const result = ctx.HiEnergyMcp.callTool('universal_search', { q: 'nike' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('API_UNAUTHORIZED');
    expect(reset).toHaveBeenCalled();
  });

  it('strips empty arguments before calling tools', function () {
    const fetchMock = vi.fn(function () {
      return {
        getResponseCode: function () {
          return 200;
        },
        getContentText: function () {
          return JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} });
        }
      };
    });

    const ctx = createGasContext({ fetch: fetchMock }).context;
    loadGasFiles(ctx, ['Config.gs', 'McpClient.gs']);

    ctx.HiEnergyMcp.callTool('universal_search', {
      q: 'nike',
      types: '',
      empty: null
    });

    const toolCall = fetchMock.mock.calls.find(function (call) {
      const payload = JSON.parse(call[1].payload);
      return payload.method === 'tools/call';
    });
    expect(toolCall).toBeTruthy();
    const payload = JSON.parse(toolCall[1].payload);
    expect(payload.params.arguments).toEqual({ q: 'nike' });
  });

  it('uses the configured MCP URL', function () {
    const ctx = createGasContext().context;
    loadGasFiles(ctx, ['Config.gs', 'McpClient.gs']);
    expect(ctx.HiEnergyMcp.getMcpUrl()).toBe('https://app.hienergy.ai/mcp');
  });
});
