const RequestService = require('../services/requestService');
const { createAuditLog } = require('../utils/helpers');

const RequestController = {
  getAll(req, res, next) {
    try { res.json({ success: true, data: RequestService.getAll(req.query, req.user) }); }
    catch (err) { next(err); }
  },

  getById(req, res, next) {
    try { res.json({ success: true, data: RequestService.getById(req.params.id, req.user) }); }
    catch (err) { next(err); }
  },

  create(req, res, next) {
    try {
      const request = RequestService.create(req.body, req.user.id);
      createAuditLog({
        userId: req.user.id, action: 'CREATE', entityType: 'request', entityId: request.id,
        details: `Service request "${request.title}" (${request.type}) was submitted by ${request.requester_name}`,
        newValues: req.body, ipAddress: req.ip
      });
      res.status(201).json({ success: true, message: 'Request submitted.', data: request });
    } catch (err) { next(err); }
  },

  updateStatus(req, res, next) {
    try {
      const updated = RequestService.updateStatus(req.params.id, req.body, req.user);
      createAuditLog({
        userId: req.user.id, action: 'STATUS_UPDATE', entityType: 'request', entityId: req.params.id,
        details: `Request "${updated.title}" status changed to ${req.body.status}`,
        newValues: req.body, ipAddress: req.ip
      });
      res.json({ success: true, message: 'Request status updated.', data: updated });
    } catch (err) { next(err); }
  },

  delete(req, res, next) {
    try {
      const result = RequestService.delete(req.params.id, req.user);
      createAuditLog({
        userId: req.user.id, action: 'DELETE', entityType: 'request', entityId: req.params.id,
        details: `Service request #${req.params.id} was deleted`,
        ipAddress: req.ip
      });
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  getComments(req, res, next) {
    try { res.json({ success: true, data: RequestService.getComments(req.params.id, req.user) }); }
    catch (err) { next(err); }
  },

  addComment(req, res, next) {
    try {
      const comment = RequestService.addComment(req.params.id, req.user.id, req.body.comment, req.user);
      res.status(201).json({ success: true, message: 'Comment added.', data: comment });
    } catch (err) { next(err); }
  },
};

module.exports = RequestController;
