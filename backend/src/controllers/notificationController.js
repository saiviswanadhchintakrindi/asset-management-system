const NotificationModel = require('../models/notificationModel');

const NotificationController = {
  getAll(req, res, next) {
    try {
      const result = NotificationModel.findByUser(req.user.id, req.query);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  markRead(req, res, next) {
    try {
      NotificationModel.markRead(req.params.id, req.user.id);
      res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) { next(err); }
  },

  markAllRead(req, res, next) {
    try {
      NotificationModel.markAllRead(req.user.id);
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) { next(err); }
  },
};

module.exports = NotificationController;
