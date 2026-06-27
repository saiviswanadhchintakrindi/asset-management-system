const RequestModel = require('../models/requestModel');
const NotificationModel = require('../models/notificationModel');
const UserModel = require('../models/userModel');
const { queryAll } = require('../utils/db-helper');

const STATUS_TRANSITIONS = {
  pending:     ['approved', 'rejected', 'cancelled'],
  approved:    ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  rejected:    [],
  completed:   [],
  cancelled:   [],
};

const RequestService = {
  getAll(query, user) {
    // Employees only see their own requests
    if (user.role === 'employee') query.user_id = user.id;
    return RequestModel.findAll(query);
  },

  getById(id, user) {
    const req = RequestModel.findById(id);
    if (!req) throw Object.assign(new Error('Request not found.'), { status: 404 });
    if (user.role === 'employee' && req.user_id !== user.id) throw Object.assign(new Error('Access denied.'), { status: 403 });
    return req;
  },

  create(data, userId) {
    const request = RequestModel.create({ ...data, user_id: userId });

    // Notify all admins about new request
    const admins = queryAll("SELECT id FROM users WHERE role = 'admin' AND is_active = 1");
    admins.forEach(admin => {
      NotificationModel.create({
        user_id: admin.id,
        title: 'New Service Request',
        message: `${request.requester_name} submitted a new ${request.type.replace('_', ' ')} request: "${request.title}"`,
        type: 'info',
        reference_id: request.id,
        reference_type: 'request',
      });
    });

    return request;
  },

  updateStatus(id, { status, assigned_to, notes }, adminUser) {
    const request = RequestModel.findById(id);
    if (!request) throw Object.assign(new Error('Request not found.'), { status: 404 });

    const allowed = STATUS_TRANSITIONS[request.status] || [];
    if (!allowed.includes(status)) {
      throw Object.assign(new Error(`Cannot transition from '${request.status}' to '${status}'.`), { status: 400 });
    }

    const updated = RequestModel.updateStatus(id, { status, assigned_to, notes });

    // Notify the requester
    const statusMessages = {
      approved: { title: 'Request Approved ✅', type: 'success', msg: `Your request "${request.title}" has been approved.` },
      rejected: { title: 'Request Rejected ❌', type: 'error', msg: `Your request "${request.title}" has been rejected.` },
      in_progress: { title: 'Request In Progress 🔧', type: 'info', msg: `Your request "${request.title}" is now being worked on.` },
      completed: { title: 'Request Completed ✅', type: 'success', msg: `Your request "${request.title}" has been completed.` },
      cancelled: { title: 'Request Cancelled', type: 'warning', msg: `Your request "${request.title}" has been cancelled.` },
    };

    const notif = statusMessages[status];
    if (notif) {
      NotificationModel.create({
        user_id: request.user_id,
        title: notif.title,
        message: notif.msg,
        type: notif.type,
        reference_id: id,
        reference_type: 'request',
      });
    }

    return updated;
  },

  delete(id, user) {
    const request = RequestModel.findById(id);
    if (!request) throw Object.assign(new Error('Request not found.'), { status: 404 });
    if (user.role === 'employee' && request.user_id !== user.id) throw Object.assign(new Error('Access denied.'), { status: 403 });
    if (user.role === 'employee' && request.status !== 'pending') throw Object.assign(new Error('Only pending requests can be deleted.'), { status: 400 });
    RequestModel.delete(id);
    return { message: 'Request deleted.' };
  },

  getComments(requestId, user) {
    const request = RequestModel.findById(requestId);
    if (!request) throw Object.assign(new Error('Request not found.'), { status: 404 });
    if (user.role === 'employee' && request.user_id !== user.id) throw Object.assign(new Error('Access denied.'), { status: 403 });
    return RequestModel.getComments(requestId);
  },

  addComment(requestId, userId, comment, user) {
    const request = RequestModel.findById(requestId);
    if (!request) throw Object.assign(new Error('Request not found.'), { status: 404 });
    if (user.role === 'employee' && request.user_id !== user.id) throw Object.assign(new Error('Access denied.'), { status: 403 });

    const result = RequestModel.addComment({ request_id: requestId, user_id: userId, comment });

    // Notify the other party
    const notifyUserId = userId === request.user_id ? null : request.user_id;
    if (notifyUserId) {
      NotificationModel.create({
        user_id: notifyUserId,
        title: 'New Comment on Your Request',
        message: `A new comment was added to your request "${request.title}".`,
        type: 'info',
        reference_id: requestId,
        reference_type: 'request',
      });
    }

    return result;
  },

  getStats() { return RequestModel.getStats(); },
  getMonthlyTrend() { return RequestModel.getMonthlyTrend(); },
};

module.exports = RequestService;
