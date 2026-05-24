const { createGasContext, loadGasFiles } = require('./helpers/gas-runtime');

describe('resolveHostApp_', function () {
  let ctx;

  beforeEach(function () {
    const runtime = createGasContext({
      userProperties: { HIENERGY_HOST_APP: 'SHEETS' }
    });
    loadGasFiles(runtime.context, ['Config.gs', 'Main.gs']);
    ctx = runtime.context;
  });

  it('reads hostApp from commonEventObject and caches it', function () {
    const host = ctx.resolveHostApp_({
      commonEventObject: { hostApp: 'GMAIL' }
    });
    expect(host).toBe('GMAIL');
    expect(ctx.PropertiesService.getUserProperties().getProperty('HIENERGY_HOST_APP')).toBe('GMAIL');
  });

  it('falls back to cached host when event omits hostApp', function () {
    ctx.PropertiesService.getUserProperties().setProperty('HIENERGY_HOST_APP', 'SHEETS');
    expect(ctx.resolveHostApp_({})).toBe('SHEETS');
  });

  it('reads hostApp from action parameters', function () {
    expect(ctx.resolveHostApp_({ parameters: { hostApp: 'SHEETS' } })).toBe('SHEETS');
  });
});
