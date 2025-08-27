import winston from 'winston';
import { Request } from 'express';

// Custom format for request ID
const requestIdFormat = winston.format.printf(({ level, message, timestamp, requestId, ...meta }) => {
  const requestIdStr = requestId ? `[${requestId}] ` : '';
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} ${requestIdStr}${level.toUpperCase()}: ${message} ${metaStr}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    requestIdFormat
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Logger middleware to add request ID to logs
export const loggerMiddleware = (req: Request, _res: any, next: any) => {
  const requestId = req.headers['x-request-id'] as string || req.id;
  
  // Add request ID to logger context
  req.logger = logger.child({ requestId });
  
  next();
};

// Helper function to log with request context
export function logWithContext(level: string, message: string, requestId?: string, meta?: Record<string, unknown>): void {
  const logData: any = { message, ...meta };
  if (requestId) {
    logData.requestId = requestId;
  }
  
  logger.log(level, message, logData);
}

// Audit logging for security events
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-service', type: 'audit' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // In production, you might want to add file transport for audit logs
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ 
        filename: 'logs/audit.log',
        level: 'info'
      })
    ] : [])
  ]
});

// Audit log function for security events
export function auditLog(
  event: string,
  userId?: string,
  ip?: string,
  userAgent?: string,
  details?: Record<string, unknown>
): void {
  auditLogger.info('Security event', {
    event,
    userId,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    ...details
  });
}
