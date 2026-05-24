#!/usr/bin/env node
/**
 * Phase 4: Configure Marketplace App + Store Listing in GCP Console.
 * Opens a headed browser, waits for Google sign-in, then fills forms and uploads assets.
 *
 * Usage: node scripts/fill-marketplace-phase4.mjs
 *        node scripts/fill-marketplace-phase4.mjs --submit
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketplace/gcp-project.json'), 'utf8'));
const LISTING = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketplace/listing-config.json'), 'utf8'));
const ASSETS = path.join(ROOT, 'marketplace/assets');
const SUBMIT = process.argv.includes('--submit');
const PROJECT = CONFIG.projectId;

const DETAILED_DESCRIPTION = `Hi Energy AI brings affiliate marketing intelligence into Google Workspace.

Search without leaving Gmail — universal search across advertisers, deals, transactions, and more via the Hi Energy AI MCP server.

Gmail context on every email — sender domain, Google Contacts match, recent threads, and one-click Hi Energy lookup.

MCP tools — browse and run Hi Energy MCP tools from the sidebar.

Export to Google Sheets — search advertisers, deals, transactions, or contacts and create formatted spreadsheets.

Draft partnership emails — Gmail drafts enriched with advertiser and deal data from MCP.

Secure sign-in with Hi Energy AI (Auth0). Google data stays in Google; Hi Energy data uses your bearer token or API key.

For affiliate managers, partnership teams, and Hi Energy AI customers who work in Gmail.`;

const SCOPES_TEXT = LISTING.oauthScopes.join('\n');

const URLS = {
  appConfig:
    'https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=' +
    PROJECT,
  storeListing:
    'https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk_publish?project=' +
    PROJECT
};

async function waitForConsole(page) {
  console.log('\n→ Sign in to Google Cloud as patrick@hienergy.ai if prompted (5 min max)...\n');
  await page.waitForURL(/console\.cloud\.google\.com/, { timeout: 300000 });
  await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function clickIfVisible(page, labels) {
  for (const label of labels) {
    const btn = page.getByRole('button', { name: label, exact: false }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      return true;
    }
  }
  return false;
}

async function fillByLabel(page, labelPattern, value) {
  const field = page.getByLabel(labelPattern, { exact: false }).first();
  if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
    await field.fill(value);
    return true;
  }
  return false;
}

async function uploadFiles(page, filePaths) {
  const inputs = page.locator('input[type="file"]');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    if (!(await input.isVisible().catch(() => false))) {
      continue;
    }
    for (const filePath of filePaths) {
      try {
        await input.setInputFiles(filePath);
        console.log('  uploaded', path.basename(filePath));
        await page.waitForTimeout(800);
        break;
      } catch {
        // try next input
      }
    }
  }
}

async function configureApp(page) {
  console.log('\n=== App Configuration ===');
  await page.goto(URLS.appConfig, { waitUntil: 'domcontentloaded' });
  await waitForConsole(page);

  await fillByLabel(page, /deployment/i, CONFIG.appsScriptDeploymentId);
  await fillByLabel(page, /app name|application name/i, LISTING.appName);
  await fillByLabel(page, /developer name/i, 'Hi Energy AI');
  await fillByLabel(page, /developer email|email/i, 'support@hienergy.ai');
  await fillByLabel(page, /developer website|website/i, LISTING.marketingUrl);
  await fillByLabel(page, /application website/i, 'https://app.hienergy.ai');

  const scopeArea = page.locator('textarea').first();
  if (await scopeArea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await scopeArea.fill(SCOPES_TEXT);
    console.log('  filled OAuth scopes');
  }

  if (await clickIfVisible(page, ['Save', 'Save draft', 'Save Draft'])) {
    console.log('  saved App Configuration draft');
  }
}

async function configureStoreListing(page) {
  console.log('\n=== Store Listing ===');
  await page.goto(URLS.storeListing, { waitUntil: 'domcontentloaded' });
  await waitForConsole(page);

  await fillByLabel(page, /application name|app name/i, LISTING.appName);
  await fillByLabel(page, /short description/i, LISTING.shortDescription);
  await fillByLabel(page, /detailed description/i, DETAILED_DESCRIPTION);
  await fillByLabel(page, /terms of service/i, LISTING.termsOfServiceUrl);
  await fillByLabel(page, /privacy policy/i, LISTING.privacyPolicyUrl);
  await fillByLabel(page, /support/i, LISTING.supportUrl);
  await fillByLabel(page, /documentation|setup/i, LISTING.documentationUrl);

  console.log('  uploading graphic assets...');
  await uploadFiles(page, [
    path.join(ASSETS, 'logo-128.png'),
    path.join(ASSETS, 'logo-32.png'),
    path.join(ASSETS, 'card-banner-220x140.png'),
    path.join(ASSETS, 'marketplace-screenshot-signin.png'),
    path.join(ASSETS, 'marketplace-screenshot-search.png'),
    path.join(ASSETS, 'marketplace-screenshot-gmail-context.png')
  ]);

  if (await clickIfVisible(page, ['Save', 'Save draft', 'Save Draft'])) {
    console.log('  saved Store Listing draft');
  }

  if (SUBMIT) {
    if (await clickIfVisible(page, ['Submit for review', 'Submit For Review', 'Publish'])) {
      console.log('  submitted listing for review');
    } else {
      console.log('  Submit button not found — click Submit for review manually');
    }
  } else {
    console.log('\n  Draft saved. Re-run with --submit to click Submit for review.');
  }
}

async function main() {
  console.log('Hi Energy AI — Marketplace Phase 4');
  console.log('GCP project:', PROJECT);
  console.log('Deployment ID:', CONFIG.appsScriptDeploymentId);

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await configureApp(page);
    await configureStoreListing(page);
    console.log('\nDone. Review the browser, fix any empty fields, then Submit for review.');
    console.log('Store listing:', URLS.storeListing);
    await page.waitForTimeout(600000);
  } finally {
    await browser.close();
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
