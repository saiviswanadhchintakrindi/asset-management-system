process.env.NODE_ENV = 'test';
process.env.DB_PATH = './database/test_office_assets.db';
process.env.JWT_SECRET = 'test_secret_key_12345';
process.env.JWT_EXPIRES_IN = '1h';

const fs = require('fs');
const path = require('path');

const testDbPath = path.resolve(__dirname, '../database/test_office_assets.db');

// Remove old test DB
try {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
} catch (e) {}

module.exports = async () => {
  const { initDb } = require('../src/config/database');
  await initDb();
};
