import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requestId from 'express-request-id';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { logger, loggerMiddleware } from './utils/logger';
import { authConfig, validateAuthConfig } from './config/auth.config';
import { errorHandler } from './middleware/errorHandler';

export class App {
  public app: express.Application;
  public prisma: PrismaClient;

  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    
    // --- BEGIN guaranteed health endpoints (mounted first) ---
    this.app.get('/health', (_req, res) => {
      console.log('Health endpoint /health accessed');
      res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
    });
    this.app.get('/api/health', (_req, res) => {
      console.log('Health endpoint /api/health accessed');
      res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
    });
    // optional extra alias
    this.app.get('/healthz', (_req, res) => {
      console.log('Health endpoint /healthz accessed');
      res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
    });
    // Test endpoint to verify basic routing works
    this.app.get('/test', (_req, res) => {
      console.log('Test endpoint /test accessed');
      res.status(200).json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
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

    // Serve static files from client dist directory
    const clientDistPath = path.join(__dirname, '../../client/dist');
    this.app.use(express.static(clientDistPath, {
      maxAge: '1d', // Cache static assets for 1 day
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        // Set proper MIME types for JavaScript modules
        if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        // Enable CORS for static assets
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    }));

    // SPA fallback: serve index.html for all non-API routes
    this.app.get('*', (req, res) => {
      // Skip API routes and health endpoints
      if (req.path.startsWith('/api') || 
          req.path === '/health' || 
          req.path === '/api/health' || 
          req.path === '/healthz' || 
          req.path === '/test') {
        return res.status(404).json({ error: 'Not found' });
      }
      
      // Serve the React app for all other routes
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      console.log('Starting server...');
      
      // Validate configuration
      console.log('Validating auth config...');
      validateAuthConfig();
      console.log('Auth config validated');

      // Test database connection
      console.log('Connecting to database...');
      await this.prisma.$connect();
      console.log('Database connection established');
      logger.info('Database connection established');

      // Start server
      const port = process.env.PORT || 3000;
      console.log(`Starting server on port ${port}...`);
      this.app.listen(port, () => {
        console.log(`✅ Server started successfully on port ${port}`);
        console.log(`✅ Health endpoints available at:`);
        console.log(`   - http://localhost:${port}/health`);
        console.log(`   - http://localhost:${port}/api/health`);
        console.log(`   - http://localhost:${port}/healthz`);
        console.log(`   - http://localhost:${port}/test`);
        logger.info(`Server started on port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('❌ Failed to start application:', error);
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
