const { queryAll, queryOne, run } = require('../utils/db-helper');

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0];

const RequestModel = {
  findById(id) {
    return queryOne(`
      SELECT sr.*, 
        u.name as requester_name, u.email as requester_email, u.department,
        a.name as asset_name, a.serial_number as asset_serial,
        at2.name as assigned_to_name
      FROM service_requests sr
      JOIN users u ON u.id = sr.user_id
      LEFT JOIN assets a ON a.id = sr.asset_id
      LEFT JOIN users at2 ON at2.id = sr.assigned_to
      WHERE sr.id = ?
    `, [id]);
  },

  findAll({ page = 1, limit = 20, search = '', status = '', type = '', priority = '', user_id = '', date_from = '', date_to = '' } = {}) {
    let where = '1=1';
    const params = [];
    if (search) { where += ` AND (sr.title LIKE ? OR sr.description LIKE ? OR u.name LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (status) { where += ` AND sr.status = ?`; params.push(status); }
    if (type) { where += ` AND sr.type = ?`; params.push(type); }
    if (priority) { where += ` AND sr.priority = ?`; params.push(priority); }
    if (user_id) { where += ` AND sr.user_id = ?`; params.push(Number(user_id)); }
    if (date_from) { where += ` AND sr.created_at >= ?`; params.push(date_from); }
    if (date_to) { where += ` AND sr.created_at <= ?`; params.push(date_to + ' 23:59:59'); }

    const total = (queryOne(`SELECT COUNT(*) as count FROM service_requests sr JOIN users u ON u.id = sr.user_id WHERE ${where}`, params) || {}).count || 0;
    const offset = (Number(page) - 1) * Number(limit);
    const rows = queryAll(`
      SELECT sr.*, u.name as requester_name, u.department, a.name as asset_name, at2.name as assigned_to_name
      FROM service_requests sr
      JOIN users u ON u.id = sr.user_id
      LEFT JOIN assets a ON a.id = sr.asset_id
      LEFT JOIN users at2 ON at2.id = sr.assigned_to
      WHERE ${where} ORDER BY sr.created_at DESC LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]);

    return { rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
  },

  create({ user_id, type, title, description, priority = 'medium', asset_id }) {
    const n = now();
    const result = run(`
      INSERT INTO service_requests (user_id,type,title,description,priority,asset_id,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?)
    `, [user_id, type, title, description, priority, asset_id || null, n, n]);
    return this.findById(result.lastInsertRowid);
  },

  updateStatus(id, { status, assigned_to }) {
    const n = now();
    const isResolved = ['completed', 'rejected'].includes(status);
    if (isResolved) {
      run(`UPDATE service_requests SET status=?, assigned_to=?, resolved_at=?, updated_at=? WHERE id=?`, [status, assigned_to || null, n, n, id]);
    } else {
      run(`UPDATE service_requests SET status=?, assigned_to=?, updated_at=? WHERE id=?`, [status, assigned_to || null, n, id]);
    }
    return this.findById(id);
  },

  delete(id) {
    return run('DELETE FROM service_requests WHERE id = ?', [id]);
  },

  getComments(requestId) {
    return queryAll(`
      SELECT rc.*, u.name as user_name, u.role, u.avatar_url
      FROM request_comments rc
      JOIN users u ON u.id = rc.user_id
      WHERE rc.request_id = ?
      ORDER BY rc.created_at ASC
    `, [requestId]);
  },

  addComment({ request_id, user_id, comment }) {
    const n = now();
    const result = run('INSERT INTO request_comments (request_id, user_id, comment, created_at) VALUES (?,?,?,?)', [request_id, user_id, comment, n]);
    return queryOne(`
      SELECT rc.*, u.name as user_name, u.role 
      FROM request_comments rc JOIN users u ON u.id = rc.user_id 
      WHERE rc.id = ?
    `, [result.lastInsertRowid]);
  },

  getStats() {
    const total = (queryOne('SELECT COUNT(*) as c FROM service_requests') || {}).c || 0;
    const byStatus = queryAll('SELECT status, COUNT(*) as count FROM service_requests GROUP BY status');
    const byType = queryAll('SELECT type, COUNT(*) as count FROM service_requests GROUP BY type');
    const byPriority = queryAll('SELECT priority, COUNT(*) as count FROM service_requests GROUP BY priority');
    const pending = (queryOne("SELECT COUNT(*) as c FROM service_requests WHERE status = 'pending'") || {}).c || 0;
    const recent = queryAll(`
      SELECT sr.*, u.name as requester_name FROM service_requests sr JOIN users u ON u.id = sr.user_id
      ORDER BY sr.created_at DESC LIMIT 5
    `);
    return { total, byStatus, byType, byPriority, pending, recent };
  },

  getMonthlyTrend() {
    return queryAll(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM service_requests
      WHERE datetime(created_at) >= datetime('now', '-6 months')
      GROUP BY month ORDER BY month ASC
    `);
  },
};

module.exports = RequestModel;
