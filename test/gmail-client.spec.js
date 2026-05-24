const { loadGasFiles, createGasContext } = require('./helpers/gas-runtime');

function mockMessage(overrides) {
  return Object.assign(
    {
      getId: function () {
        return 'msg-1';
      },
      getFrom: function () {
        return 'Jane Doe <jane@acme.com>';
      },
      getSubject: function () {
        return 'Partnership opportunity';
      },
      getDate: function () {
        return new Date('2026-01-15T12:00:00Z');
      },
      getPlainBody: function () {
        return 'Hello from https://www.acme.com/partners';
      },
      getThread: function () {
        return { getId: function () { return 'thread-1'; } };
      }
    },
    overrides || {}
  );
}

describe('HiEnergyGmail', function () {
  it('extracts sender and domain from a Gmail event', function () {
    const message = mockMessage();
    const ctx = createGasContext({
      GmailApp: {
        getMessageById: function () {
          return message;
        }
      }
    }).context;

    loadGasFiles(ctx, ['Config.gs', 'GmailClient.gs']);

    const result = ctx.HiEnergyGmail.getContextFromEvent({
      gmail: { messageId: 'msg-1', accessToken: 'token' }
    });

    expect(result.domain).toBe('acme.com');
    expect(result.senderEmail).toBe('jane@acme.com');
    expect(result.senderName).toBe('Jane Doe');
    expect(result.message.subject).toBe('Partnership opportunity');
  });

  it('falls back to a URL domain when the sender has no email domain', function () {
    const message = mockMessage({
      getFrom: function () {
        return 'Anonymous';
      }
    });

    const ctx = createGasContext({
      GmailApp: {
        getMessageById: function () {
          return message;
        }
      }
    }).context;

    loadGasFiles(ctx, ['Config.gs', 'GmailClient.gs']);

    const result = ctx.HiEnergyGmail.getContextFromEvent({
      gmail: { messageId: 'msg-1' }
    });

    expect(result.domain).toBe('acme.com');
  });

  it('searches Gmail by domain', function () {
    const searchMock = vi.fn(function () {
      return [
        {
          getMessages: function () {
            return [mockMessage()];
          }
        }
      ];
    });

    const ctx = createGasContext({
      GmailApp: {
        search: searchMock
      }
    }).context;

    loadGasFiles(ctx, ['Config.gs', 'GmailClient.gs']);

    const result = ctx.HiEnergyGmail.searchByDomain('acme.com', 2);
    expect(result.ok).toBe(true);
    expect(result.messages).toHaveLength(1);
    expect(searchMock).toHaveBeenCalledWith('from:@acme.com OR to:@acme.com', 0, 2);
  });

  it('returns an error when domain search input is missing', function () {
    const ctx = createGasContext().context;
    loadGasFiles(ctx, ['Config.gs', 'GmailClient.gs']);

    const result = ctx.HiEnergyGmail.searchByDomain('');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('MISSING_DOMAIN');
  });
});
