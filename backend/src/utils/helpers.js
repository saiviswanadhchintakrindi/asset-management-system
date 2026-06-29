const { run } = require('./db-helper');
const logger = require('./logger');

/**
 * Create an audit log entry
 */
function createAuditLog({ userId, action, entityType, entityId, details, oldValues, newValues, ipAddress, userAgent }) {
  try {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, old_values, new_values, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId || null,
      action,
      entityType,
      entityId || null,
      details || null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress || null,
      userAgent || null,
      now
    ]);
  } catch (err) {
    logger.error('Failed to create audit log:', err.message);
  }
}

/**
 * Create a notification for a user
 */
function createNotification(db, { userId, title, message, type = 'info', referenceId, referenceType }) {
  // db is ignored here, as run is imported from db-helper and acts as global
  try {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    run(`
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, title, message, type, referenceId || null, referenceType || null, now]);
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }
}

module.exports = { createAuditLog, createNotification };
