const path = require('node:path');
const fs = require('node:fs/promises');
const axios = require('axios');
const cheerio = require('cheerio');

const { makeAssetFilename } = require('./filename');
const {
  normalizeRequestError,
  normalizeCreateDirectoryError,
  normalizeWriteFileError,
} = require('./errors');
const log = require('./logger');

const resourceDefinitions = [
  { selector: 'img[src]', attribute: 'src' },
  { selector: 'script[src]', attribute: 'src' },
  { selector: 'link[href]', attribute: 'href' },
];

const isLocalResourceUrl = (resourceUrl, pageUrl) => {
  const resolvedResourceUrl = new URL(resourceUrl, pageUrl);
  const pageHost = new URL(pageUrl).host;

  return (
    ['http:', 'https:'].includes(resolvedResourceUrl.protocol) &&
    resolvedResourceUrl.host === pageHost
  );
};

const collectLocalResources = ($, pageUrl, assetsDirname) => {
  const resources = new Map();

  resourceDefinitions.forEach(({ selector, attribute }) => {
    $(selector).each((_, element) => {
      const currentValue = $(element).attr(attribute);

      if (!currentValue) {
        return;
      }

      if (!isLocalResourceUrl(currentValue, pageUrl)) {
        log('resources: skip external %s=%s', attribute, currentValue);
        return;
      }

      const resourceUrl = new URL(currentValue, pageUrl);
      const filename = makeAssetFilename(resourceUrl.href);
      const localPath = path.posix.join(assetsDirname, filename);

      $(element).attr(attribute, localPath);
      log(
        'resources: rewrite %s %s -> %s',
        attribute,
        resourceUrl.href,
        localPath,
      );

      resources.set(resourceUrl.href, {
        url: resourceUrl.href,
        filename,
      });
    });
  });

  return [...resources.values()];
};

const notify = (handler, ...args) => {
  if (typeof handler === 'function') {
    handler(...args);
  }
};

const writeResourceFile = (filePath, content) =>
  fs.writeFile(filePath, content).catch((error) => {
    throw normalizeWriteFileError(filePath, error);
  });

const downloadResource = (
  resource,
  assetsDirPath,
  pageUrl,
  pageHtml,
  options = {},
) => {
  notify(options.onResourceStart, resource);

  const contentPromise =
    resource.url === pageUrl
      ? (log('resources: reuse page html for %s', resource.url),
        Promise.resolve(pageHtml))
      : (log('resources: download %s', resource.url),
        axios
          .get(resource.url, { responseType: 'arraybuffer' })
          .then((response) => {
            log(
              'resources: downloaded %s status=%d',
              resource.url,
              response.status,
            );
            return response.data;
          })
          .catch((error) => {
            throw normalizeRequestError('resource', resource.url, error);
          }));

  const targetPath = path.join(assetsDirPath, resource.filename);

  return contentPromise.then((content) =>
    writeResourceFile(targetPath, content).then(() => {
      log('resources: saved %s', targetPath);
      notify(options.onResourceSuccess, resource);
    }),
  ).catch((error) => {
    notify(options.onResourceError, resource, error);
    throw error;
  });
};

const downloadResources = (
  resources,
  assetsDirPath,
  pageUrl,
  pageHtml,
  options = {},
) => {
  if (resources.length === 0) {
    return Promise.resolve();
  }

  return fs
    .mkdir(assetsDirPath)
    .catch((error) => {
      throw normalizeCreateDirectoryError(assetsDirPath, error);
    })
    .then(() =>
      Promise.all(
        resources.map((resource) =>
          downloadResource(resource, assetsDirPath, pageUrl, pageHtml, options),
        ),
      ),
    )
    .then(() => undefined);
};

const prepareHtml = (
  html,
  pageUrl,
  assetsDirPath,
  assetsDirname,
  options = {},
) => {
  const $ = cheerio.load(html);
  const normalizedPageUrl = new URL(pageUrl).href;
  const resources = collectLocalResources($, normalizedPageUrl, assetsDirname);
  const preparedHtml = $.html();
  const resourceUrls = resources.map((resource) => resource.url);

  log('resources: collected %d local resource(s)', resources.length);
  if (resourceUrls.length > 0) {
    log('resources: local resource list %o', resourceUrls);
  }

  notify(options.onResourcesDiscovered, resources);

  if (resources.length === 0) {
    return Promise.resolve(html);
  }

  return downloadResources(
    resources,
    assetsDirPath,
    normalizedPageUrl,
    html,
    options,
  )
    .then(() => preparedHtml)
    .catch((error) => {
      log(
        'resources: failed category=%s code=%s error=%s',
        error.category,
        error.code,
        error.message,
      );
      throw error;
    });
};

module.exports = {
  prepareHtml,
};
