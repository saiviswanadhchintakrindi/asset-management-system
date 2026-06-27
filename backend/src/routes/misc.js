const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { DashboardController, ReportController, AuditController } = require('../controllers/dashboardController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Dashboard
router.get('/dashboard/stats', authenticate, DashboardController.getStats);

// Reports (admin only)
router.get('/reports/assets', authenticate, requireAdmin, ReportController.assetReport);
router.get('/reports/requests', authenticate, requireAdmin, ReportController.requestReport);

// Audit Logs (admin only)
router.get('/audit-logs', authenticate, requireAdmin, AuditController.getAll);

// Notifications (own user)
router.get('/notifications', authenticate, NotificationController.getAll);
router.put('/notifications/read-all', authenticate, NotificationController.markAllRead);
router.put('/notifications/:id/read', authenticate, NotificationController.markRead);

module.exports = router;
