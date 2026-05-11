const path = require('node:path');
const fs = require('node:fs/promises');
const axios = require('axios');

const makeFilename = require('./filename');
const { makeAssetsDirname } = require('./filename');
const { prepareHtml } = require('./resources');

const pageLoader = (url, outputDir = process.cwd()) => {
  const filename = makeFilename(url);
  const assetsDirname = makeAssetsDirname(url);
  const filePath = path.resolve(outputDir, filename);
  const assetsDirPath = path.resolve(outputDir, assetsDirname);

  return fs
    .mkdir(path.dirname(filePath), { recursive: true })
    .then(() => axios.get(url, { responseType: 'text' }))
    .then((response) =>
      prepareHtml(response.data, url, assetsDirPath, assetsDirname),
    )
    .then((html) => fs.writeFile(filePath, html, 'utf-8'))
    .then(() => filePath);
};

module.exports = pageLoader;
