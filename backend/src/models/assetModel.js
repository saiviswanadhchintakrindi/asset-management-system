const { queryAll, queryOne, run } = require('../utils/db-helper');

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0];

const AssetModel = {
  findById(id) {
    const asset = queryOne(`
      SELECT a.*, c.name as category_name
      FROM assets a LEFT JOIN asset_categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);
    if (!asset) return null;
    // Get assignment info
    const assignment = queryOne(`
      SELECT aa.user_id, u.name as assigned_to_name
      FROM asset_assignments aa JOIN users u ON u.id = aa.user_id
      WHERE aa.asset_id = ? AND aa.returned_at IS NULL LIMIT 1
    `, [id]);
    if (assignment) {
      asset.assigned_to_id = assignment.user_id;
      asset.assigned_to_name = assignment.assigned_to_name;
    }
    return asset;
  },

  findAll({ page = 1, limit = 20, search = '', status = '', category_id = '' } = {}) {
    let where = '1=1';
    const params = [];
    if (search) { where += ` AND (a.name LIKE ? OR a.serial_number LIKE ? OR a.model LIKE ? OR a.manufacturer LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
    if (status) { where += ` AND a.status = ?`; params.push(status); }
    if (category_id) { where += ` AND a.category_id = ?`; params.push(Number(category_id)); }

    const total = (queryOne(`SELECT COUNT(*) as count FROM assets a WHERE ${where}`, params) || {}).count || 0;
    const offset = (Number(page) - 1) * Number(limit);
    const rows = queryAll(`
      SELECT a.*, c.name as category_name
      FROM assets a LEFT JOIN asset_categories c ON a.category_id = c.id
      WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]);

    // Enrich with assignment info
    for (const row of rows) {
      const asgn = queryOne(`SELECT u.name FROM asset_assignments aa JOIN users u ON u.id = aa.user_id WHERE aa.asset_id = ? AND aa.returned_at IS NULL LIMIT 1`, [row.id]);
      row.assigned_to_name = asgn ? asgn.name : null;
    }

    return { rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
  },

  create(data) {
    const { name, category_id, serial_number, model, manufacturer, purchase_date, purchase_cost, warranty_expiry, location, notes } = data;
    const n = now();
    const result = run(`
      INSERT INTO assets (name,category_id,serial_number,model,manufacturer,purchase_date,purchase_cost,warranty_expiry,location,notes,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [name, category_id, serial_number || null, model || null, manufacturer || null, purchase_date || null, purchase_cost || 0, warranty_expiry || null, location || null, notes || null, n, n]);
    return this.findById(result.lastInsertRowid);
  },

  update(id, data) {
    const allowed = ['name', 'category_id', 'serial_number', 'model', 'manufacturer', 'purchase_date', 'purchase_cost', 'warranty_expiry', 'status', 'location', 'notes'];
    const updates = Object.entries(data).filter(([k]) => allowed.includes(k));
    if (!updates.length) return this.findById(id);
    const set = updates.map(([k]) => `${k} = ?`).join(', ');
    run(`UPDATE assets SET ${set}, updated_at = ? WHERE id = ?`, [...updates.map(([, v]) => v), now(), id]);
    return this.findById(id);
  },

  delete(id) {
    return run('DELETE FROM assets WHERE id = ?', [id]);
  },

  assign(assetId, userId, assignedBy, notes) {
    const n = now();
    run("UPDATE assets SET status = 'assigned', updated_at = ? WHERE id = ?", [n, assetId]);
    run('INSERT INTO asset_assignments (asset_id, user_id, assigned_by, notes, assigned_at) VALUES (?,?,?,?,?)', [assetId, userId, assignedBy, notes || null, n]);
    return this.findById(assetId);
  },

  returnAsset(assetId) {
    const n = now();
    run("UPDATE asset_assignments SET returned_at = ? WHERE asset_id = ? AND returned_at IS NULL", [n, assetId]);
    run("UPDATE assets SET status = 'available', updated_at = ? WHERE id = ?", [n, assetId]);
    return this.findById(assetId);
  },

  getAssignmentHistory(assetId) {
    return queryAll(`
      SELECT aa.*, u.name as user_name, u.email as user_email, u.department,
             ab.name as assigned_by_name
      FROM asset_assignments aa
      JOIN users u ON u.id = aa.user_id
      JOIN users ab ON ab.id = aa.assigned_by
      WHERE aa.asset_id = ?
      ORDER BY aa.assigned_at DESC
    `, [assetId]);
  },

  getUserAssets(userId) {
    return queryAll(`
      SELECT a.*, c.name as category_name, aa.assigned_at
      FROM assets a
      JOIN asset_assignments aa ON aa.asset_id = a.id AND aa.returned_at IS NULL
      JOIN asset_categories c ON c.id = a.category_id
      WHERE aa.user_id = ?
    `, [userId]);
  },

  getStats() {
    const total = (queryOne('SELECT COUNT(*) as c FROM assets') || {}).c || 0;
    const byStatus = queryAll("SELECT status, COUNT(*) as count FROM assets GROUP BY status");
    const byCategory = queryAll(`
      SELECT c.name, COUNT(a.id) as count 
      FROM asset_categories c LEFT JOIN assets a ON a.category_id = c.id 
      GROUP BY c.id, c.name
    `);
    const totalValue = (queryOne('SELECT SUM(purchase_cost) as total FROM assets') || {}).total || 0;
    return { total, byStatus, byCategory, totalValue };
  },
};

module.exports = AssetModel;
