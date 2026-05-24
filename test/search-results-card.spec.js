const { createGasContext, loadGasFiles } = require('./helpers/gas-runtime');

function createCardServiceMock(captured) {
  function chain(label) {
    const obj = { __kind: label, __calls: [] };
    [
      'setHeader',
      'setTitle',
      'setSubtitle',
      'setImageUrl',
      'setImageStyle',
      'addWidget',
      'addSection',
      'setFieldName',
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
        const args = Array.prototype.slice.call(arguments);
        obj.__calls.push({ method: method, args: args });
        if (captured) {
          captured.push({ kind: label, method: method, args: args });
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
    newButtonSet: function () {
      const set = chain('buttonSet');
      set.addButton = function () {
        set.__calls.push({ method: 'addButton', args: Array.prototype.slice.call(arguments) });
        return set;
      };
      return set;
    },
    newKeyValue: function () {
      return chain('keyValue');
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

function loadCards(captured) {
  const runtime = createGasContext({});
  runtime.context.CardService = createCardServiceMock(captured);
  loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'Cards.gs']);
  return runtime.context;
}

function actionNames(captured) {
  return captured
    .filter(function (e) {
      return e.method === 'setFunctionName';
    })
    .map(function (e) {
      return e.args[0];
    });
}

function buttonTexts(captured) {
  return captured
    .filter(function (e) {
      return e.method === 'setText';
    })
    .map(function (e) {
      return e.args[0];
    });
}

describe('searchResultsCard per-section export buttons', function () {
  const allTypesBody = {
    ok: true,
    body: {
      results: {
        advertisers: {
          data: [{ id: 'a1', attributes: { display_name: 'Nike', domain: 'nike.com' } }],
          total: 12
        },
        deals: {
          data: [{ id: 'd1', attributes: { title: 'Spring sale' } }],
          total: 7
        },
        transactions: {
          data: [{ id: 't1', attributes: { advertiser_name: 'Nike', commission_amount: '5' } }],
          total: 3
        },
        contacts: {
          data: [{ id: 'c1', attributes: { given_name: 'Alex', email: 'alex@nike.com' } }],
          total: 2
        }
      }
    }
  };

  it('renders an export handler for every section', function () {
    const captured = [];
    const ctx = loadCards(captured);
    ctx.HiEnergyCards.searchResults('nike', allTypesBody);

    const names = actionNames(captured);
    expect(names).toContain('handleExportCachedAdvertisersToSheet');
    expect(names).toContain('handleExportCachedDealsToSheet');
    expect(names).toContain('handleExportCachedTransactionsToSheet');
    expect(names).toContain('handleExportCachedAdvertiserContactsToSheet');
  });

  it('shows pluralized "matches" instead of "matchs"', function () {
    const captured = [];
    const ctx = loadCards(captured);
    ctx.HiEnergyCards.searchResults('nike', allTypesBody);
    const subtitles = captured
      .filter(function (e) {
        return e.method === 'setSubtitle';
      })
      .map(function (e) {
        return e.args[0];
      });
    expect(subtitles.some(function (s) { return s && s.indexOf('matches') !== -1; })).toBe(true);
    expect(subtitles.some(function (s) { return s && s.indexOf('matchs') !== -1; })).toBe(false);
  });

  it('humanizes raw enum statuses like not_applied', function () {
    const captured = [];
    const ctx = loadCards(captured);
    ctx.HiEnergyCards.searchResults('nike', {
      ok: true,
      body: {
        results: {
          advertisers: {
            data: [{ id: 'a1', attributes: { display_name: 'Nike', program_status: 'not_applied' } }],
            total: 1
          }
        }
      }
    });
    const tops = captured
      .filter(function (e) { return e.method === 'setTopLabel'; })
      .map(function (e) { return e.args[0]; });
    expect(tops.some(function (t) { return t === 'Available' || (t && t.indexOf('Available') === 0); })).toBe(true);
    expect(tops.some(function (t) { return t && t.indexOf('not_applied') !== -1; })).toBe(false);
  });
});

describe('sheetResultCard add-more visibility', function () {
  it('shows Add more when an export session is in progress, even without hasMore on the latest batch', function () {
    const captured = [];
    const runtime = createGasContext({
      userProperties: {
        HIENERGY_EXPORT_SESSION: JSON.stringify({
          exportType: 'advertisers',
          query: 'nike',
          exhausted: false,
          nextPage: 2,
          seenKeys: []
        })
      }
    });
    runtime.context.CardService = createCardServiceMock(captured);
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'Cards.gs']);

    runtime.context.HiEnergyCards.sheetResult({
      ok: true,
      rowCount: 100,
      sheetCount: 1,
      usedActiveSpreadsheet: true,
      url: 'https://docs.google.com/spreadsheets/d/abc/edit'
    });
    expect(buttonTexts(captured)).toContain('Add more');
  });

  it('hides Add more when no session and not hasMore', function () {
    const captured = [];
    const runtime = createGasContext({});
    runtime.context.CardService = createCardServiceMock(captured);
    loadGasFiles(runtime.context, ['Config.gs', 'McpExport.gs', 'Cards.gs']);

    runtime.context.HiEnergyCards.sheetResult({
      ok: true,
      rowCount: 5,
      sheetCount: 1,
      exhausted: true,
      url: 'https://docs.google.com/spreadsheets/d/abc/edit'
    });
    expect(buttonTexts(captured)).not.toContain('Add more');
  });
});
