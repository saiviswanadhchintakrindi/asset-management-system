const AssetService = require('../services/assetService');
const CategoryModel = require('../models/categoryModel');
const { createAuditLog } = require('../utils/helpers');
const { queryOne } = require('../utils/db-helper');

const AssetController = {
  getAll(req, res, next) {
    try { res.json({ success: true, data: AssetService.getAll(req.query) }); }
    catch (err) { next(err); }
  },

  getById(req, res, next) {
    try { res.json({ success: true, data: AssetService.getById(req.params.id) }); }
    catch (err) { next(err); }
  },

  create(req, res, next) {
    try {
      const asset = AssetService.create(req.body);
      createAuditLog({
        userId: req.user.id, action: 'CREATE', entityType: 'asset', entityId: asset.id,
        details: `Asset "${asset.name}" (${asset.serial_number || 'No SN'}) was added`,
        newValues: req.body, ipAddress: req.ip
      });
      res.status(201).json({ success: true, message: 'Asset created.', data: asset });
    } catch (err) { next(err); }
  },

  update(req, res, next) {
    try {
      const asset = AssetService.update(req.params.id, req.body);
      createAuditLog({
        userId: req.user.id, action: 'UPDATE', entityType: 'asset', entityId: req.params.id,
        details: `Asset "${asset.name}" was updated`,
        newValues: req.body, ipAddress: req.ip
      });
      res.json({ success: true, message: 'Asset updated.', data: asset });
    } catch (err) { next(err); }
  },

  delete(req, res, next) {
    try {
      const asset = AssetService.getById(req.params.id);
      const name = asset.name;
      const result = AssetService.delete(req.params.id);
      createAuditLog({
        userId: req.user.id, action: 'DELETE', entityType: 'asset', entityId: req.params.id,
        details: `Asset "${name}" was deleted`,
        ipAddress: req.ip
      });
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  assign(req, res, next) {
    try {
      const asset = AssetService.assign(req.params.id, req.body.user_id, req.user.id, req.body.notes);
      const user = queryOne('SELECT name FROM users WHERE id = ?', [req.body.user_id]);
      createAuditLog({
        userId: req.user.id, action: 'ASSIGN', entityType: 'asset', entityId: req.params.id,
        details: `"${asset.name}" was assigned to ${user ? user.name : 'User #' + req.body.user_id}`,
        newValues: req.body, ipAddress: req.ip
      });
      res.json({ success: true, message: 'Asset assigned.', data: asset });
    } catch (err) { next(err); }
  },

  returnAsset(req, res, next) {
    try {
      const asset = AssetService.getById(req.params.id);
      const result = AssetService.returnAsset(req.params.id, req.user.id);
      createAuditLog({
        userId: req.user.id, action: 'RETURN', entityType: 'asset', entityId: req.params.id,
        details: `"${asset.name}" was returned and is now available`,
        ipAddress: req.ip
      });
      res.json({ success: true, message: 'Asset returned.', data: result });
    } catch (err) { next(err); }
  },

  getHistory(req, res, next) {
    try { res.json({ success: true, data: AssetService.getHistory(req.params.id) }); }
    catch (err) { next(err); }
  },

  getStats(req, res, next) {
    try { res.json({ success: true, data: AssetService.getStats() }); }
    catch (err) { next(err); }
  },

  getCategories(req, res, next) {
    try { res.json({ success: true, data: CategoryModel.findAll() }); }
    catch (err) { next(err); }
  },

  createCategory(req, res, next) {
    try {
      const cat = CategoryModel.create(req.body);
      createAuditLog({
        userId: req.user.id, action: 'CREATE', entityType: 'category', entityId: cat.id,
        details: `Category "${cat.name}" was created`,
        newValues: req.body, ipAddress: req.ip
      });
      res.status(201).json({ success: true, message: 'Category created.', data: cat });
    } catch (err) { next(err); }
  },

  updateCategory(req, res, next) {
    try {
      const cat = CategoryModel.update(req.params.id, req.body);
      res.json({ success: true, message: 'Category updated.', data: cat });
    } catch (err) { next(err); }
  },

  deleteCategory(req, res, next) {
    try {
      CategoryModel.delete(req.params.id);
      res.json({ success: true, message: 'Category deleted.' });
    } catch (err) { next(err); }
  },
};

module.exports = AssetController;
