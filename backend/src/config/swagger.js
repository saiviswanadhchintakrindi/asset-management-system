const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Office Asset Tracker API',
      version: '1.0.0',
      description: 'REST API for Office Asset Tracking & Employee Service Request System',
      contact: { name: 'Office Asset Tracker', email: 'admin@officeassets.com' },
    },
    servers: [{ url: 'http://localhost:5000', description: 'Development Server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'employee'] },
            department: { type: 'string' },
            phone: { type: 'string' },
            is_active: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            category_id: { type: 'integer' },
            serial_number: { type: 'string' },
            model: { type: 'string' },
            manufacturer: { type: 'string' },
            status: { type: 'string', enum: ['available', 'assigned', 'maintenance', 'retired'] },
            purchase_cost: { type: 'number' },
            location: { type: 'string' },
          },
        },
        ServiceRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            type: { type: 'string', enum: ['asset_request', 'maintenance', 'service', 'other'] },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
