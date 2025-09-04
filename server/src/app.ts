import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requestId from 'express-request-id';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { healthRouter } from './routes/health';
import { logger, loggerMiddleware } from './utils/logger';
import { authConfig, validateAuthConfig } from './config/auth.config';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

export class App {
  public app: express.Application;
  public prisma: PrismaClient;

  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 1) Health routes FIRST (before auth/CSRF/ratelimit)
    this.app.use(healthRouter);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: authConfig.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    }));

    // Request ID middleware for tracking
    this.app.use(requestId());

    // Logger middleware
    this.app.use(loggerMiddleware);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Cookie parsing middleware
    this.app.use(cookieParser(authConfig.security.cookieSecret));

    // Trust proxy for proper IP address handling
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', createAuthRoutes(this.prisma));

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Smart Task AI API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: '/api/auth',
          health: '/health',
          apiHealth: '/api/health',
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateAuthConfig();

      // Test database connection
      await this.prisma.$connect();
      logger.info('Database connection established');

      // Start server
      const port = process.env.PORT || 3000;
      this.app.listen(port, () => {
        logger.info(`Server started on port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      logger.error('Failed to start application', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database connection closed');
      logger.info('Application stopped gracefully');
    } catch (error) {
      logger.error('Error during application shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
