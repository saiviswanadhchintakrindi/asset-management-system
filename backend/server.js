require('dotenv').config();
const app = require('./src/app');
const { initDb } = require('./src/config/database');
const logger = require('./src/utils/logger');
const { queryOne } = require('./src/utils/db-helper');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Initialize database on startup
    await initDb();
    logger.info('Database initialized successfully');

    // Run seeding if DB is empty
    const userCount = queryOne('SELECT COUNT(*) as c FROM users')?.c || 0;
    if (userCount === 0) {
      logger.info('Seeding database with initial data...');
      await require('./src/config/seed')();
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`🌐 Frontend: http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Startup error:', err);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

start();
