const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, url: req.url, method: req.method });

  // SQLite unique constraint errors
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    const field = err.message.split('UNIQUE constraint failed: ')[1];
    return res.status(409).json({ success: false, message: `A record with this ${field ? field.split('.')[1] : 'value'} already exists.` });
  }

  // SQLite foreign key errors
  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: err.message, errors: err.errors });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error. Please try again later.';

  res.status(status).json({ success: false, message });
}

/**
 * 404 Not Found handler
 */
function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
}

module.exports = { errorHandler, notFound };
