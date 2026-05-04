const makeFilename = (url) => {
  const { hostname, pathname } = new URL(url);

  const normalizedPath = pathname === '/' ? '' : pathname.replace(/\/+$/, '');
  const rawName = `${hostname}${normalizedPath}`;

  const sanitizedName = rawName
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${sanitizedName}.html`;
};

module.exports = makeFilename;
