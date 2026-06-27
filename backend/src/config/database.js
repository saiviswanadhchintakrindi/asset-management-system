require('dotenv').config();
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const DB_PATH = path.resolve(process.env.DB_PATH || './database/office_assets.db');
const SCHEMA_PATH = path.join(__dirname, '../../database/schema.sql');

let db = null;
let SQL = null;

/**
 * Persist the in-memory database to disk
 */
function persistDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    logger.error('Failed to persist DB:', err.message);
  }
}

/**
 * Initialize and return the database instance
 */
async function initDb() {
  if (db) return db;

  SQL = await initSqlJs();

  // Load existing DB file or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    logger.info('Database loaded from file.');
  } else {
    db = new SQL.Database();
    logger.info('New in-memory database created.');
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Run schema
  try {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.run(schema);
    logger.info('Schema applied.');
  } catch (err) {
    logger.error('Schema error:', err.message);
  }

  // Auto-persist every 30 seconds
  setInterval(persistDb, 30000);

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

module.exports = { initDb, getDb, persistDb };
