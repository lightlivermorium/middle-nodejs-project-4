#!/usr/bin/env node

const { parseArgs } = require('node:util');

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    debug: {
      type: 'boolean',
      short: 'd',
    },
    output: {
      type: 'string',
      short: 'o',
    },
  },
  allowPositionals: true,
});

if (values.debug) {
  const debugNamespaces = new Set(
    (process.env.DEBUG || '')
      .split(',')
      .map((namespace) => namespace.trim())
      .filter(Boolean),
  );

  debugNamespaces.add('page-loader');
  debugNamespaces.add('axios');
  process.env.DEBUG = [...debugNamespaces].join(',');
}

const pageLoader = require('../src/page-loader');

const [url] = positionals;

if (!url) {
  console.error('Usage: page-loader [-d] [-o output] <url>');
  process.exitCode = 1;
} else {
  pageLoader(url, values.output)
    .then((filePath) => {
      console.log(filePath);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
