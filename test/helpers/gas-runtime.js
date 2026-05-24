const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../..');

function createMockProperties(initial) {
  const store = Object.assign({}, initial || {});
  return {
    getProperty(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setProperty(key, value) {
      store[key] = String(value);
    },
    deleteProperty(key) {
      delete store[key];
    },
    getProperties() {
      return Object.assign({}, store);
    }
  };
}

function createGasContext(overrides) {
  overrides = overrides || {};
  const userProps = createMockProperties(overrides.userProperties);
  const scriptProps = createMockProperties(overrides.scriptProperties);
  const cacheStore = {};

  const context = {
    console: console,
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    Boolean: Boolean,
    JSON: JSON,
    Math: Math,
    Date: Date,
    encodeURIComponent: encodeURIComponent,
    Utilities: {
      formatDate: function () {
        return 'Jan 1, 2026';
      },
      sleep: function () {}
    },
    Session: {
      getScriptTimeZone: function () {
        return 'America/Los_Angeles';
      }
    },
    PropertiesService: {
      getUserProperties: function () {
        return userProps;
      },
      getScriptProperties: function () {
        return scriptProps;
      }
    },
    CacheService: {
      getUserCache: function () {
        return {
          get: function (key) {
            return cacheStore[key] || null;
          },
          put: function (key, value) {
            cacheStore[key] = value;
          },
          remove: function (key) {
            delete cacheStore[key];
          }
        };
      }
    },
    UrlFetchApp: {
      fetch: overrides.fetch || function () {
        return {
          getResponseCode: function () {
            return 200;
          },
          getContentText: function () {
            return '{}';
          }
        };
      }
    },
    HiEnergyAuth: overrides.HiEnergyAuth || {
      isConfigured: function () {
        return true;
      },
      hasAccess: function () {
        return true;
      },
      getAccessToken: function () {
        return 'test-token';
      },
      reset: function () {}
    },
    OAuth2: {
      createService: function () {
        return {};
      }
    },
    CardService: {
      newCardBuilder: function () {
        return {};
      },
      newActionResponseBuilder: function () {
        const builder = {
          setNavigation: function () { return builder; },
          setNotification: function () { return builder; },
          build: function () { return {}; }
        };
        return builder;
      },
      newNavigation: function () {
        return { updateCard: function () { return {}; } };
      },
      newNotification: function () {
        return { setText: function () { return this; } };
      },
      newAuthorizationException: function () {
        return {
          setAuthorizationUrl: function () {
            return this;
          },
          setResourceDisplayName: function () {
            return this;
          },
          throwException: function () {}
        };
      }
    },
    GmailApp: overrides.GmailApp || {},
    People: overrides.People || {},
    HtmlService: {
      createHtmlOutput: function (html) {
        return { html: html };
      }
    }
  };

  vm.createContext(context);
  return {
    context: context,
    userProps: userProps,
    scriptProps: scriptProps,
    cacheStore: cacheStore
  };
}

function loadGasFiles(context, files) {
  files.forEach(function (file) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  });
}

function loadCoreProject(overrides) {
  const runtime = createGasContext(overrides);
  loadGasFiles(runtime.context, [
    'Config.gs',
    'McpClient.gs',
    'ApiClient.gs',
    'GmailClient.gs',
    'Main.gs'
  ]);
  return runtime.context;
}

function loadFullProject(overrides) {
  const runtime = createGasContext(overrides);
  loadGasFiles(runtime.context, [
    'Config.gs',
    'McpClient.gs',
    'Auth0.gs',
    'ApiClient.gs',
    'GmailClient.gs',
    'ContactsClient.gs',
    'Cards.gs',
    'Main.gs'
  ]);
  return runtime.context;
}

module.exports = {
  ROOT: ROOT,
  createGasContext: createGasContext,
  loadGasFiles: loadGasFiles,
  loadCoreProject: loadCoreProject,
  loadFullProject: loadFullProject
};
