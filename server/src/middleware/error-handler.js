/**
 * Global error handling middleware
 */

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err) {
  // Prisma client known request error
  if (err.code === 'P2002') {
    return {
      statusCode: 409,
      message: 'A record with this value already exists',
      code: 'DUPLICATE_ENTRY'
    };
  }
  if (err.code === 'P2025') {
    return {
      statusCode: 404,
      message: 'Record not found',
      code: 'NOT_FOUND'
    };
  }
  if (err.code === 'P2003') {
    return {
      statusCode: 400,
      message: 'Foreign key constraint failed',
      code: 'FK_CONSTRAINT'
    };
  }
  return null;
}

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging
  const logData = {
    path: req.path,
    method: req.method,
    errorName: err.name,
    errorCode: err.code,
    message: err.message
  };

  // Only log stack in development
  if (process.env.NODE_ENV !== 'production') {
    logData.stack = err.stack;
  }

  console.error('[ERROR]', JSON.stringify(logData, null, 2));

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues?.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  // Handle Prisma errors (check by name or by error code pattern)
  if (err.name === 'PrismaClientKnownRequestError' || (err.code && typeof err.code === 'string' && err.code.startsWith('P'))) {
    const prismaError = handlePrismaError(err);
    if (prismaError) {
      return res.status(prismaError.statusCode).json({
        error: prismaError.message,
        code: prismaError.code
      });
    }
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    const response = {
      error: err.message,
      code: err.code
    };
    if (err.details) {
      response.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }

  // Default error response
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: 'INTERNAL_ERROR'
  });
}

/**
 * 404 handler for unknown API routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Endpoint ${req.method} ${req.path} not found`,
    code: 'ENDPOINT_NOT_FOUND'
  });
}

/**
 * Async handler wrapper to catch errors in async routes
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
