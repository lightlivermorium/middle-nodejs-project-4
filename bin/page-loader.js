#!/usr/bin/env node

const { parseArgs } = require('node:util');
const Listr = require('listr');

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    debug: {
      type: 'boolean',
      short: 'd',
    },
    output: {
      type: 'string',
      short: 'o',
    },
  },
  allowPositionals: true,
});

if (values.debug) {
  const debugNamespaces = new Set(
    (process.env.DEBUG || '')
      .split(',')
      .map((namespace) => namespace.trim())
      .filter(Boolean),
  );

  debugNamespaces.add('page-loader');
  debugNamespaces.add('axios');
  process.env.DEBUG = [...debugNamespaces].join(',');
}

const pageLoader = require('../src/page-loader');

const [url] = positionals;

const createProgressOptions = () => {
  const resourceTasks = new Map();
  let resourceSubtasks = [];
  let discoveredResources = null;
  let resolveResourcesDiscovered;
  const resourcesDiscoveredPromise = new Promise((resolve) => {
    resolveResourcesDiscovered = resolve;
  });
  let pageLoaderPromise;
  let resultPath;

  return {
    start(loader) {
      if (!pageLoaderPromise) {
        pageLoaderPromise = loader().then((filePath) => {
          resultPath = filePath;
          return filePath;
        });
      }

      return pageLoaderPromise;
    },
    waitForResourceDiscovery() {
      return Promise.race([
        resourcesDiscoveredPromise,
        pageLoaderPromise.then(() => discoveredResources || []),
      ]);
    },
    waitForCompletion() {
      return pageLoaderPromise;
    },
    getResultPath() {
      return resultPath;
    },
    hasResources() {
      return (
        Array.isArray(discoveredResources) && discoveredResources.length > 0
      );
    },
    getTasks() {
      return resourceSubtasks;
    },
    options: {
      onResourcesDiscovered(resources) {
        discoveredResources = resources;
        resourceSubtasks = resources.map((resource) => {
          const taskState = {
            done: false,
            error: null,
          };

          resourceTasks.set(resource.url, taskState);

          return {
            title: `Downloading ${resource.filename}`,
            task: () =>
              new Promise((resolve, reject) => {
                taskState.resolve = resolve;
                taskState.reject = reject;

                if (taskState.error) {
                  reject(taskState.error);
                } else if (taskState.done) {
                  resolve();
                }
              }),
          };
        });

        resolveResourcesDiscovered(resources);
      },
      onResourceStart(resource) {
        const taskState = resourceTasks.get(resource.url);

        if (taskState) {
          taskState.started = true;
        }
      },
      onResourceSuccess(resource) {
        const taskState = resourceTasks.get(resource.url);

        if (taskState) {
          taskState.done = true;
        }

        if (taskState && taskState.resolve) {
          taskState.resolve();
        }
      },
      onResourceError(resource, error) {
        const taskState = resourceTasks.get(resource.url);

        if (taskState) {
          taskState.error = error;
        }

        if (taskState && taskState.reject) {
          taskState.reject(error);
        }
      },
    },
  };
};

if (!url) {
  console.error('Usage: page-loader [-d] [-o output] <url>');
  process.exit(1);
} else {
  const progress = createProgressOptions();

  const tasks = new Listr(
    [
      {
        title: 'Downloading page',
        task: () => {
          progress.start(() =>
            pageLoader(url, values.output, progress.options),
          );
          return progress.waitForResourceDiscovery().then(() => undefined);
        },
      },
      {
        title: 'Downloading resources',
        task: (_, task) =>
          progress.waitForResourceDiscovery().then(() => {
            if (!progress.hasResources()) {
              task.skip('No local resources');
              return undefined;
            }

            return new Listr(progress.getTasks(), {
              concurrent: true,
              exitOnError: true,
            });
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
  );

  tasks
    .run()
    .then(() => {
      console.log(progress.getResultPath());
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
