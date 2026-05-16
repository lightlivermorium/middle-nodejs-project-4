const path = require('node:path');
const fs = require('node:fs/promises');
const axios = require('axios');

const makeFilename = require('./filename');
const { makeAssetsDirname } = require('./filename');
const {
  normalizeRequestError,
  normalizeWriteFileError,
} = require('./errors');
const log = require('./logger');
const { prepareHtml } = require('./resources');

const requestPage = (url) =>
  axios.get(url, { responseType: 'text' }).catch((error) => {
    throw normalizeRequestError('page', url, error);
  });

const writeHtmlFile = (filePath, html) =>
  fs.writeFile(filePath, html, 'utf-8').catch((error) => {
    throw normalizeWriteFileError(filePath, error);
  });

const pageLoader = (url, outputDir = process.cwd(), options = {}) => {
  const filename = makeFilename(url);
  const assetsDirname = makeAssetsDirname(url);
  const filePath = path.resolve(outputDir, filename);
  const assetsDirPath = path.resolve(outputDir, assetsDirname);

  log('start download: url=%s outputDir=%s', url, outputDir);
  log('resolved paths: html=%s assets=%s', filePath, assetsDirPath);

  return requestPage(url)
    .then((response) => {
      log('page html received: status=%d url=%s', response.status, url);
      return prepareHtml(
        response.data,
        url,
        assetsDirPath,
        assetsDirname,
        options,
      );
    })
    .then((html) => {
      log('writing html file: %s', filePath);
      return writeHtmlFile(filePath, html);
    })
    .then(() => {
      log('page saved: %s', filePath);
      return filePath;
    })
    .catch((error) => {
      log(
        'page download failed: url=%s category=%s code=%s error=%s',
        url,
        error.category,
        error.code,
        error.message,
      );
      throw error;
    });
};

module.exports = pageLoader;
