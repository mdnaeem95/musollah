/**
 * Musollah Logging System
 * 
 * Structured logging utility to replace console.log with:
 * - Log levels (debug, info, success, warn, error)
 * - Categories/namespaces ([Prayer Service], [Food], etc.)
 * - Metadata support (structured data)
 * - Performance tracking
 * - Production-ready (can disable or send to analytics)
 * - Color-coded output
 * 
 * @version 1.0
 * @since 2025-12-23
 * 
 * @example
 * ```typescript
 * import { logger, createLogger } from '@/utils/logger';
 * 
 * // Use global logger
 * logger.info('App started');
 * logger.success('Prayer times loaded', { count: 6 });
 * logger.error('API failed', error);
 * 
 * // Use category logger
 * const prayerLogger = createLogger('Prayer Service');
 * prayerLogger.info('Fetching prayer times', { date: '2025-12-23' });
 * ```
 */

// ============================================================================
// TYPES & CONFIGURATION
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 999, // Disable all logging
}

export interface LoggerConfig {
  /** Minimum log level to display */
  minLevel: LogLevel;
  /** Enable timestamps */
  timestamps: boolean;
  /** Enable colors (terminal only) */
  colors: boolean;
  /** Enable in production */
  enableInProduction: boolean;
  /** Send logs to analytics */
  sendToAnalytics: boolean;
  /** Categories to exclude */
  excludeCategories?: string[];
}

export interface LogEntry {
  level: LogLevel;
  category?: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  error?: Error;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const defaultConfig: LoggerConfig = {
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
  timestamps: __DEV__,
  colors: __DEV__,
  enableInProduction: false,
  sendToAnalytics: !__DEV__,
  excludeCategories: [],
};

let config = { ...defaultConfig };

/**
 * Update logger configuration
 */
export function configureLogger(newConfig: Partial<LoggerConfig>) {
  config = { ...config, ...newConfig };
}

/**
 * Get current configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...config };
}

// ============================================================================
// COLOR UTILITIES (Dev only)
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  if (!config.colors) return text;
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

// ============================================================================
// LOG LEVEL HELPERS
// ============================================================================

const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '🔍 DEBUG',
  [LogLevel.INFO]: '🔵 INFO',
  [LogLevel.SUCCESS]: '✅ SUCCESS',
  [LogLevel.WARN]: '⚠️  WARN',
  [LogLevel.ERROR]: '❌ ERROR',
  [LogLevel.NONE]: '🚫 NONE',
};

const LEVEL_COLORS: Record<LogLevel, keyof typeof COLORS> = {
  [LogLevel.DEBUG]: 'gray',
  [LogLevel.INFO]: 'blue',
  [LogLevel.SUCCESS]: 'green',
  [LogLevel.WARN]: 'yellow',
  [LogLevel.ERROR]: 'red',
  [LogLevel.NONE]: 'reset',
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format timestamp
 */
function formatTimestamp(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Format category
 */
function formatCategory(category?: string): string {
  if (!category) return '';
  return colorize(`[${category}]`, 'cyan');
}

/**
 * Format metadata as JSON
 */
function formatMetadata(metadata?: Record<string, any>): string {
  if (!metadata || Object.keys(metadata).length === 0) return '';
  
  try {
    // Compact format (single line)
    const json = JSON.stringify(metadata);
    return colorize(json, 'dim');
  } catch (error) {
    return colorize('[Unable to stringify metadata]', 'red');
  }
}

/**
 * Format error with stack trace
 */
function formatError(error: Error): string {
  const name = colorize(error.name, 'red');
  const message = colorize(error.message, 'red');
  const stack = error.stack ? colorize('\n' + error.stack, 'dim') : '';
  
  return `${name}: ${message}${stack}`;
}

// ============================================================================
// CORE LOGGER CLASS
// ============================================================================

class Logger {
  private category?: string;
  private timers: Map<string, number> = new Map();

  constructor(category?: string) {
    this.category = category;
  }

  /**
   * Check if logging is enabled for this level
   */
  private shouldLog(level: LogLevel): boolean {
    // Check if disabled in production
    if (!__DEV__ && !config.enableInProduction) {
      return false;
    }

    // Check minimum level
    if (level < config.minLevel) {
      return false;
    }

    // Check excluded categories
    if (this.category && config.excludeCategories?.includes(this.category)) {
      return false;
    }

    return true;
  }

  /**
   * Format and output log entry
   */
  private log(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Build log message
    const parts: string[] = [];

    // Timestamp
    if (config.timestamps) {
      const ts = formatTimestamp(entry.timestamp);
      parts.push(colorize(ts, 'gray'));
    }

    // Level
    const levelLabel = LEVEL_LABELS[entry.level];
    const levelColor = LEVEL_COLORS[entry.level];
    parts.push(colorize(levelLabel, levelColor));

    // Category
    if (entry.category) {
      parts.push(formatCategory(entry.category));
    }

    // Message
    parts.push(entry.message);

    // Metadata
    if (entry.metadata) {
      parts.push(formatMetadata(entry.metadata));
    }

    // Error
    if (entry.error) {
      parts.push(formatError(entry.error));
    }

    // Output to console
    const logMessage = parts.join(' ');
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }

    // Send to analytics (production only)
    if (config.sendToAnalytics && !__DEV__) {
      this.sendToAnalytics(entry);
    }
  }

  /**
   * Send log to analytics service (e.g., Firebase Analytics, Sentry)
   */
  private sendToAnalytics(entry: LogEntry) {
    // TODO: Implement analytics integration
    // Examples:
    // - Firebase Analytics: analytics().logEvent()
    // - Sentry: Sentry.captureMessage()
    // - Custom analytics service
    
    // For errors, could send to crash reporting
    if (entry.level === LogLevel.ERROR) {
      // Sentry.captureException(entry.error);
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Debug log (development only)
   */
  debug(message: string, metadata?: Record<string, any>) {
    this.log({
      level: LogLevel.DEBUG,
      category: this.category,
      message,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Info log (general information)
   */
  info(message: string, metadata?: Record<string, any>) {
    this.log({
      level: LogLevel.INFO,
      category: this.category,
      message,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Success log (successful operations)
   */
  success(message: string, metadata?: Record<string, any>) {
    this.log({
      level: LogLevel.SUCCESS,
      category: this.category,
      message,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Warning log (non-critical issues)
   */
  warn(message: string, metadata?: Record<string, any>) {
    this.log({
      level: LogLevel.WARN,
      category: this.category,
      message,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Error log (errors and exceptions)
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, any>) {
    const errorObj = error instanceof Error ? error : undefined;
    const errorMetadata = error && !(error instanceof Error) 
      ? { error: String(error), ...metadata }
      : metadata;

    this.log({
      level: LogLevel.ERROR,
      category: this.category,
      message,
      metadata: errorMetadata,
      error: errorObj,
      timestamp: new Date(),
    });
  }

  /**
   * Start performance timer
   */
  time(label: string) {
    this.timers.set(label, Date.now());
    this.debug(`⏱️  Timer started: ${label}`);
  }

  /**
   * End performance timer and log duration
   */
  timeEnd(label: string) {
    const startTime = this.timers.get(label);
    
    if (!startTime) {
      this.warn(`Timer not found: ${label}`);
      return;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);
    
    this.info(`⏱️  ${label}`, { duration: `${duration}ms` });
  }

  /**
   * Group related logs (dev only)
   */
  group(label: string) {
    if (__DEV__) {
      console.group(colorize(`📁 ${label}`, 'cyan'));
    }
  }

  /**
   * End log group
   */
  groupEnd() {
    if (__DEV__) {
      console.groupEnd();
    }
  }

  /**
   * Log table (dev only)
   */
  table(data: any) {
    if (__DEV__) {
      console.table(data);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create category-specific logger
 * 
 * @example
 * ```typescript
 * const prayerLogger = createLogger('Prayer Service');
 * prayerLogger.info('Fetching times', { date: '2025-12-23' });
 * ```
 */
export function createLogger(category: string): Logger {
  return new Logger(category);
}

// ============================================================================
// PRE-CONFIGURED LOGGERS (Convenience exports)
// ============================================================================

export const prayerLogger = createLogger('Prayer Service');
export const foodLogger = createLogger('Food Service');
export const musollahLogger = createLogger('Musollah Service');
export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const cacheLogger = createLogger('Cache');
export const notificationLogger = createLogger('Notifications');
export const widgetLogger = createLogger('Widget');
export const analyticsLogger = createLogger('Analytics');
export const storageLogger = createLogger('Storage');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Disable all logging (useful for tests)
 */
export function disableLogging() {
  configureLogger({ minLevel: LogLevel.NONE });
}

/**
 * Enable all logging
 */
export function enableLogging() {
  configureLogger({ minLevel: LogLevel.DEBUG });
}

/**
 * Set log level
 */
export function setLogLevel(level: LogLevel) {
  configureLogger({ minLevel: level });
}

/**
 * Exclude specific categories from logging
 */
export function excludeCategories(...categories: string[]) {
  configureLogger({ excludeCategories: categories });
}

/**
 * Reset to default configuration
 */
export function resetLoggerConfig() {
  config = { ...defaultConfig };
}