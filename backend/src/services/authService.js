const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { generateToken } = require('../middleware/auth');

const AuthService = {
  async login(email, password) {
    const user = UserModel.findByEmail(email);
    if (!user) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
    if (!user.is_active) throw Object.assign(new Error('Account is deactivated. Contact administrator.'), { status: 403 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;
    return { token, user: safeUser };
  },

  async register(data) {
    const existing = UserModel.findByEmail(data.email);
    if (existing) throw Object.assign(new Error('Email already registered.'), { status: 409 });

    const password_hash = await bcrypt.hash(data.password, 12);
    const user = UserModel.create({ ...data, password_hash, role: 'employee' });
    const token = generateToken(user);
    return { token, user };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = UserModel.findById(userId);
    const fullUser = UserModel.findByEmail(user.email);

    const valid = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!valid) throw Object.assign(new Error('Current password is incorrect.'), { status: 400 });

    const password_hash = await bcrypt.hash(newPassword, 12);
    UserModel.updatePassword(userId, password_hash);
    return { message: 'Password changed successfully.' };
  },
};

module.exports = AuthService;
