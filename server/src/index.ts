import { App } from './app';
import { setupUnhandledRejectionHandler, setupUncaughtExceptionHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Setup global error handlers
setupUnhandledRejectionHandler();
setupUncaughtExceptionHandler();

// Create and start the application
const app = new App();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

// Start the application
app.start().catch((error) => {
  logger.error('Failed to start application', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});
