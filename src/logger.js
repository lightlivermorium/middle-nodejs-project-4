const createDebug = require('debug');
const axiosDebugLog = require('axios-debug-log');

axiosDebugLog({
  request(debug, config) {
    const method = (config.method || 'get').toUpperCase();

    debug('%s %s', method, config.url);
  },
  response(debug, response) {
    const method = (response.config.method || 'get').toUpperCase();

    debug('%s %s -> %d', method, response.config.url, response.status);
  },
  error(debug, error) {
    const method = (error.config?.method || 'get').toUpperCase();
    const url = error.config?.url || 'unknown-url';
    const status = error.response?.status;

    if (status) {
      debug('%s %s -> %d', method, url, status);
      return;
    }

    debug('%s %s -> ERROR %s', method, url, error.message);
  },
});

module.exports = createDebug('page-loader');
