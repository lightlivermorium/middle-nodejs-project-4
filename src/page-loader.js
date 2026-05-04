const path = require('node:path');
const fs = require('node:fs/promises');
const axios = require('axios');

const makeFilename = require('./filename');

const pageLoader = (url, outputDir = process.cwd()) => {
  const filename = makeFilename(url);
  const filePath = path.resolve(outputDir, filename);

  return fs
    .mkdir(path.dirname(filePath), { recursive: true })
    .then(() => axios.get(url, { responseType: 'text' }))
    .then((response) =>
      fs.writeFile(filePath, response.data, 'utf-8').then(() => filePath),
    );
};

module.exports = pageLoader;
