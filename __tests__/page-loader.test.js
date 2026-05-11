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

  test('Download page with image', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const html = await readFixture('page-with-local-image.html');

    const imageBuffer = Buffer.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3,
    ]);
    const assetsDirname = 'ru-hexlet-io-courses_files';
    const assetFilename = 'ru-hexlet-io-assets-professions-nodejs.png';
    const expectedHtmlPath = path.join(tmpDir, 'ru-hexlet-io-courses.html');
    const expectedImagePath = path.join(tmpDir, assetsDirname, assetFilename);

    nock('https://ru.hexlet.io').get('/courses').reply(200, html);
    nock('https://ru.hexlet.io')
      .get('/assets/professions/nodejs.png')
      .reply(200, imageBuffer, { 'Content-Type': 'image/png' });

    const resultPath = await pageLoader(url, tmpDir);
    const savedHtml = await fs.readFile(resultPath, 'utf-8');
    const savedImage = await fs.readFile(expectedImagePath);
    const $ = cheerio.load(savedHtml);

    expect(resultPath).toBe(expectedHtmlPath);
    expect(path.isAbsolute(resultPath)).toBe(true);
    expect(savedImage.equals(imageBuffer)).toBe(true);
    expect($('img').attr('src')).toBe(`${assetsDirname}/${assetFilename}`);
    expect($('a').attr('href')).toBe('/professions/nodejs');
  });

  test('Reject when image does not exist', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const html = await readFixture('page-with-failing-local-image.html');

    nock('https://ru.hexlet.io').get('/courses').reply(200, html);
    nock('https://ru.hexlet.io').get('/assets/missing-nodejs.png').reply(404);

    await expect(pageLoader(url, tmpDir)).rejects.toThrow();
  });
});
