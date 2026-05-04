const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const nock = require('nock');

const pageLoader = require('../src/page-loader');

describe('pageLoader', () => {
  let tmpDir;
  let initialCwd;

  beforeAll(() => {
    nock.disableNetConnect();
    initialCwd = process.cwd();
  });

  afterAll(() => {
    nock.enableNetConnect();
    process.chdir(initialCwd);
  });

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  afterEach(() => {
    nock.cleanAll();
    process.chdir(initialCwd);
  });

  test('downloads page and saves html to the specified directory', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const html = '<html><body>Hexlet courses</body></html>';

    nock('https://ru.hexlet.io').get('/courses').reply(200, html);

    const resultPath = await pageLoader(url, tmpDir);
    const expectedPath = path.join(tmpDir, 'ru-hexlet-io-courses.html');
    const savedContent = await fs.readFile(resultPath, 'utf-8');

    expect(resultPath).toBe(expectedPath);
    expect(path.isAbsolute(resultPath)).toBe(true);
    expect(savedContent).toBe(html);
  });

  test('uses current working directory by default', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const html = '<html><body>Default output dir</body></html>';

    nock('https://ru.hexlet.io').get('/courses').reply(200, html);
    process.chdir(tmpDir);

    const resultPath = await pageLoader(url);
    const expectedPath = path.join(tmpDir, 'ru-hexlet-io-courses.html');
    const savedContent = await fs.readFile(resultPath, 'utf-8');
    const realResultPath = await fs.realpath(resultPath);
    const realExpectedPath = await fs.realpath(expectedPath);

    expect(realResultPath).toBe(realExpectedPath);
    expect(savedContent).toBe(html);
  });

  test('creates output directory if it does not exist', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const html = '<html><body>Nested dir</body></html>';
    const nestedDir = path.join(tmpDir, 'pages', 'html');

    nock('https://ru.hexlet.io').get('/courses').reply(200, html);

    const resultPath = await pageLoader(url, nestedDir);
    const expectedPath = path.join(nestedDir, 'ru-hexlet-io-courses.html');
    const savedContent = await fs.readFile(resultPath, 'utf-8');

    expect(resultPath).toBe(expectedPath);
    expect(savedContent).toBe(html);
  });

  test('rejects on network error', async () => {
    const url = 'https://ru.hexlet.io/courses';

    nock('https://ru.hexlet.io')
      .get('/courses')
      .replyWithError('Network Error');

    await expect(pageLoader(url, tmpDir)).rejects.toThrow();
  });

  test('rejects on http error status', async () => {
    const url = 'https://ru.hexlet.io/courses';

    nock('https://ru.hexlet.io').get('/courses').reply(500);

    await expect(pageLoader(url, tmpDir)).rejects.toThrow();
  });
});
