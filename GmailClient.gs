var HiEnergyGmail = (function () {
  function parseSender_(fromHeader) {
    var from = String(fromHeader || '');
    var emailMatch = from.match(/[\w.+-]+@[\w.-]+\.\w+/);
    var nameMatch = from.match(/^([^<]+)</);
    return {
      email: emailMatch ? emailMatch[0].toLowerCase() : '',
      name: nameMatch ? nameMatch[1].trim().replace(/^"|"$/g, '') : (emailMatch ? emailMatch[0] : from)
    };
  }

  function extractDomain_(email) {
    var match = String(email || '').match(/@([\w.-]+\.\w+)/);
    return match && match[1] ? match[1].toLowerCase() : '';
  }

  function normalizeMessage_(message) {
    if (!message) {
      return null;
    }

    var sender = parseSender_(message.getFrom());
    return {
      id: message.getId(),
      threadId: message.getThread().getId(),
      subject: message.getSubject() || '(No subject)',
      from: message.getFrom() || '',
      senderEmail: sender.email,
      senderName: sender.name,
      date: message.getDate(),
      snippet: (message.getPlainBody() || '').replace(/\s+/g, ' ').trim().substring(0, 120)
    };
  }

  function getMessageFromEvent(e) {
    try {
      var gmail = e && e.gmail;
      if (!gmail || !gmail.messageId) {
        return null;
      }
      return GmailApp.getMessageById(gmail.messageId);
    } catch (err) {
      console.warn('Gmail message read failed: ' + err);
      return null;
    }
  }

  function getContextFromEvent(e) {
    var message = getMessageFromEvent(e);
    if (!message) {
      return null;
    }

    var normalized = normalizeMessage_(message);
    var domain = extractDomain_(normalized.senderEmail);

    if (!domain) {
      var body = message.getPlainBody() || '';
      var urlMatch = body.match(/https?:\/\/(?:www\.)?([\w.-]+\.\w+)/i);
      if (urlMatch && urlMatch[1]) {
        domain = urlMatch[1].toLowerCase();
      }
    }

    return {
      message: normalized,
      domain: domain,
      senderEmail: normalized.senderEmail,
      senderName: normalized.senderName
    };
  }

  function getThreadMessages(messageId, maxResults) {
    var limit = maxResults || HiEnergyConfig.messageLimit;
    try {
      var message = GmailApp.getMessageById(messageId);
      if (!message) {
        return { ok: false, error: 'MESSAGE_NOT_FOUND', message: 'Could not read the open message.' };
      }

      var messages = message.getThread().getMessages();
      return {
        ok: true,
        messages: messages.slice(-limit).reverse().map(normalizeMessage_).filter(Boolean)
      };
    } catch (err) {
      console.warn('Thread read failed: ' + err);
      return { ok: false, error: 'GMAIL_ERROR', message: String(err) };
    }
  }

  function searchByDomain(domain, maxResults) {
    var normalized = String(domain || '').trim().toLowerCase();
    if (!normalized) {
      return { ok: false, error: 'MISSING_DOMAIN', message: 'No domain provided.' };
    }

    var limit = maxResults || HiEnergyConfig.messageLimit;
    try {
      var query = 'from:@' + normalized + ' OR to:@' + normalized;
      var threads = GmailApp.search(query, 0, limit);
      var messages = [];

      threads.forEach(function (thread) {
        var threadMessages = thread.getMessages();
        if (!threadMessages.length) {
          return;
        }
        messages.push(normalizeMessage_(threadMessages[threadMessages.length - 1]));
      });

      return { ok: true, messages: messages.filter(Boolean), domain: normalized };
    } catch (err) {
      console.warn('Gmail domain search failed: ' + err);
      return { ok: false, error: 'GMAIL_ERROR', message: String(err) };
    }
  }

  function searchMessages(query, maxResults) {
    var normalized = String(query || '').trim();
    if (!normalized) {
      return { ok: false, error: 'MISSING_QUERY', message: 'Enter a Gmail search query.' };
    }

    var limit = maxResults || HiEnergyConfig.messageLimit;
    try {
      var threads = GmailApp.search(normalized, 0, limit);
      var messages = [];

      threads.forEach(function (thread) {
        var threadMessages = thread.getMessages();
        if (!threadMessages.length) {
          return;
        }
        messages.push(normalizeMessage_(threadMessages[threadMessages.length - 1]));
      });

      return { ok: true, messages: messages.filter(Boolean), query: normalized };
    } catch (err) {
      console.warn('Gmail search failed: ' + err);
      return { ok: false, error: 'GMAIL_ERROR', message: String(err) };
    }
  }

  return {
    getContextFromEvent: getContextFromEvent,
    getThreadMessages: getThreadMessages,
    searchByDomain: searchByDomain,
    searchMessages: searchMessages
  };
})();
