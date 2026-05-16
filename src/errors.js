class PageLoaderError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause })
    this.name = 'PageLoaderError'
    this.category = options.category
    this.resource = options.resource
    this.code = options.code
  }
}

const normalizeRequestError = (targetType, resource, error) => {
  if (error instanceof PageLoaderError) {
    return error
  }

  if (error.response) {
    return new PageLoaderError(
      `failed to load ${targetType}: ${resource} (${error.response.status})`,
      {
        category: 'http',
        resource,
        code: error.response.status,
        cause: error,
      },
    )
  }

  return new PageLoaderError(
    `network error while loading ${targetType}: ${resource}`,
    {
      category: 'network',
      resource,
      code: error.code,
      cause: error,
    },
  )
}

const normalizeCreateDirectoryError = (directoryPath, error) => {
  if (error instanceof PageLoaderError) {
    return error
  }

  return new PageLoaderError(`cannot create directory: ${directoryPath}`, {
    category: 'fs',
    resource: directoryPath,
    code: error.code,
    cause: error,
  })
}

const normalizeWriteFileError = (filePath, error) => {
  if (error instanceof PageLoaderError) {
    return error
  }

  return new PageLoaderError(`cannot write file: ${filePath}`, {
    category: 'fs',
    resource: filePath,
    code: error.code,
    cause: error,
  })
}

module.exports = {
  normalizeRequestError,
  normalizeCreateDirectoryError,
  normalizeWriteFileError,
  PageLoaderError,
}
