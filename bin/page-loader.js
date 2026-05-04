#!/usr/bin/env node

const { parseArgs } = require('node:util');

const pageLoader = require('../src/page-loader');

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    output: {
      type: 'string',
      short: 'o',
    },
  },
  allowPositionals: true,
});

const [url] = positionals;

if (!url) {
  console.error('Usage: page-loader [-o output] <url>');
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
