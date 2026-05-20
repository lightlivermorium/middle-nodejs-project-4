const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs/promises')
const nock = require('nock')
const cheerio = require('cheerio')

const pageLoader = require('../src/page-loader')

const getFixturePath = filename =>
  path.join(__dirname, '..', '__fixtures__', filename)
const readFixture = filename =>
  fs.readFile(getFixturePath(filename), 'utf-8')

describe('pageLoader', () => {
  let tmpDir

  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
  })

  afterEach(() => {
    nock.cleanAll()
  })

  test('Download page with resources', async () => {
    const url = 'https://ru.hexlet.io/courses'
    const html = await readFixture('page-with-local-resources.html')

    const assetsDirname = 'ru-hexlet-io-courses_files'
    const imageFilename = 'ru-hexlet-io-assets-professions-nodejs.png'
    const cssFilename = 'ru-hexlet-io-assets-application.css'
    const jsFilename = 'ru-hexlet-io-packs-js-runtime.js'
    const expectedHtmlPath = path.join(tmpDir, 'ru-hexlet-io-courses.html')
    const expectedImagePath = path.join(tmpDir, assetsDirname, imageFilename)
    const expectedCssPath = path.join(tmpDir, assetsDirname, cssFilename)
    const expectedJsPath = path.join(tmpDir, assetsDirname, jsFilename)

    nock('https://ru.hexlet.io').get('/courses').reply(200, html)
    nock('https://ru.hexlet.io')
      .get('/assets/professions/nodejs.png')
      .reply(200, 'image')
    nock('https://ru.hexlet.io')
      .get('/assets/application.css')
      .reply(200, 'css')
    nock('https://ru.hexlet.io')
      .get('/packs/js/runtime.js')
      .reply(200, 'js')

    const resultPath = await pageLoader(url, tmpDir)
    const savedHtml = await fs.readFile(resultPath, 'utf-8')
    const $ = cheerio.load(savedHtml)
    const linkHrefs = $('link')
      .toArray()
      .map(element => $(element).attr('href'))
    const scriptSources = $('script')
      .toArray()
      .map(element => $(element).attr('src'))

    expect(resultPath).toBe(expectedHtmlPath)
    expect(path.isAbsolute(resultPath)).toBe(true)
    await expect(fs.access(expectedImagePath)).resolves.toBeUndefined()
    await expect(fs.access(expectedCssPath)).resolves.toBeUndefined()
    await expect(fs.access(expectedJsPath)).resolves.toBeUndefined()
    expect($('img').attr('src')).toBe(`${assetsDirname}/${imageFilename}`)
    expect(linkHrefs).toEqual([
      'https://cdn2.hexlet.io/assets/menu.css',
      `${assetsDirname}/${cssFilename}`,
    ])
    expect(scriptSources).toEqual([
      'https://js.stripe.com/v3/',
      `${assetsDirname}/${jsFilename}`,
    ])
    expect($('a').attr('href')).toBe('/professions/nodejs')
  })

  test('Download page without local resources', async () => {
    const url = 'https://ru.hexlet.io/courses'
    const html = await readFixture('page-without-local-resources.html')
    const expectedHtmlPath = path.join(tmpDir, 'ru-hexlet-io-courses.html')
    const expectedAssetsDirPath = path.join(tmpDir, 'ru-hexlet-io-courses_files')

    nock('https://ru.hexlet.io').get('/courses').reply(200, html)

    const resultPath = await pageLoader(url, tmpDir)
    const savedHtml = await fs.readFile(resultPath, 'utf-8')
    const $ = cheerio.load(savedHtml)

    expect(resultPath).toBe(expectedHtmlPath)
    expect(path.isAbsolute(resultPath)).toBe(true)
    await expect(fs.access(expectedHtmlPath)).resolves.toBeUndefined()
    await expect(fs.access(expectedAssetsDirPath)).rejects.toMatchObject({
      code: 'ENOENT',
    })
    expect($('link').attr('href')).toBe('https://cdn2.hexlet.io/assets/menu.css')
    expect($('script').attr('src')).toBe('https://js.stripe.com/v3/')
    expect($('a').attr('href')).toBe('/professions/nodejs')
  })

  test('Reject when local resource does not exist', async () => {
    const url = 'https://ru.hexlet.io/courses'
    const html = await readFixture('page-with-missing-resource.html')
    const missingResourceUrl = 'https://ru.hexlet.io/assets/missing-application.css'

    nock('https://ru.hexlet.io').get('/courses').reply(200, html)
    nock('https://ru.hexlet.io')
      .get('/assets/professions/nodejs.png')
      .reply(200, 'image')
    nock('https://ru.hexlet.io')
      .get('/assets/missing-application.css')
      .reply(404)

    await expect(pageLoader(url, tmpDir)).rejects.toThrow(
      `failed to load resource: ${missingResourceUrl} (404)`,
    )
  })

  test('Reject when page does not exist', async () => {
    const url = 'https://ru.hexlet.io/courses-missing'

    nock('https://ru.hexlet.io').get('/courses-missing').reply(404)

    await expect(pageLoader(url, tmpDir)).rejects.toThrow(
      `failed to load page: ${url} (404)`,
    )
  })

  test('Reject when output directory does not exist', async () => {
    const url = 'https://ru.hexlet.io/courses'
    const html = await readFixture('page-with-local-resources.html')
    const notExistingDir = path.join(tmpDir, 'not-exists')

    nock('https://ru.hexlet.io').get('/courses').reply(200, html)

    await expect(pageLoader(url, notExistingDir)).rejects.toThrow(
      `cannot create directory: ${path.join(notExistingDir, 'ru-hexlet-io-courses_files')}`,
    )
  })
})
