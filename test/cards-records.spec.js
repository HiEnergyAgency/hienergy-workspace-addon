const { createGasContext, loadGasFiles } = require('./helpers/gas-runtime');

function createCardServiceMock() {
  function chain() {
    var obj = {};
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
        return obj;
      };
    });
    return obj;
  }

  return {
    newCardBuilder: chain,
    newCardSection: chain,
    newCardHeader: chain,
    newTextParagraph: chain,
    newTextInput: chain,
    newSelectionInput: chain,
    newTextButton: chain,
    newDecoratedText: chain,
    newAction: chain,
    newOpenLink: chain,
    SelectionInputType: { DROPDOWN: 'DROPDOWN' },
    ImageStyle: { CIRCLE: 'CIRCLE' },
    OpenAs: { FULL_SIZE: 'FULL_SIZE' }
  };
}

describe('HiEnergyCards search results', function () {
  let ctx;

  beforeEach(function () {
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
    runtime.context.CardService = createCardServiceMock();
    loadGasFiles(runtime.context, ['Config.gs', 'Cards.gs']);
    ctx = runtime.context;
  });

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
});
