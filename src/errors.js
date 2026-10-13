export function problem(code, status, message) {
  return Object.assign(new Error(message), { code, status });
}

export function safeError(error) {
  return { code: error.code || 'internal_error', message: error.status ? error.message : 'The operation failed.' };
}
