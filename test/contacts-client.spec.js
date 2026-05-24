const { loadGasFiles, createGasContext } = require('./helpers/gas-runtime');

describe('HiEnergyContacts', function () {
  it('returns MISSING_QUERY when search input is blank', function () {
    const ctx = createGasContext().context;
    loadGasFiles(ctx, ['Config.gs', 'ContactsClient.gs']);

    const result = ctx.HiEnergyContacts.search('   ');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('MISSING_QUERY');
  });

  it('returns MISSING_EMAIL when lookup input is blank', function () {
    const ctx = createGasContext().context;
    loadGasFiles(ctx, ['Config.gs', 'ContactsClient.gs']);

    const result = ctx.HiEnergyContacts.lookupByEmail('');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('MISSING_EMAIL');
  });

  it('normalizes People API search results', function () {
    const ctx = createGasContext({
      People: {
        People: {
          searchContacts: function () {
            return {
              results: [
                {
                  person: {
                    resourceName: 'people/c1',
                    names: [{ displayName: 'Jane Doe' }],
                    emailAddresses: [{ value: 'jane@acme.com' }],
                    organizations: [{ name: 'Acme' }],
                    phoneNumbers: [{ value: '+1 555-0100' }]
                  }
                }
              ]
            };
          }
        }
      }
    }).context;

    loadGasFiles(ctx, ['Config.gs', 'ContactsClient.gs']);

    const result = ctx.HiEnergyContacts.search('jane');
    expect(result.ok).toBe(true);
    expect(result.contacts[0].name).toBe('Jane Doe');
    expect(result.contacts[0].email).toBe('jane@acme.com');
    expect(result.contacts[0].organization).toBe('Acme');
  });
});
