const { queryAll, queryOne, run } = require('../utils/db-helper');

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0];

const NotificationModel = {
  findByUser(userId, { page = 1, limit = 20 } = {}) {
    const total = (queryOne('SELECT COUNT(*) as c FROM notifications WHERE user_id = ?', [userId]) || {}).c || 0;
    const unread = (queryOne('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0', [userId]) || {}).c || 0;
    const offset = (Number(page) - 1) * Number(limit);
    const rows = queryAll('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, Number(limit), offset]);
    return { rows, total, unread, page: Number(page), pages: Math.ceil(total / Number(limit)) };
  },

  markRead(id, userId) {
    return run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
  },

  markAllRead(userId) {
    return run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  },

  getUnreadCount(userId) {
    return (queryOne('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0', [userId]) || {}).c || 0;
  },

  create({ user_id, title, message, type = 'info', reference_id, reference_type }) {
    const n = now();
    return run('INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, created_at) VALUES (?,?,?,?,?,?,?)',
      [user_id, title, message, type, reference_id || null, reference_type || null, n]);
  },
};

module.exports = NotificationModel;
