const path = require('node:path');
const fs = require('node:fs/promises');
const axios = require('axios');
const cheerio = require('cheerio');

const { makeAssetFilename } = require('./filename');

const isLocalImageUrl = (resourceUrl, pageUrl) => {
  const resolvedResourceUrl = new URL(resourceUrl, pageUrl);
  const pageOrigin = new URL(pageUrl).origin;

  return (
    ['http:', 'https:'].includes(resolvedResourceUrl.protocol)
    && resolvedResourceUrl.origin === pageOrigin
  );
};

const collectLocalImages = ($, pageUrl, assetsDirname) => {
  const resources = new Map();

  $('img[src]').each((_, element) => {
    const currentSrc = $(element).attr('src');

    if (!currentSrc || !isLocalImageUrl(currentSrc, pageUrl)) {
      return;
    }

    const resourceUrl = new URL(currentSrc, pageUrl);
    const filename = makeAssetFilename(resourceUrl.href);
    const localPath = path.posix.join(assetsDirname, filename);

    $(element).attr('src', localPath);

    resources.set(resourceUrl.href, {
      url: resourceUrl.href,
      filename,
    });
  });

  return [...resources.values()];
};

const downloadResource = (resource, assetsDirPath) =>
  axios
    .get(resource.url, { responseType: 'arraybuffer' })
    .then((response) =>
      fs.writeFile(path.join(assetsDirPath, resource.filename), response.data),
    );

const downloadResources = (resources, assetsDirPath) => {
  if (resources.length === 0) {
    return Promise.resolve();
  }

  return fs
    .mkdir(assetsDirPath, { recursive: true })
    .then(() =>
      Promise.all(resources.map((resource) => downloadResource(resource, assetsDirPath))),
    )
    .then(() => undefined);
};

const prepareHtml = (html, pageUrl, assetsDirPath, assetsDirname) => {
  const $ = cheerio.load(html);
  const resources = collectLocalImages($, pageUrl, assetsDirname);

  if (resources.length === 0) {
    return Promise.resolve(html);
  }

  return downloadResources(resources, assetsDirPath).then(() => $.html());
};

module.exports = {
  prepareHtml,
};
