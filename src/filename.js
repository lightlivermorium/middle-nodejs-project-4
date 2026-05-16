const path = require('node:path');

const makeFilename = (url) => {
  const { hostname, pathname } = new URL(url);

  const normalizedPath = pathname === '/' ? '' : pathname.replace(/\/+$/, '');
  const rawName = `${hostname}${normalizedPath}`;

  const sanitizedName = rawName
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${sanitizedName}.html`;
};

const makeAssetsDirname = (url) =>
  makeFilename(url).replace(/\.html$/, '_files');

const makeAssetFilename = (url) => {
  const { hostname, pathname } = new URL(url);
  const extension = path.extname(pathname);

  if (!extension) {
    return makeFilename(url);
  }

  const pathnameWithoutExtension = extension ?
    pathname.slice(0, -extension.length) :
    pathname;
  const rawName = `${hostname}${pathnameWithoutExtension}`;

  const sanitizedName = rawName
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${sanitizedName}${extension}`;
};

module.exports = makeFilename;
module.exports.makeAssetsDirname = makeAssetsDirname;
module.exports.makeAssetFilename = makeAssetFilename;
