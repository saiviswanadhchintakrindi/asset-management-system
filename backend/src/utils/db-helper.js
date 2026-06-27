/**
 * db-helper.js
 * Wraps sql.js API to provide a simpler query interface
 * similar to better-sqlite3's .prepare().get()/.all()/.run() pattern
 */
const { getDb, persistDb } = require('../config/database');

/**
 * Execute a SELECT query and return all rows as objects
 */
function queryAll(sql, params = []) {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (err) {
    throw new Error(`queryAll error: ${err.message}\nSQL: ${sql}`);
  }
}

/**
 * Execute a SELECT query and return the first row as an object, or undefined
 */
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0];
}

/**
 * Execute an INSERT/UPDATE/DELETE statement and return { lastInsertRowid, changes }
 */
function run(sql, params = []) {
  const db = getDb();
  try {
    db.run(sql, params);
    const lastId = queryOne('SELECT last_insert_rowid() as id');
    const changes = queryOne('SELECT changes() as c');
    persistDb(); // persist after every write
    return {
      lastInsertRowid: lastId ? lastId.id : 0,
      changes: changes ? changes.c : 0,
    };
  } catch (err) {
    throw new Error(`run error: ${err.message}\nSQL: ${sql}`);
  }
}

/**
 * Execute multiple statements in a transaction
 */
function transaction(fn) {
  const db = getDb();
  db.run('BEGIN TRANSACTION');
  try {
    fn();
    db.run('COMMIT');
    persistDb();
  } catch (err) {
    try { db.run('ROLLBACK'); } catch (rbErr) { /* sql.js may auto-rollback on error */ }
    throw err;
  }
}

module.exports = { queryAll, queryOne, run, transaction };
