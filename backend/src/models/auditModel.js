const { queryAll, queryOne, run } = require('../utils/db-helper');

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0];

const AuditModel = {
  findAll({ page = 1, limit = 50, entity_type = '', action = '', user_id = '', date_from = '', date_to = '' } = {}) {
    let where = '1=1';
    const params = [];

    if (entity_type) { where += ' AND al.entity_type = ?'; params.push(entity_type); }
    if (action) { where += ' AND al.action = ?'; params.push(action); }
    if (user_id) { where += ' AND al.user_id = ?'; params.push(Number(user_id)); }
    if (date_from) { where += ' AND al.created_at >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND al.created_at <= ?'; params.push(date_to + ' 23:59:59'); }

    const total = (queryOne(`SELECT COUNT(*) as count FROM audit_logs al WHERE ${where}`, params) || {}).count || 0;
    const offset = (Number(page) - 1) * Number(limit);
    const rows = queryAll(`
      SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
      WHERE ${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]);

    return { rows, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
  },
};

module.exports = AuditModel;
