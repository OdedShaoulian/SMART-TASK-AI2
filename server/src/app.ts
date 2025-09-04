import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requestId from 'express-request-id';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from './modules/auth/auth.routes';
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
    
    // --- BEGIN guaranteed health endpoints (mounted first) ---
    this.app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
    });
    this.app.get('/api/health', (_req, res) => {
      res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
    });
    // optional extra alias
    this.app.get('/healthz', (_req, res) => {
      res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
    });
    // --- END guaranteed health endpoints ---
    
    console.log('Health endpoints ready at /health, /api/health, /healthz');
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
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
          healthz: '/healthz',
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
