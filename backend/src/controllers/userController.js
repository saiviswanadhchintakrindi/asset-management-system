const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const AssetModel = require('../models/assetModel');
const { createAuditLog } = require('../utils/helpers');

const UserController = {
  getAll(req, res, next) {
    try {
      const result = UserModel.findAll(req.query);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  getById(req, res, next) {
    try {
      const user = UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const existing = UserModel.findByEmail(req.body.email);
      if (existing) return res.status(409).json({ success: false, message: 'Email already exists.' });
      const password_hash = await bcrypt.hash(req.body.password || 'Welcome@123', 12);
      const user = UserModel.create({ ...req.body, password_hash });
      createAuditLog({
        userId: req.user.id, action: 'CREATE', entityType: 'user', entityId: user.id,
        details: `User "${user.name}" (${user.email}) was created as ${user.role}`,
        newValues: req.body, ipAddress: req.ip
      });
      res.status(201).json({ success: true, message: 'User created.', data: user });
    } catch (err) { next(err); }
  },

  update(req, res, next) {
    try {
      const user = UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      const updated = UserModel.update(req.params.id, req.body);
      createAuditLog({
        userId: req.user.id, action: 'UPDATE', entityType: 'user', entityId: req.params.id,
        details: `User "${updated.name}" profile was updated`,
        oldValues: user, newValues: req.body, ipAddress: req.ip
      });
      res.json({ success: true, message: 'User updated.', data: updated });
    } catch (err) { next(err); }
  },

  deactivate(req, res, next) {
    try {
      const user = UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      if (req.params.id == req.user.id) return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });
      UserModel.update(req.params.id, { is_active: 0 });
      createAuditLog({
        userId: req.user.id, action: 'DEACTIVATE', entityType: 'user', entityId: req.params.id,
        details: `User "${user.name}" (${user.email}) was deactivated`,
        ipAddress: req.ip
      });
      res.json({ success: true, message: 'User deactivated.' });
    } catch (err) { next(err); }
  },

  getAssets(req, res, next) {
    try {
      const assets = AssetModel.getUserAssets(req.params.id);
      res.json({ success: true, data: assets });
    } catch (err) { next(err); }
  },
};

module.exports = UserController;
