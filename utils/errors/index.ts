export class AppError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode?: number
    ) {
      super(message);
      this.name = 'AppError';
    }
  }
  
  export class NetworkError extends AppError {
    constructor(message: string = 'Network connection error') {
      super(message, 'NETWORK_ERROR', 0);
      this.name = 'NetworkError';
    }
  }
  
  export class ApiError extends AppError {
    constructor(
      message: string = 'API request failed',
      statusCode?: number
    ) {
      super(message, 'API_ERROR', statusCode);
      this.name = 'ApiError';
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message: string, public field?: string) {
      super(message, 'VALIDATION_ERROR', 400);
      this.name = 'ValidationError';
    }
  }
  
  export class AuthError extends AppError {
    constructor(message: string = 'Authentication required') {
      super(message, 'AUTH_ERROR', 401);
      this.name = 'AuthError';
    }
  }
  
  export class PermissionError extends AppError {
    constructor(message: string = 'Permission denied') {
      super(message, 'PERMISSION_ERROR', 403);
      this.name = 'PermissionError';
    }
  }
  
  // Error handler utility
  export const handleError = (error: unknown): string => {
    if (error instanceof AppError) {
      return error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  };