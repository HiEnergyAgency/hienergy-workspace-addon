var HiEnergyContacts = (function () {
  function primaryName_(person) {
    var names = person.names || [];
    if (!names.length) {
      return '';
    }
    var name = names[0];
    return name.displayName || [name.givenName, name.familyName].filter(Boolean).join(' ') || '';
  }

  function primaryEmail_(person) {
    var emails = person.emailAddresses || [];
    return emails.length ? emails[0].value || '' : '';
  }

  function primaryPhone_(person) {
    var phones = person.phoneNumbers || [];
    return phones.length ? phones[0].value || '' : '';
  }

  function primaryOrganization_(person) {
    var orgs = person.organizations || [];
    if (!orgs.length) {
      return '';
    }
    var org = orgs[0];
    return org.name || org.title || '';
  }

  function normalizePerson_(person) {
    if (!person) {
      return null;
    }
    return {
      resourceName: person.resourceName || '',
      name: primaryName_(person),
      email: primaryEmail_(person),
      phone: primaryPhone_(person),
      organization: primaryOrganization_(person)
    };
  }

  function lookupByEmail(email) {
    var normalized = String(email || '').trim().toLowerCase();
    if (!normalized) {
      return { ok: false, error: 'MISSING_EMAIL', message: 'No email address provided.' };
    }

    try {
      var response = People.People.searchContacts({
        query: normalized,
        readMask: 'names,emailAddresses,organizations,phoneNumbers',
        pageSize: HiEnergyConfig.contactLimit
      });

      var results = response.results || [];
      for (var i = 0; i < results.length; i++) {
        var person = results[i].person;
        if (!person) {
          continue;
        }
        var emails = person.emailAddresses || [];
        for (var j = 0; j < emails.length; j++) {
          if (String(emails[j].value || '').toLowerCase() === normalized) {
            return { ok: true, contact: normalizePerson_(person) };
          }
        }
      }

      return { ok: true, contact: null };
    } catch (err) {
      console.warn('Contact lookup failed: ' + err);
      return { ok: false, error: 'CONTACTS_ERROR', message: String(err) };
    }
  }

  function search(query) {
    return searchWithLimit_(query, HiEnergyConfig.contactLimit);
  }

  function searchForSheet(query) {
    return searchWithLimit_(query, HiEnergyConfig.sheetContactLimit);
  }

  function searchWithLimit_(query, maxResults) {
    var normalized = String(query || '').trim();
    if (!normalized) {
      return { ok: false, error: 'MISSING_QUERY', message: 'Enter a name, email, or company to search contacts.' };
    }

    var limit = maxResults || HiEnergyConfig.contactLimit;
    var pageSize = Math.min(100, limit);

    try {
      var contacts = [];
      var pageToken = null;

      do {
        var request = {
          query: normalized,
          readMask: 'names,emailAddresses,organizations,phoneNumbers',
          pageSize: Math.min(pageSize, limit - contacts.length)
        };
        if (pageToken) {
          request.pageToken = pageToken;
        }

        var response = People.People.searchContacts(request);
        var batch = (response.results || [])
          .map(function (result) {
            return normalizePerson_(result.person);
          })
          .filter(Boolean);

        contacts = contacts.concat(batch);
        pageToken = response.nextPageToken || null;
      } while (pageToken && contacts.length < limit);

      return { ok: true, contacts: contacts.slice(0, limit) };
    } catch (err) {
      console.warn('Contact search failed: ' + err);
      return { ok: false, error: 'CONTACTS_ERROR', message: String(err) };
    }
  }

  return {
    lookupByEmail: lookupByEmail,
    search: search,
    searchForSheet: searchForSheet
  };
})();
