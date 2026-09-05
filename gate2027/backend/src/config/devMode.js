// Detect placeholder MongoDB URI or explicit mock flag
require('./loadEnv');

let mockAuthEnabled =
  process.env.USE_MOCK_AUTH === 'true' ||
  (process.env.NODE_ENV === 'development' && isPlaceholderUri(process.env.MONGO_URI));

function isPlaceholderUri(uri) {
  return !uri || uri.includes('<username>') || uri.includes('<password>') || uri.includes('xxxxx');
}

function enableMockAuth() {
  mockAuthEnabled = true;
}

function isMockAuthEnabled() {
  return mockAuthEnabled;
}

module.exports = { isPlaceholderUri, enableMockAuth, isMockAuthEnabled };
