const { queryAll, queryOne, run } = require('../utils/db-helper');

const CategoryModel = {
  findAll() {
    const cats = queryAll('SELECT * FROM asset_categories ORDER BY name');
    for (const cat of cats) {
      const count = queryOne('SELECT COUNT(*) as c FROM assets WHERE category_id = ?', [cat.id]);
      cat.asset_count = count ? count.c : 0;
    }
    return cats;
  },

  findById(id) {
    return queryOne('SELECT * FROM asset_categories WHERE id = ?', [id]);
  },

  create({ name, description }) {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    const result = run('INSERT INTO asset_categories (name, description, created_at) VALUES (?, ?, ?)', [name, description || null, now]);
    return this.findById(result.lastInsertRowid);
  },

  update(id, { name, description }) {
    if (name !== undefined) run('UPDATE asset_categories SET name = ? WHERE id = ?', [name, id]);
    if (description !== undefined) run('UPDATE asset_categories SET description = ? WHERE id = ?', [description, id]);
    return this.findById(id);
  },

  delete(id) {
    return run('DELETE FROM asset_categories WHERE id = ?', [id]);
  },
};

module.exports = CategoryModel;
