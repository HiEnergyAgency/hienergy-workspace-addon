/**
 * Run once from the Apps Script editor to set Auth0 script properties.
 * Replace placeholder values before running.
 */
function configureAuth0ScriptProperties() {
  PropertiesService.getScriptProperties().setProperties({
    AUTH0_DOMAIN: 'YOUR_TENANT.us.auth0.com',
    AUTH0_CLIENT_ID: 'YOUR_AUTH0_CLIENT_ID',
    AUTH0_CLIENT_SECRET: 'YOUR_AUTH0_CLIENT_SECRET',
    AUTH0_AUDIENCE: 'https://api.hienergyrocket.com/mcp'
  });
}
