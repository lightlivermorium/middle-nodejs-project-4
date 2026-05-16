const js = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'tmp/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/no-console': 'off',
    },
  },
  eslintConfigPrettier,
];
