const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const nock = require('nock');
const cheerio = require('cheerio');

const pageLoader = require('../src/page-loader');

const getFixturePath = (filename) =>
  path.join(__dirname, '..', '__fixtures__', filename);
const readFixture = (filename) =>
  fs.readFile(getFixturePath(filename), 'utf-8');

describe('pageLoader', () => {
  let tmpDir;

  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('Download page with resources', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const html = await readFixture('page-with-local-resources.html');

    const imageBuffer = Buffer.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3,
    ]);
    const cssContent = 'body { color: #222; }';
    const jsContent = 'console.log("runtime");';
    const assetsDirname = 'ru-hexlet-io-courses_files';
    const imageFilename = 'ru-hexlet-io-assets-professions-nodejs.png';
    const cssFilename = 'ru-hexlet-io-assets-application.css';
    const jsFilename = 'ru-hexlet-io-packs-js-runtime.js';
    const canonicalFilename = 'ru-hexlet-io-courses.html';
    const expectedHtmlPath = path.join(tmpDir, 'ru-hexlet-io-courses.html');
    const expectedImagePath = path.join(tmpDir, assetsDirname, imageFilename);
    const expectedCssPath = path.join(tmpDir, assetsDirname, cssFilename);
    const expectedJsPath = path.join(tmpDir, assetsDirname, jsFilename);
    const expectedCanonicalPath = path.join(
      tmpDir,
      assetsDirname,
      canonicalFilename,
    );

    nock('https://ru.hexlet.io').get('/courses').reply(200, html);
    nock('https://ru.hexlet.io')
      .get('/assets/professions/nodejs.png')
      .reply(200, imageBuffer, { 'Content-Type': 'image/png' });
    nock('https://ru.hexlet.io')
      .get('/assets/application.css')
      .reply(200, cssContent, { 'Content-Type': 'text/css' });
    nock('https://ru.hexlet.io')
      .get('/packs/js/runtime.js')
      .reply(200, jsContent, { 'Content-Type': 'application/javascript' });

    const resultPath = await pageLoader(url, tmpDir);
    const savedHtml = await fs.readFile(resultPath, 'utf-8');
    const savedImage = await fs.readFile(expectedImagePath);
    const savedCss = await fs.readFile(expectedCssPath, 'utf-8');
    const savedJs = await fs.readFile(expectedJsPath, 'utf-8');
    const $ = cheerio.load(savedHtml);
    const linkHrefs = $('link')
      .toArray()
      .map((element) => $(element).attr('href'));
    const scriptSources = $('script')
      .toArray()
      .map((element) => $(element).attr('src'));

    expect(resultPath).toBe(expectedHtmlPath);
    expect(path.isAbsolute(resultPath)).toBe(true);
    expect(savedImage.equals(imageBuffer)).toBe(true);
    expect(savedCss).toBe(cssContent);
    expect(savedJs).toBe(jsContent);
    await expect(fs.access(expectedCanonicalPath)).resolves.toBeUndefined();
    expect($('img').attr('src')).toBe(`${assetsDirname}/${imageFilename}`);
    expect(linkHrefs).toEqual([
      'https://cdn2.hexlet.io/assets/menu.css',
      `${assetsDirname}/${cssFilename}`,
      `${assetsDirname}/${canonicalFilename}`,
    ]);
    expect(scriptSources).toEqual([
      'https://js.stripe.com/v3/',
      `${assetsDirname}/${jsFilename}`,
    ]);
    expect($('a').attr('href')).toBe('/professions/nodejs');
  });

  test('Reject when local resource does not exist', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const html = await readFixture('page-with-missing-resource.html');
    const missingResourceUrl = 'https://ru.hexlet.io/assets/missing-application.css';
    const imageBuffer = Buffer.from([137, 80, 78, 71]);

    nock('https://ru.hexlet.io').get('/courses').reply(200, html);
    nock('https://ru.hexlet.io')
      .get('/assets/professions/nodejs.png')
      .reply(200, imageBuffer, { 'Content-Type': 'image/png' });
    nock('https://ru.hexlet.io')
      .get('/assets/missing-application.css')
      .reply(404);

    await expect(pageLoader(url, tmpDir)).rejects.toThrow(
      `failed to load resource: ${missingResourceUrl} (404)`,
    );
  });

  test('Reject when output directory does not exist', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const html = await readFixture('page-with-local-resources.html');
    const notExistingDir = path.join(tmpDir, 'not-exists');

    nock('https://ru.hexlet.io').get('/courses').reply(200, html);

    await expect(pageLoader(url, notExistingDir)).rejects.toThrow(
      `cannot create directory: ${path.join(notExistingDir, 'ru-hexlet-io-courses_files')}`,
    );
  });
});
