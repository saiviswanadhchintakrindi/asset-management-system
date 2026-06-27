const AssetService = require('../services/assetService');
const RequestService = require('../services/requestService');
const UserModel = require('../models/userModel');
const NotificationModel = require('../models/notificationModel');
const AuditModel = require('../models/auditModel');
const { queryAll, queryOne } = require('../utils/db-helper');

const DashboardController = {
  getStats(req, res, next) {
    try {
      const user = req.user;

      if (user.role === 'admin') {
        const assetStats = AssetService.getStats();
        const requestStats = RequestService.getStats();
        const userStats = UserModel.getStats();
        const monthlyTrend = RequestService.getMonthlyTrend();

        res.json({
          success: true,
          data: {
            assets: assetStats,
            requests: requestStats,
            users: userStats,
            monthlyTrend,
          },
        });
      } else {
        // Employee dashboard
        const myAssets = (queryOne(`
          SELECT COUNT(*) as c FROM asset_assignments 
          WHERE user_id = ? AND returned_at IS NULL
        `, [user.id]) || {}).c || 0;

        const myRequests = queryAll(`
          SELECT status, COUNT(*) as count FROM service_requests 
          WHERE user_id = ? GROUP BY status
        `, [user.id]);

        const myOpenRequests = queryAll(`
          SELECT * FROM service_requests WHERE user_id = ? AND status NOT IN ('completed','rejected','cancelled')
          ORDER BY created_at DESC LIMIT 5
        `, [user.id]);

        const unreadNotifications = NotificationModel.getUnreadCount(user.id);

        const recentActivity = queryAll(`
          SELECT sr.*, a.name as asset_name FROM service_requests sr
          LEFT JOIN assets a ON a.id = sr.asset_id
          WHERE sr.user_id = ? ORDER BY sr.updated_at DESC LIMIT 5
        `, [user.id]);

        res.json({
          success: true,
          data: {
            myAssets,
            myRequests,
            myOpenRequests,
            unreadNotifications,
            recentActivity,
          },
        });
      }
    } catch (err) { next(err); }
  },
};

const ReportController = {
  assetReport(req, res, next) {
    try {
      const { date_from, date_to, category_id } = req.query;

      let where = '1=1';
      const params = [];
      if (category_id) { where += ' AND a.category_id = ?'; params.push(category_id); }
      if (date_from) { where += ' AND a.purchase_date >= ?'; params.push(date_from); }
      if (date_to) { where += ' AND a.purchase_date <= ?'; params.push(date_to); }

      const assets = queryAll(`
        SELECT a.*, c.name as category_name,
          u.name as assigned_to_name, u.department as assigned_department,
          aa.assigned_at
        FROM assets a
        LEFT JOIN asset_categories c ON c.id = a.category_id
        LEFT JOIN asset_assignments aa ON aa.asset_id = a.id AND aa.returned_at IS NULL
        LEFT JOIN users u ON u.id = aa.user_id
        WHERE ${where}
        ORDER BY a.name
      `, params);

      const summary = queryAll(`
        SELECT a.status, COUNT(*) as count, SUM(a.purchase_cost) as total_value
        FROM assets a WHERE ${where} GROUP BY a.status
      `, params);

      const byDepartment = queryAll(`
        SELECT u.department, COUNT(aa.id) as assigned_count
        FROM asset_assignments aa
        JOIN users u ON u.id = aa.user_id
        WHERE aa.returned_at IS NULL
        GROUP BY u.department
        ORDER BY assigned_count DESC
      `);

      res.json({ success: true, data: { assets, summary, byDepartment, generated_at: new Date().toISOString() } });
    } catch (err) { next(err); }
  },

  requestReport(req, res, next) {
    try {
      const { date_from, date_to, status, type } = req.query;

      let where = '1=1';
      const params = [];
      if (status) { where += ' AND sr.status = ?'; params.push(status); }
      if (type) { where += ' AND sr.type = ?'; params.push(type); }
      if (date_from) { where += ' AND sr.created_at >= ?'; params.push(date_from); }
      if (date_to) { where += ' AND sr.created_at <= ?'; params.push(date_to + ' 23:59:59'); }

      const requests = queryAll(`
        SELECT sr.*, u.name as requester_name, u.department,
          at2.name as assigned_to_name
        FROM service_requests sr
        JOIN users u ON u.id = sr.user_id
        LEFT JOIN users at2 ON at2.id = sr.assigned_to
        WHERE ${where}
        ORDER BY sr.created_at DESC
      `, params);

      const byStatus = queryAll(`SELECT status, COUNT(*) as count FROM service_requests sr WHERE ${where} GROUP BY status`, params);
      const byType = queryAll(`SELECT type, COUNT(*) as count FROM service_requests sr WHERE ${where} GROUP BY type`, params);
      const byPriority = queryAll(`SELECT priority, COUNT(*) as count FROM service_requests sr WHERE ${where} GROUP BY priority`, params);
      
      const avgQuery = queryOne(`
        SELECT AVG((julianday(resolved_at) - julianday(created_at))) as avg_days
        FROM service_requests sr WHERE resolved_at IS NOT NULL AND ${where}
      `, params);

      res.json({ success: true, data: { requests, byStatus, byType, byPriority, avgResolutionDays: avgQuery?.avg_days?.toFixed(1) || 'N/A', generated_at: new Date().toISOString() } });
    } catch (err) { next(err); }
  },
};

const AuditController = {
  getAll(req, res, next) {
    try {
      const result = AuditModel.findAll(req.query);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};

module.exports = { DashboardController, ReportController, AuditController };
