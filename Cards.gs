var HiEnergyCards = (function () {
  function header_(title, subtitle) {
    return CardService.newCardHeader()
      .setTitle(title)
      .setSubtitle(subtitle || '')
      .setImageUrl('https://app.hienergy.ai/branding/hienergy-logo-black.svg')
      .setImageStyle(CardService.ImageStyle.CIRCLE);
  }

  function sectionText_(markdown) {
    return CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText(markdown)
    );
  }

  function settingsCard_() {
    var card = CardService.newCardBuilder().setHeader(
      header_('Settings', 'Hi Energy sign-in and API options')
    );

    if (!HiEnergyAuth.isConfigured()) {
      card.addSection(
        sectionText_(
          'This deployment is missing Auth0 script properties. An admin must set <b>AUTH0_DOMAIN</b>, <b>AUTH0_CLIENT_ID</b>, <b>AUTH0_CLIENT_SECRET</b>, and <b>AUTH0_AUDIENCE</b> in Apps Script project settings.'
        )
      );
    } else if (HiEnergyAuth.hasAccess()) {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Signed in')
          .addWidget(CardService.newDecoratedText().setText('Connected with Auth0').setTopLabel('Status'))
          .addWidget(
            CardService.newTextButton()
              .setText('Sign out')
              .setOnClickAction(
                CardService.newAction().setFunctionName('handleDisconnectSettings')
              )
          )
      );
    } else {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Sign in')
          .addWidget(
            CardService.newTextButton()
              .setText('Sign in with Hi Energy')
              .setOnClickAction(
                CardService.newAction().setFunctionName('handleSignIn')
              )
          )
      );
    }

    var advanced = CardService.newCardSection()
      .setHeader('Advanced: API key fallback')
      .addWidget(
        CardService.newTextInput()
          .setFieldName('apiKey')
          .setTitle('API key (optional)')
          .setHint('Uses X-Api-Key when Auth0 is unavailable')
      )
      .addWidget(
        CardService.newTextInput()
          .setFieldName('apiBase')
          .setTitle('API base URL (optional)')
          .setValue(HiEnergyApi.getApiBase())
          .setHint('Default: ' + HiEnergyConfig.defaultApiBase)
      )
      .addWidget(
        CardService.newTextButton()
          .setText('Save API key')
          .setOnClickAction(
            CardService.newAction().setFunctionName('handleSaveApiKeySettings')
          )
      );

    if (HiEnergyApi.hasApiKey()) {
      advanced.addWidget(
        CardService.newTextButton()
          .setText('Remove API key')
          .setOnClickAction(
            CardService.newAction().setFunctionName('handleRemoveApiKeySettings')
          )
      );
    }

    card.addSection(advanced);
    card.addSection(
      sectionText_(
        'Primary sign-in uses Auth0 OAuth (<b>Authorization: Bearer</b>). Tokens are stored per Google user. Optional API keys are a fallback for automation or local testing.'
      )
    );

    return card.build();
  }

  function connectCard_() {
    var intro = HiEnergyAuth.isConfigured()
      ? 'Sign in with your Hi Energy account to search advertisers, deals, and transactions without leaving Gmail, Drive, Docs, or Sheets.'
      : 'Auth0 is not configured for this add-on deployment. Ask an admin to set Auth0 script properties, or use an API key in Settings.';

    var card = CardService.newCardBuilder()
      .setHeader(header_('Hi Energy Rocket', 'Affiliate intelligence in Workspace'))
      .addSection(sectionText_(intro));

    var actions = CardService.newCardSection();
    if (HiEnergyAuth.isConfigured()) {
      actions.addWidget(
        CardService.newTextButton()
          .setText('Sign in with Hi Energy')
          .setOnClickAction(
            CardService.newAction().setFunctionName('handleSignIn')
          )
      );
    }
    actions.addWidget(
      CardService.newTextButton()
        .setText('Settings')
        .setOnClickAction(
          CardService.newAction().setFunctionName('onSettings')
        )
    );
    card.addSection(actions);

    return card.build();
  }

  function searchCard_(prefill) {
    var card = CardService.newCardBuilder().setHeader(
      header_('Search', 'Advertisers, deals, and more')
    );

    var section = CardService.newCardSection()
      .addWidget(
        CardService.newTextInput()
          .setFieldName('query')
          .setTitle('Search query')
          .setValue(prefill || '')
      )
      .addWidget(
        CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.DROPDOWN)
          .setTitle('Scope')
          .setFieldName('scope')
          .addItem('Everything', 'all', !prefill)
          .addItem('Advertisers', 'advertisers', false)
          .addItem('Deals', 'deals', false)
          .addItem('Transactions', 'transactions', false)
      )
      .addWidget(
        CardService.newTextButton()
          .setText('Search')
          .setOnClickAction(
            CardService.newAction().setFunctionName('handleSearch')
          )
      );

    card.addSection(section);
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
        'Hi Energy rejected this sign-in. Sign in again from Settings, or verify your Auth0 audience matches ' +
          HiEnergyConfig.defaultAuth0Audience + '.'
      );
    }
    if (result.error === 'API_RATE_LIMITED') {
      return errorCard_('Rate limited', 'Too many requests. Wait a minute and try again.');
    }
    return errorCard_('API error', result.message || result.error || 'Unknown error');
  }

  function labelForRecord_(type, record) {
    if (!record) {
      return 'Unknown';
    }
    if (type === 'advertisers') {
      return record.attributes.display_name || record.attributes.name || record.id;
    }
    if (type === 'deals') {
      return record.attributes.title || record.attributes.name || record.id;
    }
    if (type === 'transactions') {
      var attrs = record.attributes || record;
      return (attrs.advertiser_name || attrs.advertiser_id || 'Transaction') +
        ' · ' + (attrs.commission_amount || attrs.commission || '');
    }
    return record.attributes && (record.attributes.name || record.attributes.title) || record.id;
  }

  function subtitleForRecord_(type, record) {
    var attrs = record.attributes || record;
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

  function searchResultsCard_(query, result) {
    if (!result.ok) {
      return apiErrorCard_(result);
    }

    var card = CardService.newCardBuilder().setHeader(
      header_('Results', '"' + query + '"')
    );

    var payload = result.body || {};
    var results = payload.results || {};
    var types = Object.keys(results);
    var found = false;

    types.forEach(function (type) {
      var bucket = results[type] || {};
      var rows = bucket.data || [];
      if (!rows.length) {
        return;
      }
      found = true;
      var section = CardService.newCardSection().setHeader(
        type.charAt(0).toUpperCase() + type.slice(1) + ' (' + (bucket.total || rows.length) + ')'
      );

      rows.slice(0, HiEnergyConfig.perTypeLimit).forEach(function (row) {
        var label = labelForRecord_(type, row);
        var subtitle = subtitleForRecord_(type, row);
        var decorator = CardService.newDecoratedText()
          .setTopLabel(type.slice(0, -1))
          .setText(label)
          .setBottomLabel(subtitle)
          .setWrapText(true);

        if (type === 'advertisers') {
          var slug = row.attributes && (row.attributes.slug || row.id);
          section.addWidget(decorator.setButton(
            CardService.newTextButton()
              .setText('Open')
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('handleOpenAdvertiser')
                  .setParameters({ id: String(slug) })
              )
          ));
        } else {
          section.addWidget(decorator);
        }
      });

      card.addSection(section);
    });

    if (!found) {
      card.addSection(sectionText_('No results for <b>' + query + '</b>.'));
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
    var appUrl = attrs.url || (id ? HiEnergyConfig.appOrigin + '/advertisers/' + (attrs.slug || id) : null);
    var openBtn = openUrlButton_('Open in Hi Energy', appUrl);
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

  function dealsCard_(advertiserName, result) {
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

    return listCard_('Deals', advertiserName || 'Recent deals', rows, function (row) {
      var attrs = row.attributes || row;
      return CardService.newDecoratedText()
        .setText(attrs.title || attrs.name || row.id)
        .setBottomLabel([attrs.advertiser_name, attrs.country, attrs.status].filter(Boolean).join(' · '))
        .setWrapText(true);
    });
  }

  function transactionsCard_(advertiserName, result) {
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

    return listCard_('Transactions', advertiserName || 'Last 30 days', rows, function (row) {
      var attrs = row.attributes || row;
      return CardService.newDecoratedText()
        .setText((attrs.advertiser_name || 'Transaction') + ' · ' + (attrs.commission_amount || attrs.commission || ''))
        .setBottomLabel([attrs.network_name, attrs.transaction_date, attrs.status].filter(Boolean).join(' · '))
        .setWrapText(true);
    });
  }

  function gmailContextCard_(domain, hint) {
    var card = CardService.newCardBuilder().setHeader(
      header_('Email context', hint || 'Lookup sender domain')
    );

    card.addSection(
      CardService.newCardSection()
        .addWidget(CardService.newDecoratedText().setText(domain).setTopLabel('Domain'))
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
            .setText('Search Hi Energy')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('onSearchAction')
                .setParameters({ query: domain })
            )
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
    gmailContext: gmailContextCard_,
    error: errorCard_
  };
})();
