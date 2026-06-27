const { queryAll, queryOne, run } = require('../utils/db-helper');

const UserModel = {
  findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = ?', [email]);
  },

  findById(id) {
    return queryOne('SELECT id,name,email,role,department,phone,avatar_url,is_active,created_at,updated_at FROM users WHERE id = ?', [id]);
  },

  findAll({ page = 1, limit = 20, search = '', role = '', department = '', is_active = '' } = {}) {
    let where = '1=1';
    const params = [];
    if (search) { where += ` AND (name LIKE ? OR email LIKE ? OR department LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (role) { where += ` AND role = ?`; params.push(role); }
    if (department) { where += ` AND department = ?`; params.push(department); }
    if (is_active !== '' && is_active !== undefined) { where += ` AND is_active = ?`; params.push(Number(is_active)); }

    const countRow = queryOne(`SELECT COUNT(*) as count FROM users WHERE ${where}`, params);
    const total = countRow ? countRow.count : 0;
    const offset = (Number(page) - 1) * Number(limit);
    const rows = queryAll(
      `SELECT id,name,email,role,department,phone,avatar_url,is_active,created_at,updated_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    return { rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
  },

  create({ name, email, password_hash, role = 'employee', department = 'General', phone }) {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    const result = run(
      'INSERT INTO users (name,email,password_hash,role,department,phone,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
      [name, email, password_hash, role, department, phone || null, now, now]
    );
    return this.findById(result.lastInsertRowid);
  },

  update(id, fields) {
    const allowed = ['name', 'email', 'department', 'phone', 'role', 'avatar_url', 'is_active'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return this.findById(id);
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    const set = updates.map(([k]) => `${k} = ?`).join(', ');
    const values = updates.map(([, v]) => v);
    run(`UPDATE users SET ${set}, updated_at = ? WHERE id = ?`, [...values, now, id]);
    return this.findById(id);
  },

  updatePassword(id, password_hash) {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [password_hash, now, id]);
  },

  getStats() {
    const total = (queryOne('SELECT COUNT(*) as c FROM users') || {}).c || 0;
    const active = (queryOne("SELECT COUNT(*) as c FROM users WHERE is_active = 1") || {}).c || 0;
    const admins = (queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'admin'") || {}).c || 0;
    const deptRows = queryAll('SELECT DISTINCT department FROM users WHERE is_active = 1');
    return { total, active, admins, departments: deptRows.map(r => r.department) };
  },
};

module.exports = UserModel;
