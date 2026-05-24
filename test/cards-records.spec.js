const { createGasContext, loadGasFiles } = require('./helpers/gas-runtime');

function createCardServiceMock(captured) {
  function chain(label) {
    var obj = { __kind: label, __calls: [] };
    [
      'setHeader',
      'setTitle',
      'setSubtitle',
      'setImageUrl',
      'setImageStyle',
      'addWidget',
      'addSection',
      'setFieldName',
      'setTitle',
      'setValue',
      'setHint',
      'setType',
      'addItem',
      'setOnClickAction',
      'setFunctionName',
      'setParameters',
      'setTextButtonStyle',
      'setBackgroundColor',
      'setTopLabel',
      'setText',
      'setBottomLabel',
      'setWrapText',
      'setButton',
      'setOpenLink',
      'setUrl',
      'setOpenAs',
      'build'
    ].forEach(function (method) {
      obj[method] = function () {
        var args = Array.prototype.slice.call(arguments);
        obj.__calls.push({ method: method, args: args });
        if (captured) {
          captured.push({ kind: label, method: method, args: args });
        }
        if (method === 'setText' && args[0]) {
          obj.__text = args[0];
        }
        if (method === 'setFunctionName' && args[0]) {
          obj.__functionName = args[0];
        }
        return obj;
      };
    });
    return obj;
  }

  return {
    newCardBuilder: function () {
      return chain('cardBuilder');
    },
    newCardSection: function () {
      return chain('cardSection');
    },
    newCardHeader: function () {
      return chain('cardHeader');
    },
    newTextParagraph: function () {
      return chain('textParagraph');
    },
    newTextInput: function () {
      return chain('textInput');
    },
    newSelectionInput: function () {
      return chain('selectionInput');
    },
    newTextButton: function () {
      return chain('textButton');
    },
    newDecoratedText: function () {
      return chain('decoratedText');
    },
    newAction: function () {
      return chain('action');
    },
    newOpenLink: function () {
      return chain('openLink');
    },
    SelectionInputType: { DROPDOWN: 'DROPDOWN' },
    ImageStyle: { CIRCLE: 'CIRCLE' },
    OpenAs: { FULL_SIZE: 'FULL_SIZE' },
    TextButtonStyle: { FILLED: 'FILLED', TEXT: 'TEXT' }
  };
}

describe('HiEnergyCards search results', function () {
  let ctx;
  let captured;

  beforeEach(function () {
    captured = [];
    const runtime = createGasContext({
      HiEnergyAuth: {
        isConfigured: function () {
          return true;
        },
        hasAccess: function () {
          return true;
        }
      }
    });
    runtime.context.CardService = createCardServiceMock(captured);
    loadGasFiles(runtime.context, ['Config.gs', 'Cards.gs']);
    ctx = runtime.context;
  });

  function actionFunctionNames() {
    return captured
      .filter(function (entry) {
        return entry.method === 'setFunctionName';
      })
      .map(function (entry) {
        return entry.args[0];
      });
  }

  it('renders advertisers with flat MCP rows (no attributes wrapper)', function () {
    expect(function () {
      ctx.HiEnergyCards.searchResults('nike', {
        ok: true,
        body: {
          results: {
            advertisers: {
              data: [{ id: '42', display_name: 'Nike', domain: 'nike.com' }],
              total: 1
            }
          }
        }
      });
    }).not.toThrow();
  });

  it('renders advertisers with JSON:API attributes', function () {
    expect(function () {
      ctx.HiEnergyCards.searchResults('nike', {
        ok: true,
        body: {
          results: {
            advertisers: {
              data: [{ id: '1', attributes: { display_name: 'Nike' } }],
              total: 1
            }
          }
        }
      });
    }).not.toThrow();
  });

  it('skips null rows without crashing', function () {
    expect(function () {
      ctx.HiEnergyCards.searchResults('test', {
        ok: true,
        body: {
          results: {
            advertisers: {
              data: [null, { id: '2', display_name: 'Acme' }],
              total: 2
            }
          }
        }
      });
    }).not.toThrow();
  });

  it('exposes an export-to-sheet action when results exist', function () {
    ctx.HiEnergyCards.searchResults('nike', {
      ok: true,
      body: {
        results: {
          advertisers: {
            data: [{ id: '1', attributes: { display_name: 'Nike' } }],
            total: 1
          }
        }
      }
    });
    expect(actionFunctionNames()).toContain('handleExportCachedSearchToSheet');
  });

  it('opens advertiser Hi Energy URL using /a/<id> pattern', function () {
    ctx.HiEnergyCards.searchResults('alo', {
      ok: true,
      body: {
        results: {
          advertisers: {
            data: [{ id: '4242', display_name: 'Alo Yoga', domain: 'aloyoga.com' }],
            total: 1
          }
        }
      }
    });
    const urls = captured
      .filter(function (entry) {
        return entry.method === 'setUrl';
      })
      .map(function (entry) {
        return entry.args[0];
      });
    expect(urls).toContain('https://app.hienergy.ai/a/4242');
  });

  it('opens the same advertiser URL regardless of host (Sheets / Slides)', function () {
    ctx.HiEnergyCards.searchResults('alo', {
      ok: true,
      body: {
        results: {
          advertisers: {
            data: [{ id: '7', display_name: 'Alo Yoga' }],
            total: 1
          }
        }
      }
    }, { hostApp: 'SLIDES' });
    const urls = captured
      .filter(function (entry) {
        return entry.method === 'setUrl';
      })
      .map(function (entry) {
        return entry.args[0];
      });
    expect(urls).toContain('https://app.hienergy.ai/a/7');
  });

  it('falls back to in-app details card when no id is present', function () {
    ctx.HiEnergyCards.searchResults('alo', {
      ok: true,
      body: {
        results: {
          advertisers: {
            data: [{ display_name: 'Alo Yoga' }],
            total: 1
          }
        }
      }
    });
    expect(actionFunctionNames()).toContain('handleOpenAdvertiser');
  });

  it('uses advertiser export handler when scope is advertisers', function () {
    ctx.HiEnergyCards.searchResults(
      'nike',
      {
        ok: true,
        body: {
          results: {
            advertisers: {
              data: [{ id: '1', attributes: { display_name: 'Nike' } }],
              total: 1
            }
          }
        }
      },
      { exportType: 'advertisers' }
    );
    expect(actionFunctionNames()).toContain('handleExportCachedAdvertisersToSheet');
  });
});
