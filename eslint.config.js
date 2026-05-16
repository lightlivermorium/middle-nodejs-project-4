const js = require('@eslint/js')
const stylistic = require('@stylistic/eslint-plugin')
const globals = require('globals')

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
      'no-console': 'off',
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/brace-style': ['error', 'stroustrup'],
      '@stylistic/operator-linebreak': ['error', 'before'],
    },
  },
]
