export function logError(message) {
  console.log(`\x1b[31m ${message} \x1b[0m`);
}

export function logInfo(message) {
  console.log(`\x1b[32m ${message} \x1b[0m`);
}

export function logWarn(message) {
  console.log(`\x1b[93m ${message} \x1b[0m`);
}

export function requireNonNull(object, message) {
  if (!object) {
    logError(message)
    throw new Error(message);
  }
}

export function requireNonNullVariable(value, name) {
  requireNonNull(value, `${name} variable is missing`)
}
