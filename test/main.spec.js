const { loadCoreProject } = require('./helpers/gas-runtime');

describe('buildMcpToolArgs_', function () {
  const ctx = loadCoreProject();

  it('maps universal_search to q and per_type_limit', function () {
    expect(ctx.buildMcpToolArgs_('universal_search', 'nike', {})).toEqual({
      q: 'nike',
      per_type_limit: 5
    });
  });

  it('maps domain tools to a domain argument', function () {
    expect(ctx.buildMcpToolArgs_('search_advertisers_by_domain', 'acme.com', {})).toEqual({
      domain: 'acme.com'
    });
  });

  it('maps get_advertiser_contacts to an advertiser argument', function () {
    expect(ctx.buildMcpToolArgs_('get_advertiser_contacts', 'aloyoga.com', {})).toEqual({
      advertiser: 'aloyoga.com'
    });
  });

  it('maps recommend_report to a goal argument', function () {
    expect(ctx.buildMcpToolArgs_('recommend_report', 'Top advertisers last 90 days', {})).toEqual({
      goal: 'Top advertisers last 90 days'
    });
  });
});
