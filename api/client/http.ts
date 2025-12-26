/**
 * HTTP Client - Infrastructure Layer with Structured Logging
 * 
 * Provides Axios-based HTTP clients for external APIs with comprehensive
 * request/response logging, error handling, and retry logic
 * 
 * @version 3.0 - Structured Logging Migration
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { logError } from './firebase';
import { logger } from '../../services/logging/logger';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API error body shape returned by your backends
type ApiErrorBody = {
  message?: string;
  error?: string;
  detail?: string;
  [k: string]: unknown;
};

// ============================================================================
// HTTP CLIENT FACTORY
// ============================================================================

function createHttpClient(config?: AxiosRequestConfig): AxiosInstance {
  const clientStart = Date.now();
  
  logger.debug('Creating HTTP client', {
    baseURL: config?.baseURL || 'default',
    timeout: config?.timeout || 30000,
    operation: 'http-client-create',
  });
  
  const client = axios.create({
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  // ============================================================================
  // REQUEST INTERCEPTOR
  // ============================================================================
  
  client.interceptors.request.use(
    (cfg) => {
      const requestStart = Date.now();
      const method = cfg.method?.toUpperCase() ?? 'GET';
      const url = (cfg.baseURL ?? '') + (cfg.url ?? '');
      
      logger.debug('HTTP request initiated', {
        method,
        url,
        timeout: cfg.timeout,
        hasAuth: !!cfg.headers?.Authorization,
        operation: 'http-request',
      });
      
      // Store request start time for duration tracking
      (cfg as any).__requestStartTime = requestStart;
      
      return cfg;
    },
    (error) => {
      logger.error('HTTP request interceptor error', {
        error: error instanceof Error ? error.message : String(error),
        operation: 'http-request',
      });
      
      return Promise.reject(error);
    }
  );

  // ============================================================================
  // RESPONSE INTERCEPTOR
  // ============================================================================
  
  client.interceptors.response.use(
    (response) => {
      const requestStart = (response.config as any).__requestStartTime || Date.now();
      const duration = Date.now() - requestStart;
      const method = response.config.method?.toUpperCase() ?? 'GET';
      const url = response.config.url ?? 'unknown';
      const status = response.status;
      
      logger.success('HTTP request completed', {
        method,
        url,
        status,
        duration: `${duration}ms`,
        dataSize: response.data ? JSON.stringify(response.data).length : 0,
        operation: 'http-response',
      });
      
      return response;
    },
    (error: AxiosError<ApiErrorBody>) => {
      const requestStart = (error.config as any)?.__requestStartTime || Date.now();
      const duration = Date.now() - requestStart;
      const statusCode = error.response?.status;
      const data = error.response?.data;

      // Prefer message → error → detail → fallback to Axios message
      const msgFromBody =
        (data?.message && typeof data.message === 'string' && data.message) ||
        (data?.error && typeof data.error === 'string' && data.error) ||
        (data?.detail && typeof data.detail === 'string' && data.detail);

      const message = msgFromBody || error.message || 'Network error';

      // Extract request details
      const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
      const url = (error.config?.baseURL ?? '') + (error.config?.url ?? '');
      
      // Determine error type
      const isNetworkError = !error.response;
      const isClientError = statusCode && statusCode >= 400 && statusCode < 500;
      const isServerError = statusCode && statusCode >= 500;
      
      logger.error('HTTP request failed', {
        method,
        url,
        status: statusCode ?? 'NETWORK_ERROR',
        errorMessage: message,
        isNetworkError,
        isClientError,
        isServerError,
        duration: `${duration}ms`,
        operation: 'http-response',
      });

      // Create custom error
      const apiError = new ApiError(message, statusCode, data);

      // Log to Crashlytics in production (only for server errors and network errors)
      if (!__DEV__ && (isServerError || isNetworkError)) {
        logger.debug('Recording HTTP error to Crashlytics', {
          method,
          url,
          status: statusCode ?? 'NETWORK_ERROR',
          operation: 'http-crashlytics',
        });
        
        logError(apiError, `HTTP ${method} ${url}`);
      }

      return Promise.reject(apiError);
    }
  );

  const clientDuration = Date.now() - clientStart;
  
  logger.success('HTTP client created', {
    baseURL: config?.baseURL || 'default',
    timeout: config?.timeout || 30000,
    createDuration: `${clientDuration}ms`,
    operation: 'http-client-create',
  });

  return client;
}

// ============================================================================
// EXPORTED CLIENTS
// ============================================================================

logger.debug('Initializing HTTP clients', {
  clients: ['default', 'aladhan', 'quran', 'metalPrice'],
  operation: 'http-clients-init',
});

// Default HTTP client
export const httpClient = createHttpClient();

// Aladhan API client (prayer times, Islamic calendar)
export const aladhanClient = createHttpClient({
  baseURL: 'https://api.aladhan.com/v1',
  timeout: 15000,
});

// Alquran Cloud API client (Quran data)
export const quranClient = createHttpClient({
  baseURL: 'https://api.alquran.cloud/v1',
  timeout: 15000,
});

// Metal Price API client (gold prices)
export const metalPriceClient = createHttpClient({
  baseURL: 'https://api.metalpriceapi.com/v1',
  timeout: 15000,
});

logger.success('All HTTP clients initialized', {
  clients: ['httpClient', 'aladhanClient', 'quranClient', 'metalPriceClient'],
  operation: 'http-clients-init',
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API errors with logging
 */
export function handleApiError(error: unknown, context?: string): never {
  logger.debug('Handling API error', {
    context,
    errorType: error instanceof ApiError ? 'ApiError' : error instanceof Error ? 'Error' : 'Unknown',
    operation: 'http-error-handler',
  });
  
  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ApiError(error.message);
  }

  throw new ApiError('Unknown error occurred', undefined, error);
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  const retryStart = Date.now();
  let lastError: Error | undefined;

  logger.debug('Starting request with retry logic', {
    maxRetries,
    baseDelay: `${baseDelay}ms`,
    operation: 'http-retry',
  });

  for (let i = 0; i < maxRetries; i++) {
    const attemptStart = Date.now();
    
    try {
      logger.debug('Executing retry attempt', {
        attempt: i + 1,
        maxRetries,
        operation: 'http-retry',
      });
      
      const result = await requestFn();
      const attemptDuration = Date.now() - attemptStart;
      const totalDuration = Date.now() - retryStart;
      
      logger.success('Retry request succeeded', {
        attempt: i + 1,
        maxRetries,
        attemptDuration: `${attemptDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        operation: 'http-retry',
      });
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
      const attemptDuration = Date.now() - attemptStart;

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        logger.warn('Client error detected, skipping retry', {
          attempt: i + 1,
          statusCode: error.statusCode,
          errorMessage: error.message,
          attemptDuration: `${attemptDuration}ms`,
          operation: 'http-retry',
        });
        
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        
        logger.warn('Retry attempt failed, waiting before next attempt', {
          attempt: i + 1,
          maxRetries,
          errorMessage: lastError.message,
          nextDelay: `${delay}ms`,
          attemptDuration: `${attemptDuration}ms`,
          operation: 'http-retry',
        });
        
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error('All retry attempts exhausted', {
          attempts: maxRetries,
          totalDuration: `${Date.now() - retryStart}ms`,
          finalError: lastError.message,
          operation: 'http-retry',
        });
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// ============================================================================
// TYPE UTILITIES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  code: number;
  status: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}