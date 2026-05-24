const js = require('@eslint/js');
const googleappsscript = require('eslint-plugin-googleappsscript');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.gs'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: Object.assign({}, globals.es2020, googleappsscript.environments.googleappsscript.globals, {
        HiEnergyConfig: 'readonly',
        HiEnergyApi: 'readonly',
        HiEnergyAuth: 'readonly',
        HiEnergyMcp: 'readonly',
        HiEnergyCards: 'readonly',
        HiEnergyGmail: 'readonly',
        HiEnergyContacts: 'readonly',
        OAuth2: 'readonly',
        People: 'readonly'
      })
    },
    rules: {
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'no-console': 'off'
    }
  },
  {
    files: ['test/**/*.js', 'scripts/**/*.js', 'eslint.config.js', 'vitest.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: Object.assign({}, globals.node, globals.vitest)
    },
    rules: {
      'no-console': 'off'
    }
  }
];
