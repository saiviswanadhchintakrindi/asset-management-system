const AssetModel = require('../models/assetModel');
const NotificationModel = require('../models/notificationModel');
const UserModel = require('../models/userModel');

const AssetService = {
  getAll(query) { return AssetModel.findAll(query); },
  getById(id) {
    const asset = AssetModel.findById(id);
    if (!asset) throw Object.assign(new Error('Asset not found.'), { status: 404 });
    return asset;
  },

  create(data) { return AssetModel.create(data); },

  update(id, data) {
    this.getById(id);
    return AssetModel.update(id, data);
  },

  delete(id) {
    const asset = this.getById(id);
    if (asset.status === 'assigned') throw Object.assign(new Error('Cannot delete an assigned asset. Return it first.'), { status: 400 });
    AssetModel.delete(id);
    return { message: 'Asset deleted successfully.' };
  },

  assign(assetId, userId, adminId, notes) {
    const asset = this.getById(assetId);
    if (asset.status === 'assigned') throw Object.assign(new Error('Asset is already assigned.'), { status: 400 });
    if (asset.status === 'retired') throw Object.assign(new Error('Cannot assign a retired asset.'), { status: 400 });

    const user = UserModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });

    const updated = AssetModel.assign(assetId, userId, adminId, notes);

    // Notify the employee
    NotificationModel.create({
      user_id: userId,
      title: 'Asset Assigned to You',
      message: `${asset.name} (${asset.serial_number || 'N/A'}) has been assigned to you.`,
      type: 'success',
      reference_id: assetId,
      reference_type: 'asset',
    });

    return updated;
  },

  returnAsset(assetId, adminId) {
    const asset = this.getById(assetId);
    if (asset.status !== 'assigned') throw Object.assign(new Error('Asset is not currently assigned.'), { status: 400 });

    const assignedUserId = asset.assigned_to_id;
    const updated = AssetModel.returnAsset(assetId);

    if (assignedUserId) {
      NotificationModel.create({
        user_id: assignedUserId,
        title: 'Asset Returned',
        message: `${asset.name} has been returned and is no longer assigned to you.`,
        type: 'info',
        reference_id: assetId,
        reference_type: 'asset',
      });
    }

    return updated;
  },

  getHistory(assetId) {
    this.getById(assetId);
    return AssetModel.getAssignmentHistory(assetId);
  },

  getUserAssets(userId) { return AssetModel.getUserAssets(userId); },
  getStats() { return AssetModel.getStats(); },
};

module.exports = AssetService;
