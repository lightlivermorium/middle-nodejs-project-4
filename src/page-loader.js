const path = require('node:path');
const fs = require('node:fs/promises');
const axios = require('axios');

const makeFilename = require('./filename');
const { makeAssetsDirname } = require('./filename');
const log = require('./logger');
const { prepareHtml } = require('./resources');

const pageLoader = (url, outputDir = process.cwd()) => {
  const filename = makeFilename(url);
  const assetsDirname = makeAssetsDirname(url);
  const filePath = path.resolve(outputDir, filename);
  const assetsDirPath = path.resolve(outputDir, assetsDirname);

  log('start download: url=%s outputDir=%s', url, outputDir);
  log('resolved paths: html=%s assets=%s', filePath, assetsDirPath);

  return fs
    .mkdir(path.dirname(filePath), { recursive: true })
    .then(() => {
      log('requesting page html: %s', url);
      return axios.get(url, { responseType: 'text' });
    })
    .then((response) => {
      log('page html received: status=%d url=%s', response.status, url);
      return prepareHtml(response.data, url, assetsDirPath, assetsDirname);
    })
    .then((html) => {
      log('writing html file: %s', filePath);
      return fs.writeFile(filePath, html, 'utf-8');
    })
    .then(() => {
      log('page saved: %s', filePath);
      return filePath;
    })
    .catch((error) => {
      log('page download failed: url=%s error=%s', url, error.message);
      throw error;
    });
};

module.exports = pageLoader;
