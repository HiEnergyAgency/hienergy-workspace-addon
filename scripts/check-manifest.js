const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'appsscript.json'), 'utf8'));

const gsFiles = fs.readdirSync(ROOT).filter(function (file) {
  return file.endsWith('.gs');
});

const source = gsFiles
  .map(function (file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
  })
  .join('\n');

function collectFunctions(code) {
  const names = new Set();
  const pattern = /^function\s+([A-Za-z0-9_]+)\s*\(/gm;
  let match = pattern.exec(code);
  while (match) {
    names.add(match[1]);
    match = pattern.exec(code);
  }
  return names;
}

const definedFunctions = collectFunctions(source);
const requiredFunctions = [
  manifest.addOns.common.homepageTrigger.runFunction,
  manifest.addOns.common.universalActions[0].runFunction,
  manifest.addOns.common.universalActions[1].runFunction,
  manifest.addOns.common.universalActions[2].runFunction,
  manifest.addOns.gmail.contextualTriggers[0].onTriggerFunction,
  'authCallback'
];

const missing = requiredFunctions.filter(function (name) {
  return !definedFunctions.has(name);
});

if (missing.length) {
  console.error('Manifest references missing functions:', missing.join(', '));
  process.exit(1);
}

if (manifest.addOns.common.name !== 'Hi Energy AI Workspace Add-on') {
  console.error('Manifest add-on name must be "Hi Energy AI Workspace Add-on".');
  process.exit(1);
}

console.log('Manifest check passed.');
