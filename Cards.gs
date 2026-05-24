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

  function settingsCard_() {
    var card = CardService.newCardBuilder().setHeader(
      header_('Settings', HiEnergyConfig.brandName + ' sign-in and API options')
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
              .setText('Sign in with ' + HiEnergyConfig.brandName)
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
      CardService.newCardSection()
        .setHeader('MCP server')
        .addWidget(
          CardService.newDecoratedText()
            .setTopLabel('Backend')
            .setText(HiEnergyConfig.brandName + ' MCP')
            .setBottomLabel(HiEnergyApi.getMcpUrl())
            .setWrapText(true)
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Browse MCP tools')
            .setOnClickAction(
              CardService.newAction().setFunctionName('onMcpTools')
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText('MCP documentation')
            .setOpenLink(
              CardService.newOpenLink()
                .setUrl(HiEnergyConfig.authDocsUrl)
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
    var intro = HiEnergyAuth.isConfigured()
      ? 'Sign in with your ' + HiEnergyConfig.brandName + ' account to search advertisers, deals, and transactions without leaving Gmail, Drive, Docs, or Sheets.'
      : 'Auth0 is not configured for this add-on deployment. Ask an admin to set Auth0 script properties, or use an API key in Settings.';

    var card = CardService.newCardBuilder()
      .setHeader(header_(HiEnergyConfig.brandName, HiEnergyConfig.brandTagline))
      .addSection(sectionText_(intro));

    var actions = CardService.newCardSection();
    if (HiEnergyAuth.isConfigured()) {
      actions.addWidget(
        CardService.newTextButton()
          .setText('Sign in with ' + HiEnergyConfig.brandName)
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
      header_('Search', HiEnergyConfig.brandName)
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
          .addItem('Contacts', 'contacts', false)
          .addItem('Messages', 'messages', false)
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
        'Hi Energy AI rejected this sign-in. Sign in again from Settings, or verify your Auth0 audience matches ' +
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
      var rows = bucket.data || (Array.isArray(bucket) ? bucket : []);
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
    var openBtn = openUrlButton_('Open in ' + HiEnergyConfig.brandName, appUrl);
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

    if (toolName === 'universal_search' || toolName === 'search_advertisers') {
      return searchResultsCard_(query || toolName, result);
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
      });
    }
    if (toolName === 'get_advertiser') {
      return advertiserCard_(result);
    }
    if (toolName === 'search_deals') {
      return dealsCard_(query || 'Deals', result);
    }
    if (toolName === 'search_transactions') {
      return transactionsCard_(query || 'Transactions', result);
    }
    if (toolName === 'get_advertiser_contacts') {
      var rows = (result.body && result.body.data) || result.body || [];
      if (!Array.isArray(rows)) {
        rows = [];
      }
      return listCard_('Advertiser contacts', query || toolName, rows, function (row) {
        var attrs = row.attributes || row;
        return CardService.newDecoratedText()
          .setText([attrs.given_name, attrs.family_name].filter(Boolean).join(' ') || attrs.email || row.id)
          .setBottomLabel([attrs.email, attrs.job_title, attrs.phone].filter(Boolean).join(' · '))
          .setWrapText(true);
      });
    }

    var card = CardService.newCardBuilder().setHeader(
      header_('MCP result', toolName)
    );
    card.addSection(sectionText_('<pre>' + summarizeJson_(result.body) + '</pre>'));
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
    error: errorCard_
  };
})();
