#!/usr/bin/env node
/**
 * Marketplace Phases 1–4 helper via CLI (no Playwright).
 * Uses clasp OAuth token + Google REST APIs; prints console paste values for
 * steps that have no public API (App Configuration + Store Listing UI).
 *
 * Usage:
 *   node scripts/marketplace-cli.mjs              # status report
 *   node scripts/marketplace-cli.mjs setup        # enable APIs + validate + paste values
 *   node scripts/marketplace-cli.mjs setup --open # also open GCP console tabs (macOS)
 *   node scripts/marketplace-cli.mjs setup --deploy
 */

import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketplace/gcp-project.json'), 'utf8'));
const LISTING = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketplace/listing-config.json'), 'utf8'));

const PROJECT = CONFIG.projectId;
const SCRIPT_ID = CONFIG.appsScriptProjectId;
const DEPLOYMENT_ID = CONFIG.appsScriptDeploymentId;
const USER_EMAIL = 'patrick@hienergy.ai';
const MARKETPLACE_IAM_ROLE = 'roles/appmetadata.workspaceMarketplaceAppConfigurationAdmin';

const REQUIRED_APIS = [
  'appsmarket-component.googleapis.com',
  'gmail.googleapis.com',
  'people.googleapis.com',
  'script.googleapis.com',
  'iap.googleapis.com',
  'cloudresourcemanager.googleapis.com'
];

const URLS = {
  dashboard: `https://console.cloud.google.com/home/dashboard?project=${PROJECT}`,
  appConfig:
    `https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=${PROJECT}`,
  storeListing:
    `https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk_publish?project=${PROJECT}`,
  oauthConsent: `https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT}`,
  scriptSettings: `https://script.google.com/home/projects/${SCRIPT_ID}/settings`,
  scriptDeployments: `https://script.google.com/home/projects/${SCRIPT_ID}/deployments`,
  assets: path.join(ROOT, 'marketplace/assets')
};

const argv = process.argv.slice(2);
const COMMAND = argv.find((a) => !a.startsWith('-')) || 'status';
const OPEN_TABS = argv.includes('--open');
const DO_DEPLOY = argv.includes('--deploy');
const GRANT_IAM = argv.includes('--grant-iam');

function readClaspToken() {
  const claspRc = path.join(os.homedir(), '.clasprc.json');
  if (!fs.existsSync(claspRc)) {
    return null;
  }
  const rc = JSON.parse(fs.readFileSync(claspRc, 'utf8'));
  const t = rc.token || rc.tokens?.default || rc;
  return t.access_token || t.token?.access_token || null;
}

function readGcloudToken() {
  try {
    return execSync('gcloud auth print-access-token 2>/dev/null', { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

function getAccessToken() {
  const gcloud = readGcloudToken();
  if (gcloud) return { token: gcloud, source: 'gcloud' };
  const clasp = readClaspToken();
  if (clasp) return { token: clasp, source: 'clasp' };
  console.error('No credentials found. Run: clasp login   (or: gcloud auth login)');
  process.exit(1);
}

async function gcpFetch(url, { method = 'GET', body, token, userProject = PROJECT } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`
  };
  if (userProject) {
    headers['x-goog-user-project'] = userProject;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  if (!res.ok && !data.error) {
    data = { error: { code: res.status, message: text.slice(0, 300) } };
  }
  return data;
}

async function getProjectNumber(token) {
  const data = await gcpFetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}`, { token });
  return data.projectNumber ? String(data.projectNumber) : null;
}

async function getServiceState(token, apiName) {
  const data = await gcpFetch(
    `https://serviceusage.googleapis.com/v1/projects/${PROJECT}/services/${apiName}`,
    { token }
  );
  return data.state || (data.error ? 'ERROR' : 'UNKNOWN');
}

async function enableService(token, apiName) {
  const data = await gcpFetch(
    `https://serviceusage.googleapis.com/v1/projects/${PROJECT}/services/${apiName}:enable`,
    { method: 'POST', token }
  );
  if (data.error) {
    return { ok: false, message: data.error.message };
  }
  return { ok: true, name: data.name || apiName };
}

async function getOAuthBrand(token, projectNumber) {
  const data = await gcpFetch(`https://iap.googleapis.com/v1/projects/${projectNumber}/brands`, { token });
  if (data.error) return { ok: false, message: data.error.message };
  const brand = (data.brands || [])[0];
  return brand
    ? { ok: true, title: brand.applicationTitle, supportEmail: brand.supportEmail }
    : { ok: false, message: 'No OAuth brand configured (Phase 2 not started)' };
}

async function getScriptProject(token) {
  return gcpFetch(`https://script.googleapis.com/v1/projects/${SCRIPT_ID}`, {
    token,
    userProject: null
  });
}

function getClaspDeployments() {
  try {
    const out = execSync('clasp deployments', { cwd: ROOT, encoding: 'utf8' });
    const production = out
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.includes(DEPLOYMENT_ID));
    return { ok: true, output: out.trim(), productionLine: production || null };
  } catch (err) {
    return { ok: false, message: String(err.stderr || err.message || err) };
  }
}

function runAssetCheck() {
  try {
    execSync('npm run check:marketplace', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: String(err.stdout || err.stderr || err.message) };
  }
}

function runDeploy() {
  console.log('\n→ Deploying via clasp push + clasp deploy…');
  execSync('clasp push --force', { cwd: ROOT, stdio: 'inherit' });
  execSync(
    `clasp deploy -i "${DEPLOYMENT_ID}" -d "marketplace-cli ${new Date().toISOString().slice(0, 10)}"`,
    { cwd: ROOT, stdio: 'inherit' }
  );
}

async function grantMarketplaceIam(token, memberEmail) {
  const policyData = await gcpFetch(
    `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}:getIamPolicy`,
    { method: 'POST', token, body: {} }
  );
  if (policyData.error) {
    return { ok: false, message: policyData.error.message };
  }

  const member = `user:${memberEmail}`;
  const bindings = policyData.bindings || [];
  const existing = bindings.find((b) => b.role === MARKETPLACE_IAM_ROLE);
  if (existing?.members?.includes(member)) {
    return { ok: true, message: 'IAM role already assigned' };
  }

  if (existing) {
    existing.members.push(member);
  } else {
    bindings.push({ role: MARKETPLACE_IAM_ROLE, members: [member] });
  }

  const setData = await gcpFetch(
    `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}:setIamPolicy`,
    { method: 'POST', token, body: { policy: { ...policyData, bindings, etag: policyData.etag } } }
  );
  if (setData.error) {
    return { ok: false, message: setData.error.message };
  }
  return { ok: true, message: `Granted ${MARKETPLACE_IAM_ROLE} to ${memberEmail}` };
}

function statusIcon(ok) {
  return ok ? '✅' : '❌';
}

function printHeader(title) {
  console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`);
}

function printPasteValues(projectNumber) {
  printHeader('App Configuration — paste into GCP Console');
  console.log(`
App visibility:        Private (Hi Energy org) or Public
Installation:          Individual + Admin Install
Integrations:          Google Workspace add-on
Deployment ID:         ${DEPLOYMENT_ID}
Apps Script project:   ${SCRIPT_ID}
GCP project number:    ${projectNumber || '(link in Apps Script → Project Settings)'}

App name:              ${LISTING.appName}
Developer name:        Hi Energy AI
Developer email:       support@hienergy.ai
Developer website:     ${LISTING.marketingUrl}
Application website:   ${LISTING.supportUrl}

OAuth scopes (paste all):
${LISTING.oauthScopes.map((s) => `  ${s}`).join('\n')}
`);

  printHeader('Store Listing — paste from marketplace/listing-copy.md');
  console.log(`
Tagline:               ${LISTING.tagline}
Short description:     ${LISTING.shortDescription}
Category:              ${LISTING.category}
Pricing:               ${LISTING.pricingModel}
Support URL:           ${LISTING.supportUrl}
Documentation URL:     ${LISTING.documentationUrl}
Privacy policy:        ${LISTING.privacyPolicyUrl}
Terms of service:      ${LISTING.termsOfServiceUrl}

Upload assets from:    marketplace/assets/
  logo-120.png, logo-128.png
  marketplace-screenshot-signin.png
  marketplace-screenshot-search.png
  marketplace-screenshot-gmail-context.png
`);

  printHeader('Console URLs');
  Object.entries(URLS).forEach(([key, url]) => {
    if (key === 'assets') {
      console.log(`  ${key.padEnd(18)} file://${url}`);
    } else {
      console.log(`  ${key.padEnd(18)} ${url}`);
    }
  });

  console.log(`
Phase 4 has no publish REST API — complete App Configuration + Store Listing in the
console URLs above, then click Save Draft → Submit for review.
`);
}

function openConsoleTabs() {
  if (process.platform !== 'darwin') {
    console.log('\n--open is supported on macOS only; URLs printed above.');
    return;
  }
  const tabs = [
    URLS.appConfig,
    URLS.storeListing,
    URLS.oauthConsent,
    URLS.scriptSettings,
    `file://${URLS.assets}`
  ];
  tabs.forEach((url) => spawnSync('open', [url], { stdio: 'ignore' }));
  console.log('\n→ Opened App Configuration, Store Listing, OAuth consent, Script settings, assets folder.');
}

async function runStatus({ token, authSource }) {
  printHeader(`Hi Energy AI Marketplace CLI — ${PROJECT}`);
  console.log(`Auth: ${authSource}`);

  const projectNumber = await getProjectNumber(token);
  console.log(`Project number: ${projectNumber || 'unknown'}`);

  printHeader('Phase 1 — GCP + Apps Script');
  const apiStates = {};
  for (const api of REQUIRED_APIS) {
    apiStates[api] = await getServiceState(token, api);
    const enabled = apiStates[api] === 'ENABLED';
    console.log(`  ${statusIcon(enabled)} ${api} — ${apiStates[api]}`);
  }

  const script = await getScriptProject(token);
  const scriptOk = !script.error;
  const scopeIssue =
    !!script.error &&
    (script.error.status === 'PERMISSION_DENIED' ||
      script.error.code === 401 ||
      script.error.code === 403);
  if (scriptOk) {
    console.log(`  ✅ Apps Script project "${script.title || SCRIPT_ID}" reachable`);
  } else if (scopeIssue) {
    console.log(
      `  ⚠️  Apps Script project "${SCRIPT_ID}" — cannot verify with current auth ` +
        `(${authSource} token lacks script.projects scope). Confirm GCP link in: ` +
        `Apps Script → Project Settings → Google Cloud Platform (GCP) Project = ${PROJECT}`
    );
  } else {
    console.log(`  ❌ Apps Script project "${SCRIPT_ID}" reachable`);
  }

  const deployments = getClaspDeployments();
  const deployOk = deployments.ok && deployments.productionLine;
  console.log(
    `  ${statusIcon(deployOk)} Production deployment ${DEPLOYMENT_ID.slice(0, 12)}…` +
      (deployments.productionLine ? ` — ${deployments.productionLine.split('@').pop()}` : '')
  );

  printHeader('Phase 2 — OAuth consent');
  const brand = projectNumber ? await getOAuthBrand(token, projectNumber) : { ok: false };
  if (brand.ok) {
    console.log(`  ${statusIcon(true)} OAuth brand: "${brand.title}" (${brand.supportEmail})`);
    console.log('  ⚠️  Confirm all 8 scopes + privacy/terms URLs in the OAuth consent console.');
  } else {
    console.log(`  ${statusIcon(false)} ${brand.message}`);
  }

  printHeader('Phase 4 — Marketplace SDK');
  const marketplaceEnabled = apiStates['appsmarket-component.googleapis.com'] === 'ENABLED';
  console.log(`  ${statusIcon(marketplaceEnabled)} Marketplace SDK enabled`);
  console.log('  ⚠️  App Configuration + Store Listing — console only (no REST API)');

  const assets = runAssetCheck();
  console.log(`  ${statusIcon(assets.ok)} Marketplace assets ${assets.ok ? 'validated' : 'check failed'}`);
  if (!assets.ok && assets.message) {
    console.log(assets.message);
  }

  return { projectNumber, apiStates, brand, deployments, assets };
}

async function runSetup() {
  const { token, source } = getAccessToken();

  if (DO_DEPLOY) {
    runDeploy();
  }

  printHeader('Enabling required APIs');
  for (const api of REQUIRED_APIS) {
    const state = await getServiceState(token, api);
    if (state === 'ENABLED') {
      console.log(`  skip ${api} (already enabled)`);
      continue;
    }
    const result = await enableService(token, api);
    console.log(result.ok ? `  enabled ${api}` : `  failed ${api}: ${result.message}`);
  }

  if (GRANT_IAM) {
    printHeader('IAM — Marketplace configuration admin');
    const iam = await grantMarketplaceIam(token, USER_EMAIL);
    console.log(iam.ok ? `  ${iam.message}` : `  failed: ${iam.message}`);
  }

  const status = await runStatus({ token, authSource: source });
  printPasteValues(status.projectNumber);

  if (OPEN_TABS) {
    openConsoleTabs();
  }
}

async function main() {
  const { token, source } = getAccessToken();

  if (COMMAND === 'setup') {
    await runSetup();
    return;
  }

  if (COMMAND === 'open') {
    openConsoleTabs();
    return;
  }

  await runStatus({ token, authSource: source });

  if (COMMAND === 'status' && (OPEN_TABS || process.argv.includes('--paste'))) {
    const projectNumber = await getProjectNumber(token);
    printPasteValues(projectNumber);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
