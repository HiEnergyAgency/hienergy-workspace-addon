var HiEnergyGmailDrafts = (function () {
  function createDraft_(to, subject, body, options) {
    options = options || {};
    var recipient = String(to || '').trim();
    if (!recipient) {
      return { ok: false, error: 'MISSING_RECIPIENT', message: 'Enter a recipient email address.' };
    }

    var draftSubject = String(subject || '').trim() || '(No subject)';
    var draftBody = String(body || '').trim();
    if (!draftBody) {
      return { ok: false, error: 'MISSING_BODY', message: 'Enter a message body.' };
    }

    try {
      var draftOptions = {};
      if (options.replyToMessageId) {
        draftOptions.replyToMessageId = options.replyToMessageId;
      }

      var draft = GmailApp.createDraft(recipient, draftSubject, draftBody, draftOptions);
      var draftId = draft.getId();
      var messageId = draft.getMessage().getId();

      return {
        ok: true,
        draftId: draftId,
        messageId: messageId,
        to: recipient,
        subject: draftSubject,
        gmailUrl: 'https://mail.google.com/mail/u/0/#drafts/' + encodeURIComponent(draftId)
      };
    } catch (err) {
      console.warn('Gmail draft failed: ' + err);
      return { ok: false, error: 'GMAIL_DRAFT_ERROR', message: String(err) };
    }
  }

  function prepareFromDomain_(domain, context) {
    ensureAuthenticatedForDraft_();

    var advertiserResult = HiEnergyApi.advertiserByDomain(domain);
    var advertiser = null;
    var deals = [];

    if (advertiserResult.ok) {
      var rows = (advertiserResult.body && advertiserResult.body.data) || [];
      if (rows.length === 1) {
        advertiser = HiEnergyApi.advertiser(rows[0].attributes.slug || rows[0].id);
      } else if (rows.length > 1) {
        advertiser = { ok: true, body: { data: rows[0] } };
      }
    }

    if (advertiser && advertiser.ok) {
      var attrs = (advertiser.body.data && advertiser.body.data.attributes) || {};
      var slug = attrs.slug || (advertiser.body.data && advertiser.body.data.id);
      if (slug) {
        var dealsResult = HiEnergyApi.deals(slug);
        if (dealsResult.ok) {
          deals = (dealsResult.body && dealsResult.body.data) || [];
        }
      }
    }

    var draft = HiEnergyMcpExport.buildPartnershipDraft({
      recipientEmail: context && context.senderEmail,
      recipientName: context && context.senderName,
      senderName: context && context.senderName,
      domain: domain,
      originalSubject: context && context.message && context.message.subject,
      advertiser: advertiser && advertiser.ok ? advertiser.body : null,
      deals: deals
    });

    return {
      ok: true,
      draft: draft,
      domain: domain,
      replyToMessageId: context && context.message && context.message.id
    };
  }

  function prepareFromAdvertiser_(idOrSlug, name) {
    ensureAuthenticatedForDraft_();

    var advertiserResult = HiEnergyApi.advertiser(idOrSlug);
    if (!advertiserResult.ok) {
      return advertiserResult;
    }

    var dealsResult = HiEnergyApi.deals(idOrSlug);
    var deals = dealsResult.ok ? (dealsResult.body && dealsResult.body.data) || [] : [];

    var draft = HiEnergyMcpExport.buildPartnershipDraft({
      advertiser: advertiserResult.body,
      deals: deals,
      subject: 'Partnership inquiry — ' + (name || idOrSlug)
    });

    return { ok: true, draft: draft, advertiserId: idOrSlug };
  }

  function ensureAuthenticatedForDraft_() {
    if (!HiEnergyApi.hasAuth()) {
      if (HiEnergyAuth.isConfigured()) {
        HiEnergyAuth.requireAuthorization();
      }
    }
  }

  return {
    createDraft: createDraft_,
    prepareFromDomain: prepareFromDomain_,
    prepareFromAdvertiser: prepareFromAdvertiser_
  };
})();
