const { Command } = require('commander')
const Listr = require('listr')
const process = require('node:process')

const enableDebug = () => {
  const debugNamespaces = new Set(
    (process.env.DEBUG || '')
      .split(',')
      .map(namespace => namespace.trim())
      .filter(Boolean),
  )

  debugNamespaces.add('page-loader')
  debugNamespaces.add('axios')
  process.env.DEBUG = [...debugNamespaces].join(',')
}

const createProgressOptions = () => {
  const resourceTasks = new Map()
  let resourceSubtasks = []
  let discoveredResources = null
  let resolveResourcesDiscovered
  const resourcesDiscoveredPromise = new Promise((resolve) => {
    resolveResourcesDiscovered = resolve
  })
  let pageLoaderPromise
  let resultPath

  const rejectTaskState = (taskState, error) => {
    if (!taskState || taskState.done || taskState.error) {
      return
    }

    taskState.error = error

    if (taskState.reject) {
      taskState.reject(error)
    }
  }

  return {
    start(loader) {
      if (!pageLoaderPromise) {
        pageLoaderPromise = loader()
          .then((filePath) => {
            resultPath = filePath
            return filePath
          })
          .catch((error) => {
            resourceTasks.forEach(taskState => rejectTaskState(taskState, error))
            throw error
          })
      }

      return pageLoaderPromise
    },
    waitForResourceDiscovery() {
      return Promise.race([
        resourcesDiscoveredPromise,
        pageLoaderPromise.then(() => discoveredResources || []),
      ])
    },
    waitForCompletion() {
      return pageLoaderPromise
    },
    getResultPath() {
      return resultPath
    },
    hasResources() {
      return (
        Array.isArray(discoveredResources) && discoveredResources.length > 0
      )
    },
    getTasks() {
      return resourceSubtasks
    },
    options: {
      onResourcesDiscovered(resources) {
        discoveredResources = resources
        resourceSubtasks = resources.map((resource) => {
          const taskState = {
            done: false,
            error: null,
          }

          resourceTasks.set(resource.url, taskState)

          return {
            title: `Downloading ${resource.filename}`,
            task: () =>
              new Promise((resolve, reject) => {
                taskState.resolve = resolve
                taskState.reject = reject

                if (taskState.error) {
                  reject(taskState.error)
                }
                else if (taskState.done) {
                  resolve()
                }
                else if (pageLoaderPromise) {
                  pageLoaderPromise.catch((error) => {
                    rejectTaskState(taskState, error)
                  })
                }
              }),
          }
        })

        resolveResourcesDiscovered(resources)
      },
      onResourceStart(resource) {
        const taskState = resourceTasks.get(resource.url)

        if (taskState) {
          taskState.started = true
        }
      },
      onResourceSuccess(resource) {
        const taskState = resourceTasks.get(resource.url)

        if (taskState) {
          taskState.done = true
        }

        if (taskState && taskState.resolve) {
          taskState.resolve()
        }
      },
      onResourceError(resource, error) {
        const taskState = resourceTasks.get(resource.url)

        if (taskState) {
          taskState.error = error
        }

        if (taskState && taskState.reject) {
          taskState.reject(error)
        }
      },
    },
  }
}

const run = (url, options) => {
  if (options.debug) {
    enableDebug()
  }

  const pageLoader = require('./page-loader')
  const progress = createProgressOptions()

  const tasks = new Listr(
    [
      {
        title: 'Downloading page',
        task: () => {
          progress.start(() =>
            pageLoader(url, options.output, progress.options),
          )
          return progress.waitForResourceDiscovery().then(() => undefined)
        },
      },
      {
        title: 'Downloading resources',
        task: (_, task) =>
          progress.waitForResourceDiscovery().then(() => {
            if (!progress.hasResources()) {
              task.skip('No local resources')
              return undefined
            }

            return new Listr(progress.getTasks(), {
              concurrent: true,
              exitOnError: true,
            })
          }),
      },
      {
        title: 'Saving page',
        task: () => progress.waitForCompletion(),
      },
    ],
    {
      exitOnError: true,
    },
  )

  tasks
    .run()
    .then(() => {
      console.log(progress.getResultPath())
    })
    .catch((error) => {
      console.error(error.message)
      process.exit(1)
    })
}

const runCli = (argv = process.argv) => {
  const program = new Command()

  program
    .version('1.0.0')
    .name('page-loader')
    .description('Download page and local resources')
    .argument('<url>')
    .option('-o, --output <dir>', 'output directory')
    .option('-d, --debug', 'enable debug logging')
    .action(run)
    .parse(argv)
}

module.exports = runCli
