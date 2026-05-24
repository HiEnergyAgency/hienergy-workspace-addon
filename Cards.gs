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

  function exportSheetButton_(exportType) {
    if (exportType === true) {
      return CardService.newTextButton()
        .setText('Export to Google Sheet')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handleExportMcpResultToSheet')
        );
    }

    var config = {
      advertisers: {
        label: 'Export advertisers to Google Sheet',
        handler: 'handleExportCachedAdvertisersToSheet'
      },
      deals: {
        label: 'Export deals to Google Sheet',
        handler: 'handleExportCachedDealsToSheet'
      },
      transactions: {
        label: 'Export transactions to Google Sheet',
        handler: 'handleExportCachedTransactionsToSheet'
      },
      advertiser_contacts: {
        label: 'Export contacts to Google Sheet',
        handler: 'handleExportCachedAdvertiserContactsToSheet'
      },
      google_contacts: {
        label: 'Export contacts to Google Sheet',
        handler: 'handleExportCachedGoogleContactsToSheet'
      }
    };

    var entry = config[exportType];
    if (!entry) {
      return CardService.newTextButton()
        .setText('Export to Google Sheet')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handleExportCachedSearchToSheet')
        );
    }

    return CardService.newTextButton()
      .setText(entry.label)
      .setOnClickAction(CardService.newAction().setFunctionName(entry.handler));
  }

  function searchResultsCard_(query, result, options) {
    options = options || {};
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
    } else {
      card.addSection(
        CardService.newCardSection()
          .setHeader('Export')
          .addWidget(exportSheetButton_(options.exportType))
      );
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

    var card = CardService.newCardBuilder().setHeader(header_('Deals', advertiserName || 'Recent deals'));
    if (!rows.length) {
      card.addSection(sectionText_('Nothing to show.'));
    } else {
      var section = CardService.newCardSection();
      rows.slice(0, HiEnergyConfig.perTypeLimit).forEach(function (row) {
        var attrs = row.attributes || row;
        section.addWidget(
          CardService.newDecoratedText()
            .setText(attrs.title || attrs.name || row.id)
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

    var card = CardService.newCardBuilder().setHeader(header_('Transactions', advertiserName || 'Last 30 days'));
    if (!rows.length) {
      card.addSection(sectionText_('Nothing to show.'));
    } else {
      var section = CardService.newCardSection();
      rows.slice(0, HiEnergyConfig.perTypeLimit).forEach(function (row) {
        var attrs = row.attributes || row;
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
        advertiserContactRows.slice(0, HiEnergyConfig.perTypeLimit).forEach(function (row) {
          var attrs = row.attributes || row;
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

  function createSheetCard_() {
    var cachedAdvertisers = HiEnergyMcpExport.readCachedAdvertiserSearch();
    var cachedDeals = HiEnergyMcpExport.readCachedDealsSearch();
    var cachedTransactions = HiEnergyMcpExport.readCachedTransactionsSearch();
    var cachedAdvertiserContacts = HiEnergyMcpExport.readCachedAdvertiserContactsSearch();
    var cachedGoogleContacts = HiEnergyMcpExport.readCachedGoogleContactsSearch();
    var cached = HiEnergyMcpExport.readCachedSearch();
    var card = CardService.newCardBuilder().setHeader(
      header_('Create Sheet', 'Export Hi Energy and Google data to Sheets')
    );

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

  function sheetResultCard_(result) {
    if (!result.ok) {
      if (result.error === 'NO_DATA' || result.error === 'NO_CACHE') {
        return errorCard_('Nothing to export', result.message || 'No MCP data available to export.');
      }
      if (result.error === 'SHEETS_ERROR') {
        return errorCard_('Sheets error', result.message || 'Could not create the spreadsheet.');
      }
      return apiErrorCard_(result);
    }

    var card = CardService.newCardBuilder().setHeader(
      header_('Sheet created', HiEnergyConfig.brandName)
    );

    card.addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newDecoratedText()
            .setTopLabel('Rows exported')
            .setText(String(result.rowCount || 0) + ' across ' + String(result.sheetCount || 1) + ' tab(s)')
        )
    );

    var openBtn = openUrlButton_('Open spreadsheet', result.url);
    if (openBtn) {
      card.addSection(CardService.newCardSection().addWidget(openBtn));
    }

    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextButton()
          .setText('Create another sheet')
          .setOnClickAction(CardService.newAction().setFunctionName('onCreateSheetAction'))
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
