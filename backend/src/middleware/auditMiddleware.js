const { createAuditLog } = require('../utils/helpers');

/**
 * Factory: Create audit log middleware for any route
 * Usage: auditLog('CREATE', 'asset')
 */
function auditLog(action, entityType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (body && body.success !== false) {
        const entityId = body.data?.id || req.params?.id || null;
        createAuditLog({
          userId: req.user?.id,
          action,
          entityType,
          entityId,
          newValues: ['CREATE', 'UPDATE'].includes(action) ? req.body : undefined,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { auditLog };
