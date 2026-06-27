const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../database/test_office_assets.db');

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = './database/test_office_assets.db';
  process.env.JWT_SECRET = 'test_secret_key_12345';
  process.env.JWT_EXPIRES_IN = '1h';

  // Remove old test DB
  try {
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  } catch (e) {}

  // Initialize database
  const { initDb } = require('../src/config/database');
  await initDb();
};
