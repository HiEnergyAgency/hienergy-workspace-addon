var HiEnergyCards = (function () {
  function header_(title, subtitle) {
    return CardService.newCardHeader()
      .setTitle(title)
      .setSubtitle(subtitle || '')
      .setImageUrl(HiEnergyConfig.brandLogoUrl)
      .setImageStyle(CardService.ImageStyle.CIRCLE);
  }

  function sectionText_(markdown) {
    return CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText(markdown)
    );
  }

  function cardAction_(functionName, parameters) {
    var action = CardService.newAction().setFunctionName(functionName);
    if (parameters) {
      action.setParameters(parameters);
    }
    return action;
  }

  function filledButton_(label, action) {
    var btn = CardService.newTextButton().setText(label).setOnClickAction(action);
    if (CardService.TextButtonStyle && CardService.TextButtonStyle.FILLED) {
      try {
        btn.setTextButtonStyle(CardService.TextButtonStyle.FILLED);
        if (btn.setBackgroundColor) {
          btn.setBackgroundColor(HiEnergyConfig.brandPrimaryColor);
        }
      } catch (err) {
        // Older CardService runtimes ignore styling — fall back silently.
      }
    }
    return btn;
  }

  function filledOpenUrlButton_(label, url) {
    if (!url) {
      return null;
    }
    var btn = CardService.newTextButton()
      .setText(label)
      .setOpenLink(CardService.newOpenLink().setUrl(url).setOpenAs(CardService.OpenAs.FULL_SIZE));
    if (CardService.TextButtonStyle && CardService.TextButtonStyle.FILLED) {
      try {
        btn.setTextButtonStyle(CardService.TextButtonStyle.FILLED);
        if (btn.setBackgroundColor) {
          btn.setBackgroundColor(HiEnergyConfig.brandPrimaryColor);
        }
      } catch (err) {
        // No-op for older runtimes.
      }
    }
    return btn;
  }

  function pluralize_(n, word) {
    return String(n) + ' ' + word + (n === 1 ? '' : 's');
  }

  function advertiserAppUrl_(id) {
    var clean = String(id || '').trim();
    if (!clean) {
      return '';
    }
    return HiEnergyConfig.appOrigin + (HiEnergyConfig.advertiserPath || '/a/') + encodeURIComponent(clean);
  }

  function settingsCard_() {
    var card = CardService.newCardBuilder().setHeader(
      header_('Settings', 'Sign-in, API keys, and backend')
    );

    var mode = HiEnergyApi.authMode ? HiEnergyApi.authMode() : 'none';
    var hasApiKey = HiEnergyApi.hasApiKey();
    var maskedKey = HiEnergyApi.maskedApiKey ? HiEnergyApi.maskedApiKey() : '';

    var statusLabel = 'Not connected';
    var statusDetail = 'Choose Auth0 or an API key below.';
    if (mode === 'auth0') {
      statusLabel = 'Signed in with Auth0';
      statusDetail = hasApiKey ? 'API key also saved (used as fallback)' : 'Active method';
    } else if (mode === 'api_key') {
      statusLabel = 'Using API key';
      statusDetail = maskedKey || 'API key saved';
    }

    var statusSection = CardService.newCardSection().setHeader('Status').addWidget(
      CardService.newDecoratedText()
        .setTopLabel(HiEnergyConfig.brandName)
        .setText(statusLabel)
        .setBottomLabel(statusDetail)
        .setWrapText(true)
    );
    card.addSection(statusSection);

    var auth0Section = CardService.newCardSection().setHeader('Option 1 · Auth0 sign-in');
    if (!HiEnergyAuth.isConfigured()) {
      auth0Section.addWidget(
        CardService.newTextParagraph().setText(
          'Auth0 isn\u2019t configured for this deployment. An admin must set ' +
            '<b>AUTH0_DOMAIN</b>, <b>AUTH0_CLIENT_ID</b>, <b>AUTH0_CLIENT_SECRET</b>, and ' +
            '<b>AUTH0_AUDIENCE</b> in Apps Script Script Properties. Use Option 2 instead.'
        )
      );
    } else if (HiEnergyAuth.hasAccess()) {
      auth0Section
        .addWidget(
          CardService.newDecoratedText()
            .setTopLabel('OAuth')
            .setText('Connected')
            .setBottomLabel('Per-user Auth0 token stored in this Workspace user profile')
            .setWrapText(true)
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Sign out of Auth0')
            .setOnClickAction(cardAction_('handleSignOutAuth0'))
        );
    } else {
      auth0Section
        .addWidget(
          CardService.newTextParagraph().setText(
            'Sign in with your ' + HiEnergyConfig.brandName + ' account. The add-on stores your Auth0 token per-user.'
          )
        )
        .addWidget(filledButton_('Sign in with ' + HiEnergyConfig.brandName, cardAction_('handleSignIn')));
    }
    card.addSection(auth0Section);

    var apiKeySection = CardService.newCardSection().setHeader('Option 2 · API key');
    apiKeySection.addWidget(
      CardService.newDecoratedText()
        .setTopLabel('Current key')
        .setText(hasApiKey ? maskedKey : 'No key saved')
        .setBottomLabel(
          hasApiKey
            ? 'Sent as X-Api-Key header. Enter a new key below to replace it.'
            : 'Per-user. Paste your Hi Energy AI API key to enable read-only access.'
        )
        .setWrapText(true)
    );
    apiKeySection.addWidget(
      CardService.newTextInput()
        .setFieldName('apiKey')
        .setTitle(hasApiKey ? 'Replace API key' : 'API key')
        .setHint(hasApiKey ? 'Leave empty to keep current key' : 'Paste API key (kept per-user)')
    );
    apiKeySection.addWidget(
      filledButton_(hasApiKey ? 'Update API key' : 'Save API key', cardAction_('handleSaveApiKeySettings'))
    );
    if (hasApiKey) {
      apiKeySection.addWidget(
        CardService.newTextButton()
          .setText('Remove API key')
          .setOnClickAction(cardAction_('handleRemoveApiKeySettings'))
      );
    }
    card.addSection(apiKeySection);

    var backendSection = CardService.newCardSection().setHeader('Backend overrides');
    backendSection.addWidget(
      CardService.newTextInput()
        .setFieldName('apiBase')
        .setTitle('REST API base URL')
        .setValue(HiEnergyApi.getApiBase())
        .setHint('Default: ' + HiEnergyConfig.defaultApiBase)
    );
    backendSection.addWidget(
      CardService.newTextInput()
        .setFieldName('mcpUrl')
        .setTitle('MCP server URL')
        .setValue(HiEnergyApi.getMcpUrl())
        .setHint('Default: ' + HiEnergyConfig.defaultMcpUrl)
    );
    backendSection.addWidget(
      CardService.newTextButton()
        .setText('Save backend URLs')
        .setOnClickAction(cardAction_('handleSaveBackendUrls'))
    );
    backendSection.addWidget(
      CardService.newTextButton()
        .setText('Reset to defaults')
        .setOnClickAction(cardAction_('handleResetBackendUrls'))
    );
    backendSection.addWidget(
      CardService.newTextButton()
        .setText('Browse MCP tools')
        .setOnClickAction(cardAction_('onMcpTools'))
    );
    backendSection.addWidget(
      CardService.newTextButton()
        .setText('MCP documentation')
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(HiEnergyConfig.authDocsUrl)
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
        )
    );
    card.addSection(backendSection);

    if (mode !== 'none') {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Reset')
          .addWidget(
            CardService.newTextParagraph().setText(
              'Clear both Auth0 and the API key, then return to the welcome screen.'
            )
          )
          .addWidget(
            CardService.newTextButton()
              .setText('Disconnect everything')
              .setOnClickAction(cardAction_('handleDisconnectSettings'))
          )
      );
    }
    card.addSection(
      CardService.newCardSection()
        .setHeader('Legal')
        .addWidget(
          CardService.newTextButton()
            .setText('Privacy policy')
            .setOpenLink(
              CardService.newOpenLink()
                .setUrl(HiEnergyConfig.privacyPolicyUrl)
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Terms of service')
            .setOpenLink(
              CardService.newOpenLink()
                .setUrl(HiEnergyConfig.termsOfServiceUrl)
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
            )
        )
    );
    card.addSection(
      sectionText_(
        'All ' + HiEnergyConfig.brandName + ' requests go through the MCP server (<b>POST /mcp</b>) using Auth0 bearer tokens or an API key. Tokens are stored per Google user.'
      )
    );

    return card.build();
  }

  function connectCard_() {
    var card = CardService.newCardBuilder()
      .setHeader(header_(HiEnergyConfig.brandName, HiEnergyConfig.brandTagline));

    card.addSection(
      sectionText_(
        'Search Hi Energy AI advertisers, deals, and transactions inside Gmail, Sheets, Docs, Drive, Slides, and Calendar. Pick how you want to connect:'
      )
    );

    var oauthSection = CardService.newCardSection().setHeader('Option 1 · OAuth (recommended)');
    if (HiEnergyAuth.isConfigured()) {
      oauthSection
        .addWidget(
          CardService.newTextParagraph().setText(
            'Sign in with your ' + HiEnergyConfig.brandName + ' account. Tokens are stored per Google user.'
          )
        )
        .addWidget(
          filledButton_('Sign in with ' + HiEnergyConfig.brandName, cardAction_('handleSignIn'))
        );
    } else {
      oauthSection.addWidget(
        CardService.newTextParagraph().setText(
          'Auth0 isn\u2019t configured for this deployment. Use an API key below, or ask your admin to set up Auth0.'
        )
      );
    }
    card.addSection(oauthSection);

    var apiKeySection = CardService.newCardSection().setHeader('Option 2 · API key');
    apiKeySection
      .addWidget(
        CardService.newTextInput()
          .setFieldName('apiKey')
          .setTitle('API key')
          .setHint('Paste your Hi Energy AI API key (stored per-user)')
      )
      .addWidget(
        filledButton_('Save API key & continue', cardAction_('handleSaveApiKeySettings'))
      );
    card.addSection(apiKeySection);

    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextButton()
          .setText('Advanced settings')
          .setOnClickAction(cardAction_('onSettings'))
      )
    );

    return card.build();
  }

  function searchCard_(prefill, options) {
    options = options || {};
    var hostApp = options.hostApp || '';
    var isGmail = !hostApp || hostApp === 'GMAIL';

    var subtitle =
      hostApp === 'SHEETS'
        ? 'Search and export into this spreadsheet'
        : HiEnergyConfig.brandTagline;

    var card = CardService.newCardBuilder().setHeader(header_('Search', subtitle));

    var scopeInput = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle('Scope')
      .setFieldName('scope')
      .addItem('Everything', 'all', !prefill)
      .addItem('Advertisers', 'advertisers', false)
      .addItem('Deals', 'deals', false)
      .addItem('Transactions', 'transactions', false)
      .addItem('Contacts', 'contacts', false);

    if (isGmail) {
      scopeInput.addItem('Messages', 'messages', false);
    }

    var section = CardService.newCardSection()
      .addWidget(
        CardService.newTextInput()
          .setFieldName('query')
          .setTitle('Search query')
          .setHint('e.g. Nike, nike.com, summer sale')
          .setValue(prefill || '')
      )
      .addWidget(scopeInput)
      .addWidget(filledButton_('Search', cardAction_('handleSearch')));

    card.addSection(section);

    var quickActions = CardService.newCardSection().setHeader('Quick actions');
    quickActions.addWidget(
      CardService.newTextButton()
        .setText(hostApp === 'SHEETS' ? 'Create tabs in this sheet' : 'Create new sheet')
        .setOnClickAction(cardAction_('onCreateSheetAction', hostApp ? { hostApp: hostApp } : null))
    );
    if (isGmail) {
      quickActions.addWidget(
        CardService.newTextButton()
          .setText('Draft email')
          .setOnClickAction(cardAction_('onDraftEmailAction'))
      );
    }
    quickActions.addWidget(
      CardService.newTextButton()
        .setText('Browse MCP tools')
        .setOnClickAction(cardAction_('onMcpTools'))
    );
    card.addSection(quickActions);

    if (hostApp === 'SHEETS') {
      card.addSection(
        sectionText_(
          'Search results include a one-click <b>Export to this spreadsheet</b> button. ' +
            'Use <b>Create tabs</b> for advertisers, deals, transactions, and contacts in one go.'
        )
      );
    } else if (hostApp === 'GMAIL') {
      card.addSection(
        sectionText_(
          'Open an email to see sender context, or search Hi Energy AI advertisers, deals, and transactions below.'
        )
      );
    }

    return card.build();
  }

  function errorCard_(title, message) {
    return CardService.newCardBuilder()
      .setHeader(header_(title, 'Something went wrong'))
      .addSection(sectionText_(message))
      .build();
  }

  function apiErrorCard_(result) {
    if (result.error === 'AUTH0_NOT_CONFIGURED') {
      return errorCard_(
        'Auth0 not configured',
        'Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, and AUTH0_AUDIENCE in Apps Script project properties, or save an API key in Settings.'
      );
    }
    if (result.error === 'AUTH_REQUIRED') {
      return connectCard_();
    }
    if (result.error === 'API_KEY_MISSING') {
      return connectCard_();
    }
    if (result.error === 'API_UNAUTHORIZED') {
      return errorCard_(
        'Session expired',
        'Hi Energy AI rejected this sign-in. Sign in again from Settings, or verify your Auth0 audience matches ' +
          HiEnergyConfig.defaultAuth0Audience + '.'
      );
    }
    if (result.error === 'API_RATE_LIMITED') {
      return errorCard_('Rate limited', 'Too many requests. Wait a minute and try again.');
    }
    return errorCard_('API error', result.message || result.error || 'Unknown error');
  }

  function normalizeResultRows_(rows) {
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.filter(function (row) {
      return row && typeof row === 'object';
    });
  }

  function attrsForRecord_(record) {
    if (!record || typeof record !== 'object') {
      return {};
    }
    return record.attributes || record;
  }

  function recordId_(record, attrs) {
    return String((record && record.id) || (attrs && attrs.id) || '').trim();
  }

  function labelForRecord_(type, record) {
    if (!record) {
      return 'Unknown';
    }
    var attrs = attrsForRecord_(record);
    var id = recordId_(record, attrs);
    if (type === 'advertisers') {
      return attrs.display_name || attrs.name || id || 'Advertiser';
    }
    if (type === 'deals') {
      return attrs.title || attrs.name || id || 'Deal';
    }
    if (type === 'transactions') {
      return (attrs.advertiser_name || attrs.advertiser_id || 'Transaction') +
        ' · ' + (attrs.commission_amount || attrs.commission || '');
    }
    return attrs.name || attrs.title || attrs.display_name || id || 'Result';
  }

  function subtitleForRecord_(type, record) {
    var attrs = attrsForRecord_(record);
    if (type === 'advertisers') {
      return [attrs.domain, attrs.network_name, attrs.program_status].filter(Boolean).join(' · ');
    }
    if (type === 'deals') {
      return [attrs.advertiser_name, attrs.country, attrs.status].filter(Boolean).join(' · ');
    }
    if (type === 'transactions') {
      return [attrs.network_name, attrs.transaction_date, attrs.status].filter(Boolean).join(' · ');
    }
    return '';
  }

  function openUrlButton_(label, url) {
    if (!url) {
      return null;
    }
    return CardService.newTextButton()
      .setText(label)
      .setOpenLink(CardService.newOpenLink().setUrl(url).setOpenAs(CardService.OpenAs.FULL_SIZE));
  }

  function currentHostApp_() {
    try {
      return PropertiesService.getUserProperties().getProperty(HiEnergyConfig.propHostApp) || '';
    } catch (err) {
      return '';
    }
  }

  function exportLabel_(base) {
    return currentHostApp_() === 'SHEETS'
      ? base + ' (export to this sheet)'
      : base + ' to Google Sheet';
  }

  function exportSheetButton_(exportType) {
    if (exportType === true) {
      return filledButton_(
        exportLabel_('Export results'),
        cardAction_('handleExportMcpResultToSheet')
      );
    }

    var config = {
      advertisers: {
        label: exportLabel_('Export advertisers'),
        handler: 'handleExportCachedAdvertisersToSheet'
      },
      deals: {
        label: exportLabel_('Export deals'),
        handler: 'handleExportCachedDealsToSheet'
      },
      transactions: {
        label: exportLabel_('Export transactions'),
        handler: 'handleExportCachedTransactionsToSheet'
      },
      advertiser_contacts: {
        label: exportLabel_('Export contacts'),
        handler: 'handleExportCachedAdvertiserContactsToSheet'
      },
      google_contacts: {
        label: exportLabel_('Export contacts'),
        handler: 'handleExportCachedGoogleContactsToSheet'
      }
    };

    var entry = config[exportType];
    if (!entry) {
      return filledButton_(
        exportLabel_('Export search results'),
        cardAction_('handleExportCachedSearchToSheet')
      );
    }

    return filledButton_(entry.label, cardAction_(entry.handler));
  }

  function searchResultsCard_(query, result, options) {
    options = options || {};
    if (!result.ok) {
      return apiErrorCard_(result);
    }

    var payload = result.body || {};
    var results = payload.results || {};
    var types = Object.keys(results);
    var totals = {};
    var grandTotal = 0;

    types.forEach(function (type) {
      var bucket = results[type] || {};
      var rows = bucket.data || (Array.isArray(bucket) ? bucket : []);
      var total = bucket.total || rows.length;
      totals[type] = { rows: rows, total: total };
      grandTotal += total;
    });

    var subtitle = grandTotal
      ? '"' + query + '" · ' + pluralize_(grandTotal, 'match')
      : 'No matches for "' + query + '"';

    var card = CardService.newCardBuilder().setHeader(header_('Results', subtitle));

    if (grandTotal) {
      var exportSection = CardService.newCardSection();
      exportSection.addWidget(exportSheetButton_(options.exportType));
      card.addSection(exportSection);
    }

    var found = false;
    types.forEach(function (type) {
      var entry = totals[type];
      if (!entry || !entry.rows.length) {
        return;
      }
      found = true;
      var sectionHeader =
        type.charAt(0).toUpperCase() + type.slice(1) +
        ' · ' + pluralize_(entry.total, 'match');
      var section = CardService.newCardSection().setHeader(sectionHeader);

      normalizeResultRows_(entry.rows)
        .slice(0, HiEnergyConfig.perTypeLimit)
        .forEach(function (row) {
          var label = labelForRecord_(type, row);
          var subtitleText = subtitleForRecord_(type, row);
          var decorator = CardService.newDecoratedText()
            .setTopLabel(type.slice(0, -1))
            .setText(label)
            .setBottomLabel(subtitleText)
            .setWrapText(true);

          if (type === 'advertisers') {
            var attrs = attrsForRecord_(row);
            var advertiserId = recordId_(row, attrs);
            var directUrl = attrs.url || advertiserAppUrl_(advertiserId);
            if (directUrl) {
              decorator.setButton(
                CardService.newTextButton()
                  .setText('Open')
                  .setOpenLink(
                    CardService.newOpenLink()
                      .setUrl(directUrl)
                      .setOpenAs(CardService.OpenAs.FULL_SIZE)
                  )
              );
            } else {
              var slug = attrs.slug || advertiserId;
              decorator.setButton(
                CardService.newTextButton()
                  .setText('Details')
                  .setOnClickAction(
                    cardAction_('handleOpenAdvertiser', { id: String(slug) })
                  )
              );
            }
          }
          section.addWidget(decorator);
        });

      var shownCount = Math.min(entry.rows.length, HiEnergyConfig.perTypeLimit);
      if (entry.total > shownCount) {
        section.addWidget(
          CardService.newTextParagraph().setText(
            'Showing first ' + shownCount + ' of ' + entry.total + '. Export to see them all.'
          )
        );
      }

      card.addSection(section);
    });

    if (!found) {
      card.addSection(
        sectionText_(
          'No results for <b>' + query + '</b>. Try a broader keyword or change the scope.'
        )
      );
    }

    var footer = CardService.newCardSection();
    footer.addWidget(
      CardService.newTextButton()
        .setText('New search')
        .setOnClickAction(
          cardAction_('onSearchAction', options.hostApp ? { hostApp: options.hostApp } : null)
        )
    );
    if (found) {
      footer.addWidget(
        CardService.newTextButton()
          .setText('Create Sheet')
          .setOnClickAction(
            cardAction_(
              'onCreateSheetAction',
              options.hostApp ? { hostApp: options.hostApp } : null
            )
          )
      );
    }
    card.addSection(footer);

    return card.build();
  }

  function advertiserCard_(result) {
    if (!result.ok) {
      return apiErrorCard_(result);
    }

    var payload = result.body || {};
    var attrs = payload.data && payload.data.attributes ? payload.data.attributes : payload.data || payload;
    var id = payload.data && payload.data.id ? payload.data.id : attrs.id;
    var name = attrs.display_name || attrs.name || 'Advertiser';
    var card = CardService.newCardBuilder().setHeader(header_(name, attrs.domain || ''));

    var facts = [
      ['Network', attrs.network_name],
      ['Status', attrs.program_status || attrs.status],
      ['Commission', attrs.commission_rate || attrs.average_commission_rate],
      ['Domain', attrs.domain],
      ['Publisher', attrs.publisher_name]
    ].filter(function (pair) { return pair[1]; });

    if (facts.length) {
      var section = CardService.newCardSection().setHeader('Overview');
      facts.forEach(function (pair) {
        section.addWidget(
          CardService.newKeyValue()
            .setTopLabel(pair[0])
            .setContent(String(pair[1]))
        );
      });
      card.addSection(section);
    }

    var actions = CardService.newCardSection();
    var appUrl = attrs.url || (id ? advertiserAppUrl_(id) : null);
    var openBtn = filledOpenUrlButton_('Open in ' + HiEnergyConfig.brandName, appUrl) ||
      openUrlButton_('Open in ' + HiEnergyConfig.brandName, appUrl);
    if (openBtn) {
      actions.addWidget(openBtn);
    }
    actions.addWidget(
      CardService.newTextButton()
        .setText('Deals for this advertiser')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('handleAdvertiserDeals')
            .setParameters({ id: String(attrs.slug || id), name: name })
        )
    );
    actions.addWidget(
      CardService.newTextButton()
        .setText('Recent transactions')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('handleAdvertiserTransactions')
            .setParameters({ id: String(attrs.slug || id), name: name })
        )
    );
    actions.addWidget(
      CardService.newTextButton()
        .setText('Draft email with MCP data')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('handleDraftEmailFromAdvertiser')
            .setParameters({ id: String(attrs.slug || id), name: name })
        )
    );
    actions.addWidget(
      CardService.newTextButton()
        .setText('Export contacts to sheet')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('handleCreateAdvertiserContactsSheet')
            .setParameters({ advertiser: String(attrs.slug || id) })
        )
    );
    card.addSection(actions);

    return card.build();
  }

  function listCard_(title, subtitle, rows, renderRow) {
    var card = CardService.newCardBuilder().setHeader(header_(title, subtitle));
    if (!rows.length) {
      card.addSection(sectionText_('Nothing to show.'));
      return card.build();
    }

    var section = CardService.newCardSection();
    rows.slice(0, HiEnergyConfig.perTypeLimit).forEach(function (row) {
      section.addWidget(renderRow(row));
    });
    card.addSection(section);
    return card.build();
  }

  function dealsCard_(advertiserName, result, exportType) {
    if (!result.ok) {
      return apiErrorCard_(result);
    }

    var rows = [];
    var body = result.body || {};
    if (body.data) {
      rows = body.data;
    } else if (Array.isArray(body)) {
      rows = body;
    }

    var dealCount = (body.meta && body.meta.total) || rows.length;
    var card = CardService.newCardBuilder().setHeader(
      header_('Deals', (advertiserName || 'Recent') + ' · ' + pluralize_(dealCount, 'deal'))
    );
    if (!rows.length) {
      card.addSection(sectionText_('No deals to show.'));
    } else {
      var section = CardService.newCardSection();
      normalizeResultRows_(rows).slice(0, HiEnergyConfig.perTypeLimit).forEach(function (row) {
        var attrs = attrsForRecord_(row);
        section.addWidget(
          CardService.newDecoratedText()
            .setText(attrs.title || attrs.name || recordId_(row, attrs))
            .setBottomLabel([attrs.advertiser_name, attrs.country, attrs.status].filter(Boolean).join(' · '))
            .setWrapText(true)
        );
      });
      card.addSection(section);
    }

    if (exportType) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Export')
          .addWidget(exportSheetButton_(exportType === true ? null : exportType))
      );
    }

    return card.build();
  }

  function transactionsCard_(advertiserName, result, exportType) {
    if (!result.ok) {
      return apiErrorCard_(result);
    }

    var rows = [];
    var body = result.body || {};
    if (body.data) {
      rows = body.data;
    } else if (Array.isArray(body)) {
      rows = body;
    }

    var txnCount = (body.meta && body.meta.total) || rows.length;
    var card = CardService.newCardBuilder().setHeader(
      header_('Transactions', (advertiserName || 'Last 30 days') + ' · ' + pluralize_(txnCount, 'txn'))
    );
    if (!rows.length) {
      card.addSection(sectionText_('No transactions to show.'));
    } else {
      var section = CardService.newCardSection();
      normalizeResultRows_(rows).slice(0, HiEnergyConfig.perTypeLimit).forEach(function (row) {
        var attrs = attrsForRecord_(row);
        section.addWidget(
          CardService.newDecoratedText()
            .setText((attrs.advertiser_name || 'Transaction') + ' · ' + (attrs.commission_amount || attrs.commission || ''))
            .setBottomLabel([attrs.network_name, attrs.transaction_date, attrs.status].filter(Boolean).join(' · '))
            .setWrapText(true)
        );
      });
      card.addSection(section);
    }

    if (exportType) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Export')
          .addWidget(exportSheetButton_(exportType === true ? null : exportType))
      );
    }

    return card.build();
  }

  function formatDate_(date) {
    if (!date) {
      return '';
    }
    return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'MMM d, yyyy');
  }

  function contactWidget_(contact) {
    var subtitle = [contact.email, contact.organization, contact.phone].filter(Boolean).join(' · ');
    return CardService.newDecoratedText()
      .setTopLabel('Contact')
      .setText(contact.name || contact.email || 'Unknown contact')
      .setBottomLabel(subtitle)
      .setWrapText(true);
  }

  function messageWidget_(message, showThreadButton) {
    var subtitle = [message.senderName || message.from, formatDate_(message.date)].filter(Boolean).join(' · ');
    var widget = CardService.newDecoratedText()
      .setTopLabel('Message')
      .setText(message.subject || '(No subject)')
      .setBottomLabel(subtitle)
      .setWrapText(true);

    if (showThreadButton && message.id) {
      widget.setButton(
        CardService.newTextButton()
          .setText('View thread')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleViewThread')
              .setParameters({ messageId: String(message.id) })
          )
      );
    }

    return widget;
  }

  function contactsCard_(query, result) {
    if (!result.ok) {
      return errorCard_('Contacts error', result.message || result.error || 'Could not search contacts.');
    }

    var contacts = result.contacts || [];
    var card = CardService.newCardBuilder().setHeader(
      header_('Contacts', '"' + query + '"')
    );

    if (!contacts.length) {
      card.addSection(sectionText_('No contacts matched <b>' + query + '</b>.'));
    } else {
      var section = CardService.newCardSection();
      contacts.slice(0, HiEnergyConfig.contactLimit).forEach(function (contact) {
        section.addWidget(contactWidget_(contact));
      });
      card.addSection(section);
    }

    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextButton()
          .setText('Export contacts to Google Sheet')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleCreateGoogleContactsSheet')
              .setParameters({ query: query })
          )
      )
    );

    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextButton()
          .setText('New search')
          .setOnClickAction(CardService.newAction().setFunctionName('onSearchAction'))
      )
    );

    return card.build();
  }

  function contactLookupCard_(email, result) {
    if (!result.ok) {
      return errorCard_('Contacts error', result.message || result.error || 'Could not look up contact.');
    }

    var card = CardService.newCardBuilder().setHeader(
      header_('Contact lookup', email)
    );

    if (!result.contact) {
      card.addSection(sectionText_('No Google contact matched <b>' + email + '</b>.'));
    } else {
      card.addSection(CardService.newCardSection().addWidget(contactWidget_(result.contact)));
    }

    return card.build();
  }

  function messagesCard_(title, result) {
    if (!result.ok) {
      return errorCard_('Gmail error', result.message || result.error || 'Could not read messages.');
    }

    var messages = result.messages || [];
    var card = CardService.newCardBuilder().setHeader(
      header_('Messages', title)
    );

    if (!messages.length) {
      card.addSection(sectionText_('No messages found.'));
    } else {
      var section = CardService.newCardSection();
      messages.slice(0, HiEnergyConfig.messageLimit).forEach(function (message) {
        section.addWidget(messageWidget_(message, true));
      });
      card.addSection(section);
    }

    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextButton()
          .setText('New search')
          .setOnClickAction(CardService.newAction().setFunctionName('onSearchAction'))
      )
    );

    return card.build();
  }

  function gmailContextCard_(context, contactResult, messagesResult) {
    var domain = context.domain;
    var message = context.message || {};
    var card = CardService.newCardBuilder().setHeader(
      header_('Email context', HiEnergyConfig.brandName)
    );

    var senderSection = CardService.newCardSection().setHeader('Sender');
    senderSection.addWidget(
      CardService.newDecoratedText()
        .setText(context.senderName || message.from || domain)
        .setBottomLabel([context.senderEmail, domain].filter(Boolean).join(' · '))
        .setWrapText(true)
    );

    if (context.senderEmail) {
      senderSection.addWidget(
        CardService.newTextButton()
          .setText('Look up contact')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleLookupContact')
              .setParameters({ email: context.senderEmail })
          )
      );
    }

    if (message.subject) {
      senderSection.addWidget(
        CardService.newDecoratedText()
          .setTopLabel('Subject')
          .setText(message.subject)
          .setWrapText(true)
      );
    }

    if (message.id) {
      senderSection.addWidget(
        CardService.newTextButton()
          .setText('View thread')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleViewThread')
              .setParameters({ messageId: String(message.id) })
          )
      );
    }

    card.addSection(senderSection);

    if (contactResult && contactResult.ok && contactResult.contact) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Google contact')
          .addWidget(contactWidget_(contactResult.contact))
      );
    }

    if (messagesResult && messagesResult.ok && messagesResult.messages && messagesResult.messages.length) {
      var messagesSection = CardService.newCardSection().setHeader('Recent messages from domain');
      messagesResult.messages.forEach(function (item) {
        messagesSection.addWidget(messageWidget_(item, true));
      });
      messagesSection.addWidget(
        CardService.newTextButton()
          .setText('View all from ' + domain)
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleViewDomainMessages')
              .setParameters({ domain: domain })
          )
      );
      card.addSection(messagesSection);
    }

    card.addSection(
      CardService.newCardSection()
        .setHeader(HiEnergyConfig.brandName)
        .addWidget(
          CardService.newTextButton()
            .setText('Find advertiser')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('handleDomainLookup')
                .setParameters({ domain: domain })
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Search ' + HiEnergyConfig.brandName)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('onSearchAction')
                .setParameters({ query: domain })
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Draft email with MCP data')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('handleDraftEmailFromContext')
                .setParameters({
                  domain: domain,
                  senderEmail: context.senderEmail || '',
                  senderName: context.senderName || '',
                  messageId: message.id ? String(message.id) : '',
                  subject: message.subject || ''
                })
            )
        )
    );

    return card.build();
  }

  function summarizeJson_(value) {
    try {
      var text = JSON.stringify(value, null, 2);
      if (text.length > 1200) {
        return text.substring(0, 1200) + '…';
      }
      return text;
    } catch (err) {
      return String(value);
    }
  }

  function mcpToolsCard_(result) {
    if (!result.ok) {
      return apiErrorCard_(result);
    }

    var tools = (result.body && result.body.tools) || [];
    var card = CardService.newCardBuilder().setHeader(
      header_('MCP Tools', HiEnergyConfig.brandName + ' server tools')
    );

    if (!tools.length) {
      card.addSection(sectionText_('No MCP tools were returned.'));
      return card.build();
    }

    var section = CardService.newCardSection().setHeader('Available tools');
    tools.slice(0, HiEnergyConfig.mcpToolLimit).forEach(function (tool) {
      var description = tool.description || 'Run this MCP tool';
      section.addWidget(
        CardService.newDecoratedText()
          .setTopLabel(tool.name || 'tool')
          .setText(description)
          .setWrapText(true)
          .setButton(
            CardService.newTextButton()
              .setText('Use')
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('handleMcpToolPrompt')
                  .setParameters({
                    tool: String(tool.name || ''),
                    description: description
                  })
              )
          )
      );
    });

    card.addSection(section);
    card.addSection(
      sectionText_('Search, advertiser lookup, and reports in this add-on already call these tools through the MCP server.')
    );

    return card.build();
  }

  function mcpToolPromptCard_(toolName, description) {
    var card = CardService.newCardBuilder().setHeader(
      header_('MCP Tool', toolName)
    );

    if (description) {
      card.addSection(sectionText_(description));
    }

    card.addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextInput()
            .setFieldName('query')
            .setTitle('Input')
            .setHint('Search term, domain, advertiser id, or report goal')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Run tool')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('handleMcpToolCall')
                .setParameters({ tool: toolName })
            )
        )
    );

    return card.build();
  }

  function mcpToolResultCard_(toolName, query, result) {
    if (!result.ok) {
      return apiErrorCard_(result);
    }

    if (toolName === 'universal_search') {
      return searchResultsCard_(query || toolName, result);
    }
    if (toolName === 'search_advertisers') {
      var advertiserRows = (result.body && result.body.data) || result.body || [];
      if (!Array.isArray(advertiserRows)) {
        advertiserRows = [];
      }
      return searchResultsCard_(
        query || toolName,
        {
          ok: true,
          body: {
            results: {
              advertisers: {
                data: advertiserRows,
                total: advertiserRows.length
              }
            }
          }
        },
        { exportType: 'advertisers' }
      );
    }
    if (toolName === 'search_advertisers_by_domain' || toolName === 'search_domains') {
      return searchResultsCard_(query || toolName, {
        ok: true,
        body: {
          results: {
            advertisers: {
              data: (result.body && result.body.data) || result.body || [],
              total: ((result.body && result.body.data) || result.body || []).length
            }
          }
        }
      }, { exportType: 'advertisers' });
    }
    if (toolName === 'get_advertiser') {
      return advertiserCard_(result);
    }
    if (toolName === 'search_deals') {
      return dealsCard_(query || 'Deals', result, 'deals');
    }
    if (toolName === 'search_transactions') {
      return transactionsCard_(query || 'Transactions', result, 'transactions');
    }
    if (toolName === 'get_advertiser_contacts') {
      var advertiserContactRows = (result.body && result.body.data) || result.body || [];
      if (!Array.isArray(advertiserContactRows)) {
        advertiserContactRows = [];
      }

      var contactsResultCard = CardService.newCardBuilder().setHeader(
        header_('Advertiser contacts', query || toolName)
      );

      if (!advertiserContactRows.length) {
        contactsResultCard.addSection(sectionText_('No contacts returned.'));
      } else {
        var contactsSection = CardService.newCardSection();
        normalizeResultRows_(advertiserContactRows).slice(0, HiEnergyConfig.perTypeLimit).forEach(function (row) {
          var attrs = attrsForRecord_(row);
          contactsSection.addWidget(
            CardService.newDecoratedText()
              .setText([attrs.given_name, attrs.family_name].filter(Boolean).join(' ') || attrs.email || row.id)
              .setBottomLabel([attrs.email, attrs.job_title, attrs.phone].filter(Boolean).join(' · '))
              .setWrapText(true)
          );
        });
        contactsResultCard.addSection(contactsSection);
      }

      contactsResultCard.addSection(
        CardService.newCardSection()
          .setHeader('Export')
          .addWidget(exportSheetButton_('advertiser_contacts'))
      );
      return contactsResultCard.build();
    }

    var card = CardService.newCardBuilder().setHeader(
      header_('MCP result', toolName)
    );
    card.addSection(sectionText_('<pre>' + summarizeJson_(result.body) + '</pre>'));
    card.addSection(
      CardService.newCardSection()
        .setHeader('Export')
        .addWidget(
          CardService.newTextButton()
            .setText('Export to Google Sheet')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handleExportMcpResultToSheet')
            )
        )
    );
    return card.build();
  }

  function createSheetCard_(options) {
    options = options || {};
    var hostApp = options.hostApp || '';
    var cachedAdvertisers = HiEnergyMcpExport.readCachedAdvertiserSearch();
    var cachedDeals = HiEnergyMcpExport.readCachedDealsSearch();
    var cachedTransactions = HiEnergyMcpExport.readCachedTransactionsSearch();
    var cachedAdvertiserContacts = HiEnergyMcpExport.readCachedAdvertiserContactsSearch();
    var cachedGoogleContacts = HiEnergyMcpExport.readCachedGoogleContactsSearch();
    var cached = HiEnergyMcpExport.readCachedSearch();
    var subtitle =
      hostApp === 'SHEETS'
        ? 'Add Hi Energy data as tabs in this spreadsheet'
        : 'Export Hi Energy and Google data to a new spreadsheet';
    var card = CardService.newCardBuilder().setHeader(header_('Create Sheet', subtitle));

    card.addSection(
      CardService.newCardSection()
        .setHeader('Advertiser search')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('advertiserQuery')
            .setTitle('Advertiser name or domain')
            .setValue(cachedAdvertisers && cachedAdvertisers.query ? cachedAdvertisers.query : '')
            .setHint('e.g. Nike or nike.com')
        )
        .addWidget(
          CardService.newSelectionInput()
            .setType(CardService.SelectionInputType.DROPDOWN)
            .setTitle('Search by')
            .setFieldName('advertiserSearchMode')
            .addItem('Name (advertiser API)', 'name', true)
            .addItem('Domain', 'domain', false)
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Search advertisers & create sheet')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handleCreateAdvertiserSheet')
            )
        )
    );

    if (cachedAdvertisers && cachedAdvertisers.body) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Latest advertiser search')
          .addWidget(
            CardService.newDecoratedText()
              .setText('"' + (cachedAdvertisers.query || '') + '"')
              .setBottomLabel(
                (cachedAdvertisers.searchMode === 'domain' ? 'Domain' : 'Name') +
                  ' · cached ' +
                  (cachedAdvertisers.cachedAt || '')
              )
              .setWrapText(true)
          )
          .addWidget(
            CardService.newTextButton()
              .setText('Export latest advertiser results')
              .setOnClickAction(
                CardService.newAction().setFunctionName('handleExportCachedAdvertisersToSheet')
              )
          )
      );
    }

    card.addSection(
      CardService.newCardSection()
        .setHeader('Deals search')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('dealsQuery')
            .setTitle('Deal keyword')
            .setValue(cachedDeals && cachedDeals.query ? cachedDeals.query : '')
            .setHint('e.g. coupon, sale, holiday')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Search deals & create sheet')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handleCreateDealsSheet')
            )
        )
    );

    if (cachedDeals && cachedDeals.body) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Latest deals search')
          .addWidget(
            CardService.newDecoratedText()
              .setText('"' + (cachedDeals.query || '') + '"')
              .setBottomLabel('Cached ' + (cachedDeals.cachedAt || ''))
              .setWrapText(true)
          )
          .addWidget(exportSheetButton_('deals'))
      );
    }

    card.addSection(
      CardService.newCardSection()
        .setHeader('Transactions search')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('transactionsQuery')
            .setTitle('Transaction keyword (optional)')
            .setValue(cachedTransactions && cachedTransactions.query ? cachedTransactions.query : '')
            .setHint('Advertiser or network name')
        )
        .addWidget(
          CardService.newSelectionInput()
            .setType(CardService.SelectionInputType.DROPDOWN)
            .setTitle('Days')
            .setFieldName('transactionDays')
            .addItem('Last 30 days', '30', true)
            .addItem('Last 60 days', '60', false)
            .addItem('Last 90 days', '90', false)
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Search transactions & create sheet')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handleCreateTransactionsSheet')
            )
        )
    );

    if (cachedTransactions && cachedTransactions.body) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Latest transactions search')
          .addWidget(
            CardService.newDecoratedText()
              .setText('"' + (cachedTransactions.query || 'Recent') + '"')
              .setBottomLabel('Cached ' + (cachedTransactions.cachedAt || ''))
              .setWrapText(true)
          )
          .addWidget(exportSheetButton_('transactions'))
      );
    }

    card.addSection(
      CardService.newCardSection()
        .setHeader('Advertiser contacts (Hi Energy API)')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('advertiserContactsQuery')
            .setTitle('Advertiser id or slug')
            .setValue(cachedAdvertiserContacts && cachedAdvertiserContacts.query ? cachedAdvertiserContacts.query : '')
            .setHint('e.g. nike or advertiser slug')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Fetch contacts & create sheet')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handleCreateAdvertiserContactsSheet')
            )
        )
    );

    if (cachedAdvertiserContacts && cachedAdvertiserContacts.body) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Latest advertiser contacts')
          .addWidget(
            CardService.newDecoratedText()
              .setText(cachedAdvertiserContacts.query || '')
              .setBottomLabel('Cached ' + (cachedAdvertiserContacts.cachedAt || ''))
              .setWrapText(true)
          )
          .addWidget(exportSheetButton_('advertiser_contacts'))
      );
    }

    card.addSection(
      CardService.newCardSection()
        .setHeader('Google Contacts')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('googleContactsQuery')
            .setTitle('Contact search')
            .setValue(cachedGoogleContacts && cachedGoogleContacts.query ? cachedGoogleContacts.query : '')
            .setHint('Name, email, or company')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Search contacts & create sheet')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handleCreateGoogleContactsSheet')
            )
        )
    );

    if (cachedGoogleContacts && cachedGoogleContacts.contacts && cachedGoogleContacts.contacts.length) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Latest Google Contacts search')
          .addWidget(
            CardService.newDecoratedText()
              .setText('"' + (cachedGoogleContacts.query || '') + '"')
              .setBottomLabel('Cached ' + (cachedGoogleContacts.cachedAt || ''))
              .setWrapText(true)
          )
          .addWidget(exportSheetButton_('google_contacts'))
      );
    }

    card.addSection(
      CardService.newCardSection()
        .setHeader('Universal search')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('query')
            .setTitle('Search query')
            .setValue(cached && cached.query ? cached.query : '')
            .setHint('Brand, domain, or deal keyword')
        )
        .addWidget(
          CardService.newSelectionInput()
            .setType(CardService.SelectionInputType.DROPDOWN)
            .setTitle('Scope')
            .setFieldName('scope')
            .addItem('Everything', 'all', true)
            .addItem('Advertisers (advertiser API)', 'advertisers', false)
            .addItem('Deals (deals API)', 'deals', false)
            .addItem('Transactions (transactions API)', 'transactions', false)
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Create sheet from search')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handleCreateSheetFromSearch')
            )
        )
    );

    if (cached && cached.body) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Latest search')
          .addWidget(
            CardService.newDecoratedText()
              .setText('"' + (cached.query || '') + '"')
              .setBottomLabel('Cached ' + (cached.cachedAt || ''))
              .setWrapText(true)
          )
          .addWidget(
            CardService.newTextButton()
              .setText('Export latest search results')
              .setOnClickAction(
                CardService.newAction().setFunctionName('handleExportCachedSearchToSheet')
              )
          )
      );
    }

    var cachedMcp = HiEnergyMcpExport.readCachedMcpTool();
    if (cachedMcp && cachedMcp.body) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Latest MCP tool')
          .addWidget(
            CardService.newDecoratedText()
              .setText(cachedMcp.toolName || 'MCP tool')
              .setBottomLabel(cachedMcp.query || cachedMcp.cachedAt || '')
              .setWrapText(true)
          )
          .addWidget(
            CardService.newTextButton()
              .setText('Export latest MCP tool results')
              .setOnClickAction(
                CardService.newAction().setFunctionName('handleExportMcpResultToSheet')
              )
          )
      );
    }

    return card.build();
  }

  function sheetResultCard_(result, options) {
    options = options || {};
    if (!options.hostApp) {
      options.hostApp =
        PropertiesService.getUserProperties().getProperty(HiEnergyConfig.propHostApp) || '';
    }
    if (!result.ok) {
      if (result.error === 'NO_DATA' || result.error === 'NO_CACHE') {
        return errorCard_('Nothing to export', result.message || 'No MCP data available to export.');
      }
      if (result.error === 'SHEETS_ERROR') {
        return errorCard_('Sheets error', result.message || 'Could not create the spreadsheet.');
      }
      return apiErrorCard_(result);
    }

    var title = result.usedActiveSpreadsheet ? 'Exported' : 'Sheet created';
    var subtitle = result.usedActiveSpreadsheet
      ? 'Added to this spreadsheet'
      : HiEnergyConfig.brandName;
    var card = CardService.newCardBuilder().setHeader(header_(title, subtitle));

    var rowCount = result.rowCount || 0;
    var sheetCount = result.sheetCount || 1;
    card.addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newDecoratedText()
            .setTopLabel(rowCount === 1 ? 'Row exported' : 'Rows exported')
            .setText(String(rowCount) + ' across ' + pluralize_(sheetCount, 'tab'))
            .setBottomLabel(result.usedActiveSpreadsheet ? 'In this spreadsheet' : 'New spreadsheet')
        )
    );

    var primary = filledOpenUrlButton_(
      result.usedActiveSpreadsheet ? 'Open spreadsheet' : 'Open in Sheets',
      result.url
    );
    if (primary) {
      card.addSection(CardService.newCardSection().addWidget(primary));
    }

    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextButton()
          .setText('Create another sheet')
          .setOnClickAction(
            cardAction_('onCreateSheetAction', options.hostApp ? { hostApp: options.hostApp } : null)
          )
      )
    );

    return card.build();
  }

  function draftEmailPromptCard_() {
    var card = CardService.newCardBuilder().setHeader(
      header_('Draft Email', 'Create a Gmail draft with MCP data')
    );

    card.addSection(
      sectionText_(
        'Load advertiser and deal details from the MCP server, edit the draft, then save it to Gmail.'
      )
    );

    card.addSection(
      CardService.newCardSection()
        .setHeader('Load from MCP')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('domain')
            .setTitle('Domain (optional)')
            .setHint('example.com')
        )
        .addWidget(
          CardService.newTextInput()
            .setFieldName('advertiserId')
            .setTitle('Advertiser id or slug (optional)')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Prepare draft from MCP')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handlePrepareDraftEmail')
            )
        )
    );

    card.addSection(
      CardService.newCardSection()
        .setHeader('Manual draft')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('to')
            .setTitle('To')
        )
        .addWidget(
          CardService.newTextInput()
            .setFieldName('subject')
            .setTitle('Subject')
        )
        .addWidget(
          CardService.newTextInput()
            .setFieldName('body')
            .setTitle('Body')
            .setMultiline(true)
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Create Gmail draft')
            .setOnClickAction(
              CardService.newAction().setFunctionName('handleCreateDraftEmail')
            )
        )
    );

    return card.build();
  }

  function draftEmailFormCard_(draft, options) {
    options = options || {};
    draft = draft || {};

    var card = CardService.newCardBuilder().setHeader(
      header_('Review draft', 'Edit before saving to Gmail')
    );

    var section = CardService.newCardSection()
      .addWidget(
        CardService.newTextInput()
          .setFieldName('to')
          .setTitle('To')
          .setValue(draft.to || '')
      )
      .addWidget(
        CardService.newTextInput()
          .setFieldName('subject')
          .setTitle('Subject')
          .setValue(draft.subject || '')
      )
      .addWidget(
        CardService.newTextInput()
          .setFieldName('body')
          .setTitle('Body')
          .setMultiline(true)
          .setValue(draft.body || '')
      )
      .addWidget(
        CardService.newTextButton()
          .setText('Create Gmail draft')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleCreateDraftEmail')
              .setParameters({
                replyToMessageId: options.replyToMessageId ? String(options.replyToMessageId) : ''
              })
          )
      );

    card.addSection(section);
    return card.build();
  }

  function draftResultCard_(result) {
    if (!result.ok) {
      if (result.error === 'MISSING_RECIPIENT' || result.error === 'MISSING_BODY') {
        return errorCard_('Draft incomplete', result.message || 'Fill in all draft fields.');
      }
      return errorCard_('Draft failed', result.message || result.error || 'Could not create Gmail draft.');
    }

    var card = CardService.newCardBuilder().setHeader(
      header_('Draft saved', 'Gmail draft created')
    );

    card.addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newDecoratedText()
            .setTopLabel('To')
            .setText(result.to || '')
        )
        .addWidget(
          CardService.newDecoratedText()
            .setTopLabel('Subject')
            .setText(result.subject || '')
            .setWrapText(true)
        )
    );

    var openBtn = openUrlButton_('Open in Gmail', result.gmailUrl);
    if (openBtn) {
      card.addSection(CardService.newCardSection().addWidget(openBtn));
    }

    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextButton()
          .setText('Draft another email')
          .setOnClickAction(CardService.newAction().setFunctionName('onDraftEmailAction'))
      )
    );

    return card.build();
  }

  return {
    connect: connectCard_,
    settings: settingsCard_,
    search: searchCard_,
    searchResults: searchResultsCard_,
    advertiser: advertiserCard_,
    deals: dealsCard_,
    transactions: transactionsCard_,
    contacts: contactsCard_,
    contactLookup: contactLookupCard_,
    messages: messagesCard_,
    gmailContext: gmailContextCard_,
    mcpTools: mcpToolsCard_,
    mcpToolPrompt: mcpToolPromptCard_,
    mcpToolResult: mcpToolResultCard_,
    createSheet: createSheetCard_,
    sheetResult: sheetResultCard_,
    draftEmail: draftEmailPromptCard_,
    draftEmailForm: draftEmailFormCard_,
    draftResult: draftResultCard_,
    apiError: apiErrorCard_,
    error: errorCard_
  };
})();
