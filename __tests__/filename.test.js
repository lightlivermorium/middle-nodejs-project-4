const makeFilename = require('../src/filename')

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
})
