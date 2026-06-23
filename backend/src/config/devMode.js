// Detect placeholder MongoDB URI or explicit mock flag
require('./loadEnv');

// 'true'  = always use local mock data (never try MongoDB)
// 'false' = always use MongoDB (crash if unavailable in production)
// 'auto'  = try MongoDB first, fall back to local mock if connection fails
const mockAuthSetting = (process.env.USE_MOCK_AUTH || 'auto').toLowerCase();

const isAutoMode = mockAuthSetting === 'auto';
const isForcedMock = mockAuthSetting === 'true';
const isForcedMongo = mockAuthSetting === 'false';

let mockAuthEnabled = isForcedMock ||
  (!isAutoMode && !isForcedMongo && process.env.NODE_ENV === 'development' && isPlaceholderUri(process.env.MONGO_URI));

function isPlaceholderUri(uri) {
  return !uri || uri.includes('<username>') || uri.includes('<password>') || uri.includes('xxxxx');
}

function enableMockAuth() {
  mockAuthEnabled = true;
}

function isMockAuthEnabled() {
  return mockAuthEnabled;
}

function isAutoModeEnabled() {
  return isAutoMode;
}

module.exports = { isPlaceholderUri, enableMockAuth, isMockAuthEnabled, isAutoModeEnabled };
