#!/usr/bin/env node
/**
 * Verify the production Apps Script deployment was updated (used by CI after clasp deploy).
 * Exit 0 if APPS_SCRIPT_DEPLOYMENT_ID appears in clasp deployments output.
 */

import { execSync } from 'node:child_process';

const deploymentId = process.env.APPS_SCRIPT_DEPLOYMENT_ID;
const sha = (process.env.GITHUB_SHA || 'local').slice(0, 7);

if (!deploymentId) {
  console.error('APPS_SCRIPT_DEPLOYMENT_ID is not set');
  process.exit(1);
}

let output;
try {
  output = execSync('npx clasp deployments', { encoding: 'utf8' });
} catch (err) {
  console.error('Failed to list deployments:', err.stderr || err.message);
  process.exit(1);
}

const line = output
  .split('\n')
  .map((l) => l.trim())
  .find((l) => l.includes(deploymentId));

if (!line) {
  console.error('Production deployment ID not found in clasp deployments:');
  console.error(output);
  process.exit(1);
}

console.log('Production deployment verified:');
console.log(line);

if (process.env.CI && !line.includes(sha) && !line.includes('main')) {
  console.warn(`Warning: deployment description may not include commit ${sha}`);
}

process.exit(0);
