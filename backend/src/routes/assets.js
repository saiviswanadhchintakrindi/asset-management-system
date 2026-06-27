const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const AssetController = require('../controllers/assetController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Categories
/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all asset categories
 */
router.get('/categories', authenticate, AssetController.getCategories);
router.post('/categories', authenticate, requireAdmin, [body('name').trim().notEmpty()], validate, AssetController.createCategory);
router.put('/categories/:id', authenticate, requireAdmin, AssetController.updateCategory);
router.delete('/categories/:id', authenticate, requireAdmin, AssetController.deleteCategory);

// Assets
/**
 * @swagger
 * /api/assets:
 *   get:
 *     tags: [Assets]
 *     summary: Get all assets with search and filtering
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [available, assigned, maintenance, retired] }
 *       - in: query
 *         name: category_id
 *         schema: { type: integer }
 */
router.get('/', authenticate, AssetController.getAll);

/**
 * @swagger
 * /api/assets/stats:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset statistics
 */
router.get('/stats', authenticate, requireAdmin, AssetController.getStats);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset by ID
 */
router.get('/:id', authenticate, AssetController.getById);

/**
 * @swagger
 * /api/assets:
 *   post:
 *     tags: [Assets]
 *     summary: Create new asset (admin only)
 */
router.post('/',
  authenticate, requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Asset name is required'),
    body('category_id').isInt({ min: 1 }).withMessage('Valid category required'),
    body('purchase_cost').optional().isFloat({ min: 0 }),
  ],
  validate,
  AssetController.create
);

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     tags: [Assets]
 *     summary: Update asset (admin only)
 */
router.put('/:id', authenticate, requireAdmin, AssetController.update);

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     tags: [Assets]
 *     summary: Delete asset (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, AssetController.delete);

/**
 * @swagger
 * /api/assets/{id}/assign:
 *   post:
 *     tags: [Assets]
 *     summary: Assign asset to employee (admin only)
 */
router.post('/:id/assign',
  authenticate, requireAdmin,
  [body('user_id').isInt({ min: 1 }).withMessage('Valid user_id required')],
  validate,
  AssetController.assign
);

/**
 * @swagger
 * /api/assets/{id}/return:
 *   post:
 *     tags: [Assets]
 *     summary: Return an assigned asset (admin only)
 */
router.post('/:id/return', authenticate, requireAdmin, AssetController.returnAsset);

/**
 * @swagger
 * /api/assets/{id}/history:
 *   get:
 *     tags: [Assets]
 *     summary: Get assignment history for an asset
 */
router.get('/:id/history', authenticate, requireAdmin, AssetController.getHistory);

module.exports = router;
