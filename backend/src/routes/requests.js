const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const RequestController = require('../controllers/requestController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * @swagger
 * /api/requests:
 *   get:
 *     tags: [Requests]
 *     summary: Get service requests (admin sees all, employee sees own)
 */
router.get('/', authenticate, RequestController.getAll);

/**
 * @swagger
 * /api/requests:
 *   post:
 *     tags: [Requests]
 *     summary: Submit a new service request
 */
router.post('/',
  authenticate,
  [
    body('type').isIn(['asset_request', 'maintenance', 'service', 'other']),
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  validate,
  RequestController.create
);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     tags: [Requests]
 *     summary: Get request by ID
 */
router.get('/:id', authenticate, RequestController.getById);

/**
 * @swagger
 * /api/requests/{id}/status:
 *   put:
 *     tags: [Requests]
 *     summary: Update request status (admin only)
 */
router.put('/:id/status',
  authenticate, requireAdmin,
  [body('status').isIn(['approved', 'rejected', 'in_progress', 'completed', 'cancelled'])],
  validate,
  RequestController.updateStatus
);

/**
 * @swagger
 * /api/requests/{id}:
 *   delete:
 *     tags: [Requests]
 *     summary: Delete a pending request (own only for employee, any for admin)
 */
router.delete('/:id', authenticate, RequestController.delete);

/**
 * @swagger
 * /api/requests/{id}/comments:
 *   get:
 *     tags: [Requests]
 *     summary: Get comments for a request
 */
router.get('/:id/comments', authenticate, RequestController.getComments);

/**
 * @swagger
 * /api/requests/{id}/comments:
 *   post:
 *     tags: [Requests]
 *     summary: Add a comment to a request
 */
router.post('/:id/comments',
  authenticate,
  [body('comment').trim().isLength({ min: 1 }).withMessage('Comment cannot be empty')],
  validate,
  RequestController.addComment
);

module.exports = router;
