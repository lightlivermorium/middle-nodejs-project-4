# page-loader

## Hexlet tests and linter status:
![Node.js](https://img.shields.io/badge/node-24.x-339933?logo=node.js&logoColor=white)
[![Actions Status](https://github.com/lightlivermorium/middle-nodejs-project-4/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/lightlivermorium/middle-nodejs-project-4/actions)
![ESLint](https://img.shields.io/badge/lint-eslint-4B32C3?logo=eslint)
![Prettier](https://img.shields.io/badge/code%20style-prettier-ff69b4?logo=prettier)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=lightlivermorium_middle-nodejs-project-4&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=lightlivermorium_middle-nodejs-project-4)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=lightlivermorium_middle-nodejs-project-4&metric=coverage)](https://sonarcloud.io/summary/new_code?id=lightlivermorium_middle-nodejs-project-4)

## Base example
```bash
page-loader https://ru.hexlet.io/courses
```

[![asciicast](https://asciinema.org/a/1011688.svg)](https://asciinema.org/a/1011688)

## With debug
```bash
page-loader -d https://ru.hexlet.io/courses
```
[![asciicast](https://asciinema.org/a/1038364.svg)](https://asciinema.org/a/1038364)

## Errors handling
```bash
page-loader https://ru.hexlet.io/courses-missing
```
[![asciicast](https://asciinema.org/a/1038789.svg)](https://asciinema.org/a/1038789)

## Debug logging
Run tests with cli, axios and nock logs enabled:
```bash
npm run test:debug
```

## Progress
```bash
page-loader https://ru.hexlet.io/courses
```

[![asciicast](https://asciinema.org/a/1038871.svg)](https://asciinema.org/a/1038871)
