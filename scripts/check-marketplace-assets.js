#!/usr/bin/env node
/**
 * Validates marketplace asset dimensions and required files.
 * Run: npm run check:marketplace
 */

const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..', 'marketplace');

const REQUIRED_FILES = [
  'README.md',
  'checklist.md',
  'listing-copy.md',
  'oauth-verification.md',
  'demo-video-script.md',
  'privacy-policy.md',
  'terms-of-service.md',
  'listing-config.json',
  'assets/logo-120.png',
  'assets/logo-128.png',
  'assets/marketplace-screenshot-signin.png',
  'assets/marketplace-screenshot-search.png',
  'assets/marketplace-screenshot-gmail-context.png'
];

const DIMENSIONS = {
  'assets/logo-120.png': { width: 120, height: 120 },
  'assets/logo-128.png': { width: 128, height: 128 },
  'assets/marketplace-screenshot-signin.png': { width: 1280, height: 800 },
  'assets/marketplace-screenshot-search.png': { width: 1280, height: 800 },
  'assets/marketplace-screenshot-gmail-context.png': { width: 1280, height: 800 }
};

const CAN_CHECK_DIMENSIONS = process.platform === 'darwin';

function getDimensions(relPath) {
  const abs = join(ROOT, relPath);
  const out = execSync('sips -g pixelWidth -g pixelHeight "' + abs + '"', { encoding: 'utf8' });
  const width = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1]);
  return { width, height };
}

let failed = false;

REQUIRED_FILES.forEach(function (file) {
  const abs = join(ROOT, file);
  if (!existsSync(abs)) {
    console.error('Missing: marketplace/' + file);
    failed = true;
  }
});

if (CAN_CHECK_DIMENSIONS) {
  Object.entries(DIMENSIONS).forEach(function (entry) {
    const rel = entry[0];
    const expected = entry[1];
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) return;
    const dims = getDimensions(rel);
    if (dims.width !== expected.width || dims.height !== expected.height) {
      console.error(
        'Wrong size marketplace/' + rel + ': ' + dims.width + 'x' + dims.height +
          ', expected ' + expected.width + 'x' + expected.height
      );
      failed = true;
    }
  });
} else {
  console.log('Skipping image dimension checks on', process.platform, '(run locally on macOS for full validation)');
}

if (failed) {
  process.exit(1);
}

console.log(
  'Marketplace assets OK:',
  Object.keys(DIMENSIONS).length,
  'images,',
  REQUIRED_FILES.length,
  'files'
);
