#!/usr/bin/env node
/**
 * Complete Marketplace submission: OAuth consent, App Configuration, Store Listing.
 * Uses a persistent browser profile (marketplace/.browser-profile) so sign-in is one-time.
 *
 * Usage:
 *   node scripts/submit-marketplace.mjs           # fill + save drafts
 *   node scripts/submit-marketplace.mjs --submit  # fill + submit for review
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketplace/gcp-project.json'), 'utf8'));
const LISTING = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketplace/listing-config.json'), 'utf8'));
const ASSETS = path.join(ROOT, 'marketplace/assets');
const PROFILE = path.join(ROOT, 'marketplace/.browser-profile');
const SUBMIT = process.argv.includes('--submit');
const PROJECT = CONFIG.projectId;
const PROJECT_NUM = CONFIG.projectNumber || '135719878981';
const SCRIPT_ID = CONFIG.appsScriptProjectId;
const DEPLOYMENT_ID = CONFIG.appsScriptDeploymentId;
const ACCOUNT = 'patrick@hienergy.ai';

const DETAILED_DESCRIPTION = `Hi Energy AI brings affiliate marketing intelligence into Google Workspace.

Search without leaving Gmail — universal search across advertisers, deals, transactions, and more via the Hi Energy AI MCP server.

Gmail context on every email — sender domain, Google Contacts match, recent threads, and one-click Hi Energy lookup.

MCP tools — browse and run Hi Energy MCP tools from the sidebar.

Export to Google Sheets — search advertisers, deals, transactions, or contacts and create formatted spreadsheets.

Draft partnership emails — Gmail drafts enriched with advertiser and deal data from MCP.

Secure sign-in with Hi Energy AI (Auth0). Google data stays in Google; Hi Energy data uses your bearer token or API key.

For affiliate managers, partnership teams, and Hi Energy AI customers who work in Gmail.`;

const URLS = {
  oauthConsent: `https://console.cloud.google.com/auth/clients/consent?project=${PROJECT}`,
  appConfig:
    `https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=${PROJECT}`,
  storeListing:
    `https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk_publish?project=${PROJECT}`,
  scriptSettings: `https://script.google.com/home/projects/${SCRIPT_ID}/settings`
};

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

async function waitForAuth(page, targetHost) {
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    const url = page.url();
    if (url.includes(targetHost) && !url.includes('accounts.google.com')) {
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(2000);
      return;
    }
    if (url.includes('accounts.google.com')) {
      const emailField = page.locator('input[type="email"]').first();
      if (await emailField.isVisible({ timeout: 1000 }).catch(() => false)) {
        const val = await emailField.inputValue().catch(() => '');
        if (!val) {
          await emailField.fill(ACCOUNT);
          await page.getByRole('button', { name: /next/i }).click().catch(() => {});
        }
      }
      await page.waitForTimeout(2000);
      continue;
    }
    await page.waitForTimeout(1500);
  }
  throw new Error(`Timed out waiting for ${targetHost}. Sign in as ${ACCOUNT} in the browser window.`);
}

async function clickButton(page, patterns) {
  for (const pattern of patterns) {
    const btn = page.getByRole('button', { name: pattern }).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1500);
      return true;
    }
  }
  return false;
}

async function fillField(page, patterns, value) {
  for (const pattern of patterns) {
    const field = page.getByLabel(pattern, { exact: false }).first();
    if (await field.isVisible({ timeout: 1500 }).catch(() => false)) {
      await field.fill(value);
      return true;
    }
  }
  const input = page.locator(`input[aria-label*="${patterns[0]}" i], textarea[aria-label*="${patterns[0]}" i]`).first();
  if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
    await input.fill(value);
    return true;
  }
  return false;
}

async function selectRadio(page, pattern) {
  const radio = page.getByRole('radio', { name: pattern }).first();
  if (await radio.isVisible({ timeout: 2000 }).catch(() => false)) {
    await radio.check().catch(() => radio.click());
    return true;
  }
  const label = page.getByText(pattern, { exact: false }).first();
  if (await label.isVisible({ timeout: 1500 }).catch(() => false)) {
    await label.click();
    return true;
  }
  return false;
}

async function uploadAssets(page, files) {
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const inputs = page.locator('input[type="file"]');
    const count = await inputs.count();
    let uploaded = false;
    for (let i = 0; i < count; i++) {
      try {
        await inputs.nth(i).setInputFiles(filePath);
        log('upload', path.basename(filePath));
        uploaded = true;
        await page.waitForTimeout(600);
        break;
      } catch {
        // try next input
      }
    }
    if (!uploaded) {
      log('upload', `skipped ${path.basename(filePath)} (no matching input)`);
    }
  }
}

async function configureScriptGcpLink(page) {
  log('phase1', 'Link Apps Script to GCP project');
  await page.goto(URLS.scriptSettings, { waitUntil: 'domcontentloaded' });
  await waitForAuth(page, 'script.google.com');

  const gcpSection = page.getByText(/Google Cloud Platform|GCP Project/i).first();
  if (await gcpSection.isVisible({ timeout: 5000 }).catch(() => false)) {
    await clickButton(page, [/change project|change/i]);
    const projectInput = page.getByLabel(/project number|gcp/i).first();
    const target = (await projectInput.isVisible({ timeout: 2000 }).catch(() => false))
      ? projectInput
      : page.locator('input[type="text"], input[type="number"]').last();
    if (await target.isVisible({ timeout: 2000 }).catch(() => false)) {
      await target.fill(PROJECT_NUM);
      await clickButton(page, [/set project|save|ok/i]);
      log('phase1', `Set GCP project number ${PROJECT_NUM}`);
    }
  }
}

async function configureOAuthConsent(page) {
  log('phase2', 'OAuth consent screen');
  await page.goto(URLS.oauthConsent, { waitUntil: 'domcontentloaded' });
  await waitForAuth(page, 'console.cloud.google.com');

  await selectRadio(page, /internal/i);
  await fillField(page, [/app name/i], LISTING.appName);
  await fillField(page, [/user support email|support email/i], ACCOUNT);
  await fillField(page, [/developer contact|contact information/i], ACCOUNT);
  await fillField(page, [/privacy policy/i], LISTING.privacyPolicyUrl);
  await fillField(page, [/terms of service/i], LISTING.termsOfServiceUrl);

  if (await clickButton(page, [/save and continue|save/i])) {
    log('phase2', 'Saved OAuth app info');
  }

  await clickButton(page, [/data access|scopes|add or remove scopes/i]).catch(() => {});
  await page.waitForTimeout(1500);

  for (const scope of LISTING.oauthScopes) {
    const shortScope = scope.split('/').pop();
    const checkbox = page.getByRole('checkbox', { name: new RegExp(shortScope, 'i') }).first();
    if (await checkbox.isVisible({ timeout: 800 }).catch(() => false)) {
      await checkbox.check().catch(() => checkbox.click());
    }
  }

  await uploadAssets(page, [path.join(ASSETS, 'logo-120.png')]);
  await clickButton(page, [/save and continue|update|save/i]);
  log('phase2', 'OAuth scopes configured');
}

async function configureAppConfig(page) {
  log('phase4', 'App Configuration');
  await page.goto(URLS.appConfig, { waitUntil: 'domcontentloaded' });
  await waitForAuth(page, 'console.cloud.google.com');

  await selectRadio(page, /private|only people in/i);
  await selectRadio(page, /individual/i);
  await selectRadio(page, /admin/i);
  await selectRadio(page, /google workspace add-on|workspace add-on/i);

  await fillField(page, [/deployment id/i], DEPLOYMENT_ID);
  await fillField(page, [/app name|application name/i], LISTING.appName);
  await fillField(page, [/developer name/i], 'Hi Energy AI');
  await fillField(page, [/developer email|email/i], 'support@hienergy.ai');
  await fillField(page, [/developer website|website/i], LISTING.marketingUrl);
  await fillField(page, [/application website/i], LISTING.supportUrl);

  const scopeArea = page.locator('textarea').first();
  if (await scopeArea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await scopeArea.fill(LISTING.oauthScopes.join('\n'));
  }

  if (await clickButton(page, [/save draft|save/i])) {
    log('phase4', 'Saved App Configuration draft');
  }
}

async function configureStoreListing(page) {
  log('phase4', 'Store Listing');
  await page.goto(URLS.storeListing, { waitUntil: 'domcontentloaded' });
  await waitForAuth(page, 'console.cloud.google.com');

  await fillField(page, [/application name|app name/i], LISTING.appName);
  await fillField(page, [/short description/i], LISTING.shortDescription);
  await fillField(page, [/detailed description/i], DETAILED_DESCRIPTION);
  await fillField(page, [/terms of service/i], LISTING.termsOfServiceUrl);
  await fillField(page, [/privacy policy/i], LISTING.privacyPolicyUrl);
  await fillField(page, [/support/i], LISTING.supportUrl);
  await fillField(page, [/documentation|setup/i], LISTING.documentationUrl);

  await uploadAssets(page, [
    path.join(ASSETS, 'logo-128.png'),
    path.join(ASSETS, 'logo-120.png'),
    path.join(ASSETS, 'card-banner-220x140.png'),
    path.join(ASSETS, 'marketplace-screenshot-signin.png'),
    path.join(ASSETS, 'marketplace-screenshot-search.png'),
    path.join(ASSETS, 'marketplace-screenshot-gmail-context.png')
  ]);

  if (await clickButton(page, [/save draft|save/i])) {
    log('phase4', 'Saved Store Listing draft');
  }

  if (SUBMIT) {
    if (await clickButton(page, [/submit for review|submit|publish/i])) {
      log('phase4', 'Submitted listing for review');
    } else {
      log('phase4', 'Submit button not found — click Submit for review manually');
    }
  }
}

async function main() {
  console.log('Hi Energy AI — Marketplace submission');
  console.log('Project:', PROJECT, '| Deployment:', DEPLOYMENT_ID.slice(0, 16) + '…');
  console.log('Profile:', PROFILE);
  console.log('Submit:', SUBMIT ? 'yes' : 'draft only');
  console.log('');

  try {
    execSync('node scripts/marketplace-cli.mjs setup', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    // continue even if CLI setup prints warnings
  }

  fs.mkdirSync(PROFILE, { recursive: true });

  const context = await chromium.launchPersistentContext(PROFILE, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    slowMo: 80,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    await configureScriptGcpLink(page);
    await configureOAuthConsent(page);
    await configureAppConfig(page);
    await configureStoreListing(page);

    const shot = path.join(ROOT, 'marketplace/assets/submit-final.png');
    await page.screenshot({ path: shot, fullPage: true });
    log('done', `Screenshot: marketplace/assets/submit-final.png`);

    console.log('\nSubmission flow complete.');
    if (!SUBMIT) {
      console.log('Re-run with --submit to click Submit for review.');
    }
    await page.waitForTimeout(SUBMIT ? 15000 : 120000);
  } catch (err) {
    const errShot = path.join(ROOT, 'marketplace/assets/submit-error.png');
    await page.screenshot({ path: errShot, fullPage: true }).catch(() => {});
    console.error('\nError:', err.message);
    console.error('Screenshot:', errShot);
    throw err;
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
