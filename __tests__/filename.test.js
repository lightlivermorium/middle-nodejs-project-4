const makeFilename = require('../src/filename')
const {
  makeAssetFilename,
  makeAssetsDirname,
} = require('../src/filename')

describe('makeFilename', () => {
  test('generates filename from url with path', () => {
    const url = 'https://ru.hexlet.io/courses'
    expect(makeFilename(url)).toBe('ru-hexlet-io-courses.html')
  })

  test('generates filename from root url', () => {
    const url = 'https://ru.hexlet.io'
    expect(makeFilename(url)).toBe('ru-hexlet-io.html')
  })

  test('removes trailing slash from pathname', () => {
    const url = 'https://ru.hexlet.io/courses/'
    expect(makeFilename(url)).toBe('ru-hexlet-io-courses.html')
  })

  test('ignores query string and hash', () => {
    const url = 'https://ru.hexlet.io/blog/about?name=test#section'
    expect(makeFilename(url)).toBe('ru-hexlet-io-blog-about.html')
  })

  test('generates assets directory name', () => {
    const url = 'https://ru.hexlet.io/courses'
    expect(makeAssetsDirname(url)).toBe('ru-hexlet-io-courses_files')
  })

  test('generates asset filename preserving extension', () => {
    const url = 'https://ru.hexlet.io/assets/application.css'
    expect(makeAssetFilename(url)).toBe('ru-hexlet-io-assets-application.css')
  })

  test('generates asset filename without extension as html', () => {
    const url = 'https://ru.hexlet.io/courses'
    expect(makeAssetFilename(url)).toBe('ru-hexlet-io-courses.html')
  })
})
