import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { logError } from './firebase';

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
// HTTP CLIENT
// ============================================================================

function createHttpClient(config?: AxiosRequestConfig): AxiosInstance {
  const client = axios.create({
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  // Request interceptor
  client.interceptors.request.use(
    (cfg) => {
      // Log request in dev mode
      if (__DEV__) {
        const method = cfg.method?.toUpperCase() ?? 'GET';
        console.log(`🔵 ${method} ${cfg.baseURL ?? ''}${cfg.url ?? ''}`);
      }
      return cfg;
    },
    (error) => {
      console.error('❌ Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor (typed with ApiErrorBody)
  client.interceptors.response.use(
    (response) => {
      // Log response in dev mode
      if (__DEV__) {
        console.log(`✅ ${response.config.url} - ${response.status}`);
      }
      return response;
    },
    (error: AxiosError<ApiErrorBody>) => {
      const statusCode = error.response?.status;
      const data = error.response?.data;

      // Prefer message → error → detail → fallback to Axios message
      const msgFromBody =
        (data?.message && typeof data.message === 'string' && data.message) ||
        (data?.error && typeof data.error === 'string' && data.error) ||
        (data?.detail && typeof data.detail === 'string' && data.detail);

      const message = msgFromBody || error.message || 'Network error';

      // Log error
      const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
      const url = (error.config?.baseURL ?? '') + (error.config?.url ?? '');
      console.error(`❌ ${url} - ${statusCode ?? 'NETWORK_ERROR'}:`, message);

      // Create custom error
      const apiError = new ApiError(message, statusCode, data);

      // Log to Crashlytics in production
      if (!__DEV__) {
        logError(apiError, `HTTP ${method} ${url}`);
      }

      return Promise.reject(apiError);
    }
  );

  return client;
}

// ============================================================================
// EXPORTED CLIENTS
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function handleApiError(error: unknown, context?: string): never {
  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ApiError(error.message);
  }

  throw new ApiError('Unknown error occurred', undefined, error);
}

export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`⏳ Retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
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
