// Load .env before any other module reads process.env
const path = require('path');
const fs = require('fs');

// Try backend/.env first, fall back to project root .env
let envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(__dirname, '../../.env');
}
require('dotenv').config({ path: envPath, override: true });
