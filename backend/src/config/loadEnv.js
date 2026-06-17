// Load .env before any other module reads process.env
const path = require('path');
const fs = require('fs');

// Try project root first (../.. from backend/src/config → project root)
let envPath = path.resolve(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  // Fallback to backend/.env
  envPath = path.resolve(__dirname, '../.env');
}
require('dotenv').config({ path: envPath, override: true });
