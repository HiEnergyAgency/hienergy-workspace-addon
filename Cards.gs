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

  function resolveIconForLabel_(label) {
    var key = String(label || '').toLowerCase();
    if (key.indexOf('search') !== -1) {
      return 'material:search';
    }
    if (key.indexOf('sign in') !== -1 || key.indexOf('sign out') !== -1) {
      return 'INVITE';
    }
    if (key.indexOf('save') !== -1 || key.indexOf('update api') !== -1) {
      return 'MEMBERSHIP';
    }
    if (key.indexOf('remove') !== -1 || key.indexOf('disconnect') !== -1) {
      return 'DESCRIPTION';
    }
    if (key.indexOf('new sheet') !== -1 || key.indexOf('create sheet') !== -1) {
      return 'DESCRIPTION';
    }
    if (key.indexOf('add more') !== -1 || key.indexOf('fetch all') !== -1) {
      return 'material:add';
    }
    if (key.indexOf('add to this sheet') !== -1 || key.indexOf(' to this sheet') !== -1 || key.indexOf('re-export') !== -1) {
      return 'material:add';
    }
    if (key.indexOf('add ') === 0 || key.indexOf('add ') !== -1) {
      return 'material:add';
    }
    if (key.indexOf('advertiser') !== -1) {
      return 'STORE';
    }
    if (key.indexOf('contact') !== -1 || key.indexOf('draft') !== -1 || key.indexOf('look up') !== -1) {
      return 'PERSON';
    }
    if (key.indexOf('deal') !== -1) {
      return 'OFFER';
    }
    if (key.indexOf('transaction') !== -1 || key.indexOf('commission') !== -1) {
      return 'DOLLAR';
    }
    if (key.indexOf('open') !== -1) {
      return 'BOOKMARK';
    }
    if (key.indexOf('email') !== -1 || key.indexOf('thread') !== -1 || key.indexOf('message') !== -1) {
      return 'EMAIL';
    }
    if (key.indexOf('domain') !== -1) {
      return 'MAP_PIN';
    }
    if (key.indexOf('tool') !== -1 || key.indexOf('report') !== -1 || key.indexOf('mcp') !== -1) {
      return 'STAR';
    }
    if (key.indexOf('create google') !== -1 || key.indexOf('export') !== -1) {
      return 'material:add';
    }
    if (key.indexOf('run') !== -1 || key.indexOf('prepare') !== -1) {
      return 'DESCRIPTION';
    }
    return 'DESCRIPTION';
  }

  function appIconButton_(label, config) {
    config = config || {};
    var iconName = config.iconName || resolveIconForLabel_(label);
    var altText = config.altText || label || iconName;
    var iconBtn = imageButton_(iconName, altText, config);
    if (iconBtn) {
      return iconBtn;
    }
    var textBtn = CardService.newTextButton().setText(' ');
    if (config.openLink) {
      textBtn.setOpenLink(config.openLink);
    } else if (config.action) {
      textBtn.setOnClickAction(config.action);
    }
    if (textBtn.setIcon && cardIcon_(iconName)) {
      try {
        textBtn.setIcon(cardIcon_(iconName));
      } catch (errIcon) {
        // Fall back below.
      }
    }
    if (config.filled && CardService.TextButtonStyle && CardService.TextButtonStyle.FILLED) {
      try {
        textBtn.setTextButtonStyle(CardService.TextButtonStyle.FILLED);
        if (textBtn.setBackgroundColor) {
          textBtn.setBackgroundColor(HiEnergyConfig.brandPrimaryColor);
        }
      } catch (errFilled) {
        // No-op for older runtimes.
      }
    } else if (CardService.TextButtonStyle && CardService.TextButtonStyle.TEXT) {
      try {
        textBtn.setTextButtonStyle(CardService.TextButtonStyle.TEXT);
      } catch (errText) {
        // No-op for older runtimes.
      }
    }
    if (textBtn.setAltText) {
      try {
        textBtn.setAltText(altText);
      } catch (errAlt) {
        // Optional on older runtimes.
      }
    }
    return textBtn;
  }

  function iconActionButton_(label, functionName, parameters) {
    return appIconButton_(label, { action: cardAction_(functionName, parameters) });
  }

  function iconOpenLinkButton_(label, url, options) {
    options = options || {};
    if (!url) {
      return null;
    }
    return appIconButton_(label, {
      iconName: options.iconName,
      altText: options.altText || label,
      filled: !!options.filled,
      openLink: CardService.newOpenLink().setUrl(url).setOpenAs(CardService.OpenAs.FULL_SIZE)
    });
  }

  function textActionButton_(label, action, options) {
    options = options || {};
    var btn = CardService.newTextButton().setText(String(label || ''));
    if (action) {
      btn.setOnClickAction(action);
    }
    if (options.openLink) {
      btn.setOpenLink(options.openLink);
    }
    var style = options.filled ? 'FILLED' : 'TEXT';
    if (CardService.TextButtonStyle && CardService.TextButtonStyle[style]) {
      try {
        btn.setTextButtonStyle(CardService.TextButtonStyle[style]);
      } catch (errStyle) {
        // No-op for older runtimes.
      }
    }
    if (options.filled && btn.setBackgroundColor && HiEnergyConfig.brandPrimaryColor) {
      try {
        btn.setBackgroundColor(HiEnergyConfig.brandPrimaryColor);
      } catch (errBg) {
        // No-op for older runtimes.
      }
    }
    return btn;
  }

  function filledButton_(label, action) {
    return textActionButton_(label, action, { filled: true });
  }

  function filledOpenUrlButton_(label, url) {
    if (!url) {
      return null;
    }
    return textActionButton_(label, null, {
      filled: true,
      openLink: CardService.newOpenLink().setUrl(url).setOpenAs(CardService.OpenAs.FULL_SIZE)
    });
  }

  function textOpenLinkButton_(label, url) {
    if (!url) {
      return null;
    }
    return textActionButton_(label, null, {
      openLink: CardService.newOpenLink().setUrl(url).setOpenAs(CardService.OpenAs.FULL_SIZE)
    });
  }

  function cardIcon_(name) {
    if (!CardService.Icon) {
      return null;
    }
    return CardService.Icon[name] || null;
  }

  function materialIcon_(name) {
    if (!CardService.newMaterialIcon) {
      return null;
    }
    try {
      var icon = CardService.newMaterialIcon().setName(name);
      if (icon.setFill) {
        icon.setFill(true);
      }
      return icon;
    } catch (errMaterial) {
      return null;
    }
  }

  function parseIconSpec_(iconName, config) {
    config = config || {};
    if (config.materialIcon) {
      return { kind: 'material', name: config.materialIcon };
    }
    var raw = String(iconName || '');
    if (raw.indexOf('material:') === 0) {
      return { kind: 'material', name: raw.slice(9) };
    }
    return { kind: 'enum', name: iconName };
  }

  function imageButton_(iconName, altText, config) {
    config = config || {};
    if (!CardService.newImageButton) {
      return null;
    }
    var spec = parseIconSpec_(iconName, config);
    var btn = CardService.newImageButton().setAltText(altText || iconName);
    try {
      if (spec.kind === 'material') {
        var material = materialIcon_(spec.name);
        if (!material || !btn.setMaterialIcon) {
          return null;
        }
        btn.setMaterialIcon(material);
      } else {
        var icon = cardIcon_(spec.name);
        if (!icon) {
          return null;
        }
        btn.setIcon(icon);
      }
      if (CardService.ImageButtonStyle && CardService.ImageButtonStyle.BORDERLESS) {
        btn.setImageButtonStyle(CardService.ImageButtonStyle.BORDERLESS);
      }
      if (config.openLink) {
        btn.setOpenLink(config.openLink);
      } else if (config.action) {
        btn.setOnClickAction(config.action);
      } else {
        return null;
      }
      return btn;
    } catch (err) {
      return null;
    }
  }

  function compactTextButton_(label, config) {
    return appIconButton_(label, config);
  }

  function advertiserSecondaryButtonSet_(contactsAction, dealsAction) {
    var buttons = CardService.newButtonSet();
    var added = 0;

    if (contactsAction) {
      buttons.addButton(appIconButton_('Contacts', { iconName: 'PERSON', action: contactsAction }));
      added += 1;
    }

    if (dealsAction) {
      buttons.addButton(appIconButton_('Deals', { iconName: 'OFFER', action: dealsAction }));
      added += 1;
    }

    return added ? buttons : null;
  }

  function advertiserOpenButton_(directUrl, detailsAction) {
    if (directUrl) {
      return appIconButton_('Open', {
        iconName: 'BOOKMARK',
        openLink: CardService.newOpenLink()
          .setUrl(directUrl)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      });
    }
    if (detailsAction) {
      return appIconButton_('Details', { iconName: 'DESCRIPTION', action: detailsAction });
    }
    return null;
  }

  function pluralize_(n, word) {
    if (n === 1) {
      return String(n) + ' ' + word;
    }
    var plural = word;
    if (/(ch|sh|s|x|z)$/i.test(word)) {
      plural = word + 'es';
    } else if (/[^aeiou]y$/i.test(word)) {
      plural = word.slice(0, -1) + 'ies';
    } else {
      plural = word + 's';
    }
    return String(n) + ' ' + plural;
  }

  function advertiserAppUrl_(id) {
    var clean = String(id || '').trim();
    if (!clean) {
      return '';
    }
    return HiEnergyConfig.appOrigin + (HiEnergyConfig.advertiserPath || '/a/') + encodeURIComponent(clean);
  }

  function isWhitelistedUrl_(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    var prefixes = [HiEnergyConfig.appOrigin + '/'];
    for (var i = 0; i < prefixes.length; i += 1) {
      if (url.indexOf(prefixes[i]) === 0) {
        return true;
      }
    }
    return false;
  }

  function preferredAdvertiserUrl_(attrs, id) {
    var canonical = advertiserAppUrl_(id);
    if (canonical) {
      return canonical;
    }
    if (isWhitelistedUrl_(attrs.url)) {
      return attrs.url;
    }
    return '';
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
        .addWidget(iconActionButton_('Sign out of Auth0', 'handleSignOutAuth0'));
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
      apiKeySection.addWidget(iconActionButton_('Remove API key', 'handleRemoveApiKeySettings'));
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
    backendSection.addWidget(iconActionButton_('Save backend URLs', 'handleSaveBackendUrls'));
    backendSection.addWidget(iconActionButton_('Reset to defaults', 'handleResetBackendUrls'));
    backendSection.addWidget(iconActionButton_('Browse MCP tools', 'onMcpTools'));
    backendSection.addWidget(iconOpenLinkButton_('MCP documentation', HiEnergyConfig.authDocsUrl));
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
          .addWidget(iconActionButton_('Disconnect everything', 'handleDisconnectSettings'))
      );
    }
    card.addSection(
      CardService.newCardSection()
        .setHeader('Legal')
        .addWidget(iconOpenLinkButton_('Privacy policy', HiEnergyConfig.privacyPolicyUrl))
        .addWidget(iconOpenLinkButton_('Terms of service', HiEnergyConfig.termsOfServiceUrl))
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
        'Search Hi Energy AI advertisers, deals, and transactions — and export up to 500 rows to Google Sheets — right from Gmail, Sheets, Docs, Slides, Drive, and Calendar.\n\nPick how you want to connect:'
      )
    );

    var oauthSection = CardService.newCardSection().setHeader('Sign in (recommended)');
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
      CardService.newCardSection().addWidget(iconActionButton_('Advanced settings', 'onSettings'))
    );

    return card.build();
  }

  function searchCard_(prefill, options) {
    options = options || {};
    var hostApp = options.hostApp || '';
    var isGmail = !hostApp || hostApp === 'GMAIL';
    var isSheets = hostApp === 'SHEETS';
    var isSlides = hostApp === 'SLIDES';
    var isDocs = hostApp === 'DOCS';

    var subtitle = 'Advertisers · deals · transactions · contacts';
    if (isSheets) {
      subtitle = 'Search and export into this spreadsheet';
    } else if (isSlides) {
      subtitle = 'Look up Hi Energy AI from your presentation';
    } else if (isDocs) {
      subtitle = 'Look up Hi Energy AI from your document';
    }

    var card = CardService.newCardBuilder().setHeader(header_('Hi Energy AI', subtitle));

    var scopeInput = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle('Scope')
      .setFieldName('scope')
      .addItem('Everything', 'all', !prefill)
      .addItem('Advertisers', 'advertisers', false)
      .addItem('Deals', 'deals', false)
      .addItem('Transactions', 'transactions', false)
      .addItem('Contacts', 'contacts', false)
      .addItem('Google contacts', 'google_contacts', false);

    if (isGmail) {
      scopeInput.addItem('Messages', 'messages', false);
    }

    var searchSection = CardService.newCardSection()
      .addWidget(
        CardService.newTextInput()
          .setFieldName('query')
          .setTitle('Search')
          .setHint('Brand, domain, or keyword — e.g. Nike, nike.com, summer sale')
          .setValue(prefill || '')
      )
      .addWidget(scopeInput)
      .addWidget(
        CardService.newButtonSet().addButton(
          filledButton_('Search', cardAction_('handleSearch'))
        )
      );

    card.addSection(searchSection);

    if (!prefill) {
      var exampleSet = CardService.newButtonSet();
      ['Nike', 'Sephora', 'Adidas', 'summer sale'].forEach(function (example) {
        exampleSet.addButton(
          textActionButton_(
            example,
            cardAction_('handleSearch', { query: example, scope: 'all' })
          )
        );
      });
      card.addSection(
        CardService.newCardSection()
          .setHeader('Try an example')
          .addWidget(exampleSet)
      );
    }

    var primaryActionLabel = isSheets ? 'Create tabs in this sheet' : 'Create a Google Sheet';
    card.addSection(
      CardService.newCardSection().addWidget(
        filledButton_(
          primaryActionLabel,
          cardAction_('onCreateSheetAction', hostApp ? { hostApp: hostApp } : null)
        )
      )
    );

    var quickButtons = CardService.newButtonSet();
    if (isGmail) {
      quickButtons.addButton(
        textActionButton_('Draft email', cardAction_('onDraftEmailAction'))
      );
    }
    quickButtons
      .addButton(textActionButton_('Reports', cardAction_('onReports')))
      .addButton(textActionButton_('MCP tools', cardAction_('onMcpTools')));
    if (HiEnergyConfig.appOrigin) {
      quickButtons.addButton(textOpenLinkButton_('Open app', HiEnergyConfig.appOrigin));
    }
    card.addSection(
      CardService.newCardSection()
        .setHeader('More')
        .addWidget(quickButtons)
    );

    var tip = '';
    if (isSheets) {
      tip = 'Tip: search results include <b>Export to this spreadsheet</b>. Use <b>Create tabs</b> to export advertisers, deals, transactions, and contacts in one go.';
    } else if (isSlides) {
      tip = 'Tip: open advertisers in <b>Hi Energy AI</b> for screenshots, or export to a sheet you can chart and embed in slides.';
    } else if (isDocs) {
      tip = 'Tip: open the Hi Energy AI page for any advertiser, or export to a sheet for tables you can paste into Docs.';
    } else if (isGmail) {
      tip = 'Tip: open an email to see sender context — or search advertisers, deals, and transactions above.';
    }
    if (tip) {
      card.addSection(sectionText_(tip));
    }

    return card.build();
  }

  function errorCard_(title, message) {
    var card = CardService.newCardBuilder()
      .setHeader(header_(title, 'Something went wrong'))
      .addSection(sectionText_(message));
    card.addSection(
      CardService.newCardSection().addWidget(iconActionButton_('Back to search', 'onSearchAction'))
    );
    return card.build();
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

  function personName_(attrs) {
    var combined = [attrs.given_name, attrs.family_name].filter(Boolean).join(' ').trim();
    return combined || attrs.full_name || attrs.name || attrs.display_name || '';
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
    if (type === 'contacts' || type === 'advertiser_contacts' || type === 'users') {
      var given = attrs.given_name || attrs.givenName || attrs.first_name || '';
      var family = attrs.family_name || attrs.familyName || attrs.last_name || '';
      var combined = [given, family].filter(Boolean).join(' ').trim();
      return combined || personName_(attrs) || attrs.email || id || 'Contact';
    }
    return attrs.name || attrs.title || attrs.display_name || id || 'Result';
  }

  function advertiserStatus_(attrs) {
    return attrs.program_status || attrs.status || attrs.advertiser_status || '';
  }

  function advertiserPublisher_(attrs) {
    return attrs.publisher_name || attrs.publisher || attrs.publisher_display_name || '';
  }

  function humanize_(value) {
    var str = String(value || '').replace(/[_-]+/g, ' ').trim();
    if (!str) {
      return '';
    }
    if (str.toLowerCase() === 'not applied') {
      return 'Available';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function topLabelForRecord_(type, record) {
    var attrs = attrsForRecord_(record);
    if (type === 'advertisers') {
      var status = humanize_(advertiserStatus_(attrs));
      var publisher = advertiserPublisher_(attrs);
      if (status && publisher) {
        return status + ' · ' + publisher;
      }
      return status || publisher || 'Advertiser';
    }
    if (type === 'deals') {
      return humanize_(attrs.deal_type || attrs.type || attrs.category) || 'Deal';
    }
    if (type === 'transactions') {
      return humanize_(attrs.status) || 'Transaction';
    }
    if (type === 'contacts' || type === 'advertiser_contacts' || type === 'users') {
      return humanize_(attrs.job_title || attrs.title || attrs.role) || 'Contact';
    }
    return humanize_(type.slice(0, -1));
  }

  function escapeHtml_(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusColor_(status) {
    var key = String(status || '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ');
    if (/approved|active|live|available/.test(key)) {
      return '#16a34a';
    }
    if (/reject|denied|inactive|closed|suspended/.test(key)) {
      return '#dc2626';
    }
    if (/pending|applied|unknown|not applied/.test(key)) {
      return '#d97706';
    }
    return '#6b7280';
  }

  function statusHtml_(status) {
    var label = humanize_(status);
    if (!label) {
      return '';
    }
    return (
      '<font color="' +
      statusColor_(status) +
      '"><b>' +
      escapeHtml_(label) +
      '</b></font>'
    );
  }

  function mutedHtml_(value) {
    var text = String(value || '').trim();
    if (!text) {
      return '';
    }
    return '<font color="#6b7280">' + escapeHtml_(text) + '</font>';
  }

  function advertiserDecoratedText_(attrs, name) {
    var status = advertiserStatus_(attrs);
    var publisher = advertiserPublisher_(attrs);
    var domain = attrs.domain || '';
    var network = attrs.network_name || '';
    var metaParts = [];
    if (status) {
      metaParts.push(statusHtml_(status));
    }
    if (publisher) {
      metaParts.push(mutedHtml_(publisher));
    }
    var detailParts = [];
    if (domain) {
      detailParts.push(escapeHtml_(domain));
    }
    if (network) {
      detailParts.push(escapeHtml_(network));
    }
    var bottom = '';
    if (metaParts.length && detailParts.length) {
      bottom =
        metaParts.join(' &nbsp;·&nbsp; ') +
        '<br>' +
        mutedHtml_(detailParts.join(' · '));
    } else if (metaParts.length) {
      bottom = metaParts.join(' &nbsp;·&nbsp; ');
    } else if (detailParts.length) {
      bottom = mutedHtml_(detailParts.join(' · '));
    }

    var decorator = CardService.newDecoratedText()
      .setText('<b>' + escapeHtml_(name) + '</b>')
      .setWrapText(true);
    if (bottom) {
      decorator.setBottomLabel(bottom);
    }
    if (CardService.newIconImage && cardIcon_('STORE')) {
      try {
        decorator.setStartIcon(
          CardService.newIconImage().setIcon(CardService.Icon.STORE)
        );
      } catch (errIcon) {
        // Older CardService runtimes may not support start icons.
      }
    }
    return decorator;
  }

  function subtitleForRecord_(type, record) {
    var attrs = attrsForRecord_(record);
    if (type === 'advertisers') {
      return [attrs.domain, attrs.network_name].filter(Boolean).join(' · ');
    }
    if (type === 'deals') {
      return [attrs.advertiser_name, attrs.country, attrs.status].filter(Boolean).join(' · ');
    }
    if (type === 'transactions') {
      return [attrs.network_name, attrs.transaction_date, attrs.status].filter(Boolean).join(' · ');
    }
    if (type === 'contacts' || type === 'advertiser_contacts' || type === 'users') {
      var given = attrs.given_name || attrs.givenName || attrs.first_name || '';
      var linkedin = attrs.linkedin_url || attrs.linkedin || attrs.linkedin_profile_url || '';
      var advertiserCompany =
        attrs.advertiser_name ||
        attrs.advertiser_company ||
        attrs.advertiser_company_name ||
        attrs.company_name ||
        attrs.company ||
        (attrs.advertiser &&
          (attrs.advertiser.display_name ||
            attrs.advertiser.name ||
            (attrs.advertiser.attributes &&
              (attrs.advertiser.attributes.display_name || attrs.advertiser.attributes.name)))) ||
        attrs.organization ||
        '';
      var contactStatus = humanize_(
        attrs.status ||
          attrs.email_status ||
          attrs.email_validation_status ||
          attrs.verification_status ||
          ''
      );
      return [
        advertiserCompany,
        contactStatus,
        given ? 'Given: ' + given : '',
        attrs.email,
        attrs.job_title || attrs.title,
        linkedin,
        attrs.phone
      ]
        .filter(Boolean)
        .join(' · ');
    }
    return '';
  }

  function openUrlButton_(label, url) {
    return iconOpenLinkButton_(label, url, {});
  }

  function currentHostApp_() {
    try {
      return PropertiesService.getUserProperties().getProperty(HiEnergyConfig.propHostApp) || '';
    } catch (err) {
      return '';
    }
  }

  function exportLabel_(base) {
    if (currentHostApp_() === 'SHEETS') {
      if (base === 'Export search results' || base === 'Export results') {
        return 'Add to this sheet';
      }
      return base.replace(/^Export /, 'Add ') + ' to this sheet';
    }
    if (base === 'Export search results' || base === 'Export results') {
      return 'Create Google Sheet';
    }
    return base + ' to Google Sheet';
  }

  function exportSheetButton_(exportType, params) {
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
        cardAction_('handleExportCachedSearchToSheet', params || null)
      );
    }

    return filledButton_(entry.label, cardAction_(entry.handler, params || null));
  }

  function exportNewSheetButton_(exportType, params) {
    var handler;
    if (exportType === true) {
      handler = 'handleExportMcpResultToSheet';
    } else {
      var map = {
        advertisers: 'handleExportCachedAdvertisersToSheet',
        deals: 'handleExportCachedDealsToSheet',
        transactions: 'handleExportCachedTransactionsToSheet',
        advertiser_contacts: 'handleExportCachedAdvertiserContactsToSheet',
        google_contacts: 'handleExportCachedGoogleContactsToSheet'
      };
      handler = map[exportType] || 'handleExportCachedSearchToSheet';
    }
    var actionParams = {};
    if (params) {
      Object.keys(params).forEach(function (k) {
        actionParams[k] = params[k];
      });
    }
    actionParams.newSheet = 'true';
    return appIconButton_('New sheet', {
      iconName: 'DESCRIPTION',
      action: cardAction_(handler, actionParams)
    });
  }

  function exportButtonSet_(exportType, params) {
    var buttons = CardService.newButtonSet().addButton(
      exportSheetButton_(exportType, params)
    );
    if (currentHostApp_() === 'SHEETS') {
      buttons.addButton(exportNewSheetButton_(exportType, params));
    }
    return buttons;
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

    var typeBreakdown = types
      .map(function (type) {
        var t = totals[type] || {};
        if (!t.total) return '';
        var label = type.charAt(0).toUpperCase() + type.slice(1);
        return label + ' ' + t.total;
      })
      .filter(Boolean)
      .join(' · ');
    var subtitle = grandTotal
      ? '“' + query + '” · ' + pluralize_(grandTotal, 'match') +
        (typeBreakdown ? ' · ' + typeBreakdown : '')
      : 'No matches for “' + query + '”';

    var card = CardService.newCardBuilder().setHeader(header_(query || 'Results', subtitle));

    var exportParams = { query: String(query || '') };
    if (options.searchMode) {
      exportParams.searchMode = String(options.searchMode);
    }

    if (grandTotal) {
      var actionRow = CardService.newButtonSet()
        .addButton(exportSheetButton_(options.exportType, exportParams));
      if (currentHostApp_() === 'SHEETS') {
        actionRow.addButton(exportNewSheetButton_(options.exportType, exportParams));
      }
      actionRow.addButton(
        iconActionButton_(
          'New search',
          'onSearchAction',
          options.hostApp ? { hostApp: options.hostApp } : null
        )
      );
      card.addSection(CardService.newCardSection().addWidget(actionRow));
    }

    var found = false;
    types.forEach(function (type) {
      var entry = totals[type];
      if (!entry || !entry.rows.length) {
        return;
      }
      found = true;
      var typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      var shownCount = Math.min(entry.rows.length, HiEnergyConfig.perTypeLimit);
      var sectionHeader =
        '<b>' + typeLabel + '</b> · ' + pluralize_(entry.total, 'match');
      if (entry.total > shownCount) {
        sectionHeader +=
          ' <font color="#6b7280">· showing ' + shownCount + '</font>';
      }
      var section = CardService.newCardSection().setHeader(sectionHeader);

      normalizeResultRows_(entry.rows)
        .slice(0, HiEnergyConfig.perTypeLimit)
        .forEach(function (row) {
          var label = labelForRecord_(type, row);
          var subtitleText = subtitleForRecord_(type, row);
          var topLabel = topLabelForRecord_(type, row);
          var isAdvertiser = type === 'advertisers';
          var attrs = attrsForRecord_(row);
          var decorator;
          if (isAdvertiser) {
            decorator = advertiserDecoratedText_(attrs, label);
          } else {
            decorator = CardService.newDecoratedText()
              .setTopLabel(topLabel)
              .setText(label)
              .setBottomLabel(subtitleText)
              .setWrapText(true);
          }

          if (type === 'contacts' || type === 'advertiser_contacts' || type === 'users') {
            var cAttrs = attrsForRecord_(row);
            var contactEmail = String(cAttrs.email || '').trim();
            if (contactEmail) {
              decorator.setButton(
                appIconButton_('Draft', {
                  iconName: 'EMAIL',
                  action: cardAction_('handleDraftEmailToContact', {
                    email: contactEmail,
                    name: personName_(cAttrs),
                    advertiserId: String(cAttrs.advertiser_id || ''),
                    advertiserName: String(
                      cAttrs.advertiser_name ||
                        cAttrs.advertiser_company ||
                        cAttrs.advertiser_company_name ||
                        cAttrs.company_name ||
                        cAttrs.organization ||
                        ''
                    )
                  })
                })
              );
            }
          }
          section.addWidget(decorator);
          if (type === 'advertisers') {
            var advertiserId = recordId_(row, attrs);
            var advertiserActionSlug = String(attrs.slug || advertiserId || '');
            var directUrl = preferredAdvertiserUrl_(attrs, advertiserId);
            var advRow = CardService.newButtonSet();
            var openBtn = advertiserOpenButton_(
              directUrl,
              directUrl
                ? null
                : cardAction_('handleOpenAdvertiser', { id: advertiserActionSlug })
            );
            if (openBtn) {
              advRow.addButton(openBtn);
            }
            if (advertiserActionSlug) {
              advRow.addButton(
                appIconButton_('Contacts', {
                  iconName: 'PERSON',
                  action: cardAction_('handleCreateAdvertiserContactsSheet', {
                    query: labelForRecord_(type, row),
                    advertiser: advertiserActionSlug
                  })
                })
              );
              advRow.addButton(
                appIconButton_('Deals', {
                  iconName: 'OFFER',
                  action: cardAction_('handleAdvertiserDeals', {
                    id: advertiserActionSlug,
                    name: labelForRecord_(type, row)
                  })
                })
              );
            }
            section.addWidget(advRow);
          }
        });

      var sectionExportType =
        type === 'contacts' || type === 'advertiser_contacts'
          ? 'advertiser_contacts'
          : type;
      section.addWidget(
        CardService.newButtonSet().addButton(
          exportSheetButton_(sectionExportType, exportParams)
        )
      );

      card.addSection(section);
    });

    if (!found) {
      card.addSection(
        sectionText_(
          'No results for <b>' + query + '</b>. Try a broader keyword or change the scope.'
        )
      );
    }

    if (!grandTotal) {
      var emptyFooter = CardService.newCardSection().addWidget(
        CardService.newButtonSet().addButton(
          iconActionButton_(
            'New search',
            'onSearchAction',
            options.hostApp ? { hostApp: options.hostApp } : null
          )
        )
      );
      card.addSection(emptyFooter);
    }

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

    var publisherId = HiEnergyMcpExport.publisherIdFromAttrs(attrs);
    var publisherUrl = publisherId
      ? HiEnergyConfig.appOrigin +
        (HiEnergyConfig.publisherAdminPath || '/admin/publishers/') +
        encodeURIComponent(publisherId)
      : '';
    var facts = [
      ['Network', attrs.network_name],
      ['Status', attrs.program_status || attrs.status],
      ['Commission', attrs.commission_rate || attrs.average_commission_rate],
      ['Domain', attrs.domain],
      ['Publisher', attrs.publisher_name, publisherUrl]
    ].filter(function (pair) { return pair[1]; });

    if (facts.length) {
      var section = CardService.newCardSection().setHeader('Overview');
      facts.forEach(function (pair) {
        var widget = CardService.newKeyValue()
          .setTopLabel(pair[0])
          .setContent(String(pair[1]));
        if (pair[2]) {
          widget.setOnClickAction(
            CardService.newAction()
              .setFunctionName('openUrlAction_')
              .setParameters({ url: pair[2] })
          );
        }
        section.addWidget(widget);
      });
      card.addSection(section);
    }

    var actions = CardService.newCardSection();
    var appUrl = preferredAdvertiserUrl_(attrs, id) || (id ? advertiserAppUrl_(id) : null);
    var openBtn = filledOpenUrlButton_('Open in ' + HiEnergyConfig.brandName, appUrl) ||
      openUrlButton_('Open in ' + HiEnergyConfig.brandName, appUrl);
    if (openBtn) {
      actions.addWidget(openBtn);
    }
    var actionRow1 = CardService.newButtonSet();
    actionRow1
      .addButton(
        appIconButton_('Deals', {
          iconName: 'OFFER',
          action: CardService.newAction()
            .setFunctionName('handleAdvertiserDeals')
            .setParameters({ id: String(attrs.slug || id), name: name })
        })
      )
      .addButton(
        appIconButton_('Transactions', {
          iconName: 'DOLLAR',
          action: CardService.newAction()
            .setFunctionName('handleAdvertiserTransactions')
            .setParameters({ id: String(attrs.slug || id), name: name })
        })
      );
    actions.addWidget(actionRow1);
    var actionRow2 = CardService.newButtonSet();
    actionRow2
      .addButton(
        appIconButton_('Draft email', {
          iconName: 'EMAIL',
          action: CardService.newAction()
            .setFunctionName('handleDraftEmailFromAdvertiser')
            .setParameters({ id: String(attrs.slug || id), name: name })
        })
      )
      .addButton(
        appIconButton_('Export contacts', {
          iconName: 'PERSON',
          action: CardService.newAction()
            .setFunctionName('handleCreateAdvertiserContactsSheet')
            .setParameters({
              query: name,
              advertiser: String(attrs.slug || id)
            })
        })
      );
    actions.addWidget(actionRow2);
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
    var widget = CardService.newDecoratedText()
      .setTopLabel('Contact')
      .setText(contact.name || contact.email || 'Unknown contact')
      .setBottomLabel(subtitle)
      .setWrapText(true);

    if (contact.email) {
      widget.setButton(
        appIconButton_('Draft', {
          iconName: 'EMAIL',
          action: cardAction_('handleDraftEmailToContact', {
            email: String(contact.email),
            name: String(contact.name || ''),
            advertiserName: String(contact.organization || '')
          })
        })
      );
    }

    return widget;
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
        appIconButton_('View thread', {
          iconName: 'EMAIL',
          action: CardService.newAction()
            .setFunctionName('handleViewThread')
            .setParameters({ messageId: String(message.id) })
        })
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
        appIconButton_('Export contacts to Google Sheet', {
          materialIcon: 'add',
          action: CardService.newAction()
            .setFunctionName('handleCreateGoogleContactsSheet')
            .setParameters({ query: query })
        })
      )
    );

    card.addSection(
      CardService.newCardSection().addWidget(iconActionButton_('New search', 'onSearchAction'))
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
      CardService.newCardSection().addWidget(iconActionButton_('New search', 'onSearchAction'))
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
        appIconButton_('Look up contact', {
          iconName: 'PERSON',
          action: CardService.newAction()
            .setFunctionName('handleLookupContact')
            .setParameters({ email: context.senderEmail })
        })
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
        appIconButton_('View thread', {
          iconName: 'EMAIL',
          action: CardService.newAction()
            .setFunctionName('handleViewThread')
            .setParameters({ messageId: String(message.id) })
        })
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
        appIconButton_('View all from ' + domain, {
          iconName: 'EMAIL',
          action: CardService.newAction()
            .setFunctionName('handleViewDomainMessages')
            .setParameters({ domain: domain })
        })
      );
      card.addSection(messagesSection);
    }

    var gmailActions = CardService.newCardSection().setHeader(HiEnergyConfig.brandName);
    gmailActions.addWidget(
      CardService.newButtonSet()
        .addButton(
          appIconButton_('Find advertiser', {
            iconName: 'STORE',
            action: CardService.newAction()
              .setFunctionName('handleDomainLookup')
              .setParameters({ domain: domain })
          })
        )
        .addButton(
          appIconButton_('Search', {
            materialIcon: 'search',
            action: CardService.newAction()
              .setFunctionName('onSearchAction')
              .setParameters({ query: domain })
          })
        )
    );
    gmailActions.addWidget(
      appIconButton_('Draft email', {
        iconName: 'EMAIL',
        action: CardService.newAction()
          .setFunctionName('handleDraftEmailFromContext')
          .setParameters({
            domain: domain,
            senderEmail: context.senderEmail || '',
            senderName: context.senderName || '',
            messageId: message.id ? String(message.id) : '',
            subject: message.subject || ''
          })
      })
    );
    card.addSection(gmailActions);

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
            appIconButton_('Use', {
              iconName: 'STAR',
              action: CardService.newAction()
                .setFunctionName('handleMcpToolPrompt')
                .setParameters({
                  tool: String(tool.name || ''),
                  description: description
                })
            })
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
            .setTitle('Input (optional)')
            .setHint('Search term, domain, advertiser id, or report goal')
        )
        .addWidget(
          filledButton_(
            exportLabel_('Run & export'),
            CardService.newAction()
              .setFunctionName('handleRunAndExportMcpTool')
              .setParameters({ tool: toolName })
          )
        )
        .addWidget(
          appIconButton_('Run only', {
            iconName: 'DESCRIPTION',
            action: CardService.newAction()
              .setFunctionName('handleMcpToolCall')
              .setParameters({ tool: toolName })
          })
        )
    );

    return card.build();
  }

  function reportsCard_(result) {
    if (!result.ok) {
      return apiErrorCard_(result);
    }

    var tools = (result.body && result.body.tools) || [];
    var reports = tools.filter(function (tool) {
      var name = String(tool.name || '').toLowerCase();
      var desc = String(tool.description || '').toLowerCase();
      return /report|export|download|summary|metrics|insights|trend|forecast|leaderboard/.test(name) ||
        /report|insights|metrics|leaderboard|summary/.test(desc);
    });

    var card = CardService.newCardBuilder().setHeader(
      header_('Reports', 'Download anything you have access to')
    );

    if (!reports.length) {
      card.addSection(
        sectionText_(
          'No report-style tools detected on your MCP server. Open <b>MCP Tools</b> to browse the full list — any tool result can be exported to a Google Sheet.'
        )
      );
      card.addSection(
        CardService.newCardSection().addWidget(iconActionButton_('Browse all MCP tools', 'onMcpTools'))
      );
      return card.build();
    }

    var listSection = CardService.newCardSection().setHeader('Available reports');
    reports.slice(0, HiEnergyConfig.mcpToolLimit).forEach(function (tool) {
      var description = tool.description || 'Run this report';
      listSection.addWidget(
        CardService.newDecoratedText()
          .setTopLabel(tool.name || 'report')
          .setText(description)
          .setWrapText(true)
          .setButton(
            appIconButton_(exportLabel_('Run & export'), {
              materialIcon: 'add',
              action: CardService.newAction()
                .setFunctionName('handleRunAndExportMcpTool')
                .setParameters({
                  tool: String(tool.name || ''),
                  description: description
                })
            })
          )
      );
      listSection.addWidget(
        appIconButton_('Configure inputs', {
          iconName: 'DESCRIPTION',
          action: CardService.newAction()
            .setFunctionName('handleMcpToolPrompt')
            .setParameters({
              tool: String(tool.name || ''),
              description: description
            })
        })
      );
    });
    card.addSection(listSection);

    card.addSection(
      CardService.newCardSection().addWidget(iconActionButton_('All MCP tools', 'onMcpTools'))
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
        header_('Contacts', query || toolName)
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
          filledButton_(
            exportLabel_('Export to Google Sheet'),
            cardAction_('handleExportMcpResultToSheet')
          )
        )
        .addWidget(iconActionButton_('Back to MCP tools', 'onMcpTools'))
    );
    return card.build();
  }

  function recentExportChip_(label, query, when, handler) {
    var section = CardService.newCardSection().setHeader(label);
    var deco = CardService.newDecoratedText()
      .setText('"' + (query || 'Recent') + '"')
      .setWrapText(true);
    if (when) {
      deco.setBottomLabel('Cached ' + when);
    }
    section.addWidget(deco);
    section.addWidget(
      appIconButton_('Re-export to sheet', {
        materialIcon: 'add',
        action: cardAction_(handler)
      })
    );
    return section;
  }

  function exportTypeHintFor_(type) {
    if (type === 'deals') {
      return 'Try: coupon, sale, holiday';
    }
    if (type === 'transactions') {
      return 'Advertiser or network (optional)';
    }
    if (type === 'contacts') {
      return 'Advertiser id or slug, e.g. nike';
    }
    if (type === 'google_contacts') {
      return 'Name, email, or company';
    }
    return 'Brand or domain, e.g. Nike or nike.com';
  }

  function createSheetCard_(options) {
    options = options || {};
    var hostApp = options.hostApp || currentHostApp_();
    var cachedAdvertisers = HiEnergyMcpExport.readCachedAdvertiserSearch();
    var cachedDeals = HiEnergyMcpExport.readCachedDealsSearch();
    var cachedTransactions = HiEnergyMcpExport.readCachedTransactionsSearch();
    var cachedAdvertiserContacts = HiEnergyMcpExport.readCachedAdvertiserContactsSearch();
    var cachedGoogleContacts = HiEnergyMcpExport.readCachedGoogleContactsSearch();
    var cachedSearch = HiEnergyMcpExport.readCachedSearch();
    var defaultType = String(options.exportType || 'advertisers');
    var prefillQuery = String(options.query || '').trim();
    if (!prefillQuery) {
      if (defaultType === 'deals' && cachedDeals && cachedDeals.query) {
        prefillQuery = cachedDeals.query;
      } else if (defaultType === 'transactions' && cachedTransactions && cachedTransactions.query) {
        prefillQuery = cachedTransactions.query;
      } else if ((defaultType === 'contacts' || defaultType === 'advertiser_contacts') && cachedAdvertiserContacts && cachedAdvertiserContacts.query) {
        prefillQuery = cachedAdvertiserContacts.query;
      } else if (defaultType === 'google_contacts' && cachedGoogleContacts && cachedGoogleContacts.query) {
        prefillQuery = cachedGoogleContacts.query;
      } else if (defaultType === 'everything' && cachedSearch && cachedSearch.query) {
        prefillQuery = cachedSearch.query;
      } else if (cachedAdvertisers && cachedAdvertisers.query) {
        prefillQuery = cachedAdvertisers.query;
      }
    }

    var subtitle =
      hostApp === 'SHEETS'
        ? 'Add rows as tabs in this spreadsheet (100 per API page until done)'
        : 'Generate a spreadsheet (100 per API page until done)';
    var card = CardService.newCardBuilder().setHeader(header_('Create Sheet', subtitle));

    var typeSelect = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle('Export')
      .setFieldName('exportType')
      .addItem('Advertisers', 'advertisers', defaultType === 'advertisers')
      .addItem('Deals', 'deals', defaultType === 'deals')
      .addItem('Transactions', 'transactions', defaultType === 'transactions')
      .addItem('Contacts', 'contacts', defaultType === 'contacts' || defaultType === 'advertiser_contacts')
      .addItem('Google contacts', 'google_contacts', defaultType === 'google_contacts')
      .addItem('Everything (one tab per type)', 'everything', defaultType === 'everything');

    var queryInput = CardService.newTextInput()
      .setFieldName('query')
      .setTitle('Search')
      .setValue(prefillQuery)
      .setHint(exportTypeHintFor_(defaultType));

    var advertiserModeSelect = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle('Match by (advertisers)')
      .setFieldName('searchMode')
      .addItem('Name', 'name', true)
      .addItem('Domain', 'domain', false);

    var daysSelect = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle('Date range (transactions)')
      .setFieldName('transactionDays')
      .addItem('Last 30 days', '30', true)
      .addItem('Last 60 days', '60', false)
      .addItem('Last 90 days', '90', false);

    var advertiserIdInput = CardService.newTextInput()
      .setFieldName('transactionAdvertiserId')
      .setTitle('Advertiser id or slug (transactions, optional)')
      .setHint('Filter transactions to one advertiser');

    card.addSection(
      CardService.newCardSection()
        .addWidget(typeSelect)
        .addWidget(queryInput)
        .addWidget(advertiserModeSelect)
        .addWidget(daysSelect)
        .addWidget(advertiserIdInput)
        .addWidget(filledButton_('Create sheet', cardAction_('handleCreateSheet')))
    );

    card.addSection(
      sectionText_(
        'Fetches <b>100 rows per page</b> from the API until no results remain. ' +
          'Use <b>Add more</b> if a large export was interrupted. ' +
          (hostApp === 'SHEETS'
            ? 'Results are added as tabs in this spreadsheet.'
            : 'A new spreadsheet is created in your Drive.')
      )
    );

    var recentSection = null;
    function addRecent(label, cached, handler) {
      if (!cached || !cached.body) {
        return;
      }
      if (!recentSection) {
        recentSection = CardService.newCardSection().setHeader('Re-export from cache');
        card.addSection(recentSection);
      }
      var deco = CardService.newDecoratedText()
        .setTopLabel(label)
        .setText('"' + (cached.query || 'Recent') + '"')
        .setWrapText(true)
        .setButton(
          appIconButton_('Re-export', {
            materialIcon: 'add',
            action: cardAction_(handler)
          })
        );
      if (cached.cachedAt) {
        deco.setBottomLabel('Cached ' + cached.cachedAt);
      }
      recentSection.addWidget(deco);
    }

    addRecent('Advertisers', cachedAdvertisers, 'handleExportCachedAdvertisersToSheet');
    addRecent('Deals', cachedDeals, 'handleExportCachedDealsToSheet');
    addRecent('Transactions', cachedTransactions, 'handleExportCachedTransactionsToSheet');
    addRecent('Contacts', cachedAdvertiserContacts, 'handleExportCachedAdvertiserContactsToSheet');
    if (cachedGoogleContacts && cachedGoogleContacts.contacts && cachedGoogleContacts.contacts.length) {
      addRecent('Google contacts', { body: true, query: cachedGoogleContacts.query, cachedAt: cachedGoogleContacts.cachedAt },
        'handleExportCachedGoogleContactsToSheet');
    }
    addRecent('Everything', cachedSearch, 'handleExportCachedSearchToSheet');

    return card.build();
  }

  function sheetResultNotificationText_(result) {
    if (!result || !result.ok) {
      if (result && result.error === 'NO_DATA') {
        return 'Nothing new to export.';
      }
      if (result && result.error === 'EXHAUSTED') {
        return 'Everything has already been exported.';
      }
      return '';
    }
    var rowCount = result.rowCount || 0;
    if (result.timedOut) {
      return 'Paused after ' + rowCount + ' rows — click Add more.';
    }
    if (result.exhausted) {
      return rowCount + ' ' + (rowCount === 1 ? 'row' : 'rows') + ' exported.';
    }
    if (result.appended) {
      return '+' + (result.rowsThisBatch || rowCount) + ' rows added.';
    }
    return 'Exported ' + rowCount + ' ' + (rowCount === 1 ? 'row' : 'rows') + '.';
  }

  function sheetResultActionResponse_(result, options) {
    var card = sheetResultCard_(result, options);
    if (typeof CardService.newActionResponseBuilder !== 'function') {
      return card;
    }
    var builder = CardService.newActionResponseBuilder().setNavigation(
      CardService.newNavigation().updateCard(card)
    );
    var note = sheetResultNotificationText_(result);
    if (note) {
      builder.setNotification(CardService.newNotification().setText(note));
    }
    return builder.build();
  }

  function canAddMoreRows_(result) {
    if (!result || !result.ok || result.exhausted) {
      return false;
    }
    if (result.hasMore) {
      return true;
    }
    try {
      var session = HiEnergyMcpExport.readExportSession();
      return !!(session && !session.exhausted);
    } catch (err) {
      return false;
    }
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

    var timedOut = !!(result.timedOut || (result.meta && result.meta.timedOut));
    var rowCount = result.rowCount || 0;
    var sheetCount = result.sheetCount || 1;
    var rowWord = rowCount === 1 ? 'row' : 'rows';

    var title;
    var statusLabel;
    if (timedOut) {
      title = 'Paused at ' + rowCount + ' ' + rowWord;
      statusLabel = 'Paused — more available';
    } else if (result.exhausted) {
      title = rowCount ? rowCount + ' ' + rowWord + ' exported' : 'Nothing new';
      statusLabel = 'Complete';
    } else if (result.appended) {
      var added = result.rowsThisBatch || rowCount;
      title = '+' + added + ' ' + (added === 1 ? 'row' : 'rows') + ' added';
      statusLabel = result.hasMore ? 'More available' : 'Up to date';
    } else if (result.usedActiveSpreadsheet) {
      title = rowCount + ' ' + rowWord + ' exported';
      statusLabel = result.hasMore ? 'More available' : 'Complete';
    } else {
      title = 'Sheet created';
      statusLabel = rowCount + ' ' + rowWord + ' · ' + pluralize_(sheetCount, 'tab');
    }

    var subtitle = result.usedActiveSpreadsheet
      ? 'This spreadsheet · ' + pluralize_(sheetCount, 'tab')
      : HiEnergyConfig.brandName + ' · ' + pluralize_(sheetCount, 'tab');
    var card = CardService.newCardBuilder().setHeader(header_(title, subtitle));

    var bottomLabel = '';
    if (timedOut) {
      bottomLabel = 'Hit the 22-second safety limit. Click Add more to keep going.';
    } else if (result.hasMore) {
      bottomLabel = 'More rows available — click Add more to continue.';
    } else if (result.appended) {
      bottomLabel = 'Latest rows appended to the existing tabs.';
    } else if (result.exhausted || (typeof result.totalAvailable === 'number' && result.totalAvailable > 0)) {
      bottomLabel = 'Nothing left to fetch.';
    }

    var perTypeLine = '';
    if (result.byType) {
      perTypeLine = Object.keys(result.byType)
        .filter(function (type) {
          var info = result.byType[type] || {};
          return (info.rowCount || 0) > 0;
        })
        .map(function (type) {
          var info = result.byType[type] || {};
          var label = type.charAt(0).toUpperCase() + type.slice(1);
          return label + ' ' + info.rowCount;
        })
        .join(' · ');
    }
    var summaryText = perTypeLine ||
      (rowCount + ' ' + rowWord + ' · ' + pluralize_(sheetCount, 'tab'));

    if (!timedOut) {
      var summary = CardService.newDecoratedText()
        .setTopLabel(statusLabel)
        .setText(summaryText)
        .setWrapText(true);
      if (bottomLabel) {
        summary.setBottomLabel(bottomLabel);
      }
      card.addSection(CardService.newCardSection().addWidget(summary));
    }

    var actions = CardService.newCardSection();
    var primaryRow = CardService.newButtonSet();
    var hasPrimaryRow = false;
    if (canAddMoreRows_(result)) {
      primaryRow.addButton(
        filledButton_(
          'Add more',
          cardAction_('handleAddMoreRowsToSheet', options.hostApp ? { hostApp: options.hostApp } : null)
        )
      );
      hasPrimaryRow = true;
    }
    var openBtn = filledOpenUrlButton_(
      result.usedActiveSpreadsheet ? 'Open sheet' : 'Open in Sheets',
      result.url
    );
    if (openBtn) {
      primaryRow.addButton(openBtn);
      hasPrimaryRow = true;
    }
    if (hasPrimaryRow) {
      actions.addWidget(primaryRow);
    }

    var secondaryRow = CardService.newButtonSet();
    var hasSecondaryRow = false;
    if (canAddMoreRows_(result)) {
      secondaryRow.addButton(
        appIconButton_('Fetch all remaining', {
          iconName: 'DESCRIPTION',
          action: cardAction_('handleFetchAllRemainingRows', options.hostApp ? { hostApp: options.hostApp } : null)
        })
      );
      hasSecondaryRow = true;
    }
    secondaryRow.addButton(
      appIconButton_('New search', {
        materialIcon: 'search',
        action: cardAction_('onSearchAction', options.hostApp ? { hostApp: options.hostApp } : null)
      })
    );
    hasSecondaryRow = true;
    if (hasSecondaryRow) {
      actions.addWidget(secondaryRow);
    }
    card.addSection(actions);

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
          appIconButton_('Prepare draft from MCP', {
            iconName: 'EMAIL',
            action: CardService.newAction().setFunctionName('handlePrepareDraftEmail')
          })
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
          appIconButton_('Create Gmail draft', {
            iconName: 'EMAIL',
            action: CardService.newAction().setFunctionName('handleCreateDraftEmail')
          })
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
        appIconButton_('Create Gmail draft', {
          iconName: 'EMAIL',
          action: CardService.newAction()
            .setFunctionName('handleCreateDraftEmail')
            .setParameters({
              replyToMessageId: options.replyToMessageId ? String(options.replyToMessageId) : ''
            })
        })
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
        appIconButton_('Draft another email', {
          iconName: 'EMAIL',
          action: CardService.newAction().setFunctionName('onDraftEmailAction')
        })
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
    reports: reportsCard_,
    createSheet: createSheetCard_,
    sheetResult: sheetResultCard_,
    sheetResultResponse: sheetResultActionResponse_,
    draftEmail: draftEmailPromptCard_,
    draftEmailForm: draftEmailFormCard_,
    draftResult: draftResultCard_,
    apiError: apiErrorCard_,
    error: errorCard_
  };
})();
