const AuthService = require('../services/authService');
const UserModel = require('../models/userModel');
const { createAuditLog } = require('../utils/helpers');

const AuthController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      createAuditLog({ userId: result.user.id, action: 'LOGIN', entityType: 'user', entityId: result.user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      res.json({ success: true, message: 'Login successful.', data: result });
    } catch (err) { next(err); }
  },

  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      createAuditLog({ userId: result.user.id, action: 'REGISTER', entityType: 'user', entityId: result.user.id, ipAddress: req.ip });
      res.status(201).json({ success: true, message: 'Registration successful.', data: result });
    } catch (err) { next(err); }
  },

  async getMe(req, res, next) {
    try {
      const user = UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async changePassword(req, res, next) {
    try {
      const result = await AuthService.changePassword(req.user.id, req.body.current_password, req.body.new_password);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },
};

module.exports = AuthController;
