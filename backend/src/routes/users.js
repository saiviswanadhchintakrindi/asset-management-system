const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (admin only)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, employee] }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 */
router.get('/', authenticate, requireAdmin, UserController.getAll);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (admin only)
 */
router.post('/',
  authenticate, requireAdmin,
  [
    body('name').trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['admin', 'employee']),
    body('department').optional().trim(),
  ],
  validate,
  UserController.create
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 */
router.get('/:id', authenticate, UserController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 */
router.put('/:id',
  authenticate,
  [body('email').optional().isEmail().normalizeEmail()],
  validate,
  UserController.update
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate user (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, UserController.deactivate);

/**
 * @swagger
 * /api/users/{id}/assets:
 *   get:
 *     tags: [Users]
 *     summary: Get assets assigned to a user
 */
router.get('/:id/assets', authenticate, UserController.getAssets);

module.exports = router;
