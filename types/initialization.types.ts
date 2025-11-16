/**
 * Initialization system types
 * Following Interface Segregation Principle
 */

export enum InitializationPhase {
  IDLE = 'idle',
  STORAGE_MIGRATION = 'storage_migration',
  CRITICAL_SETUP = 'critical_setup',
  READY = 'ready',
  ERROR = 'error',
}

export interface InitializationStep {
  id: string;
  label: string;
  weight: number; // For progress calculation (0-1)
  critical: boolean; // Blocks app startup if true
}

export interface InitializationState {
  phase: InitializationPhase;
  completedSteps: Set<string>;
  totalProgress: number; // 0-100
  currentStep: InitializationStep | null;
  error: Error | null;
}

export interface InitializationHook {
  isComplete: boolean;
  error: Error | null;
  execute: () => Promise<void>;
}

export interface InitializationConfig {
  skipNonCritical?: boolean;
  enableDebugLogging?: boolean;
  timeoutMs?: number;
}

// Step definitions
export const INITIALIZATION_STEPS: Record<string, InitializationStep> = {
  STORAGE_MIGRATION: {
    id: 'storage_migration',
    label: 'Optimizing storage',
    weight: 0.15,
    critical: true,
  },
  FONT_LOADING: {
    id: 'font_loading',
    label: 'Loading fonts',
    weight: 0.1,
    critical: true,
  },
  AUTH_SETUP: {
    id: 'auth_setup',
    label: 'Setting up authentication',
    weight: 0.1,
    critical: true,
  },
  ADMOB_INIT: {
    id: 'admob_init',
    label: 'Initializing ads',
    weight: 0.1,
    critical: false,
  },
  ESSENTIAL_DATA: {
    id: 'essential_data',
    label: 'Loading prayer times',
    weight: 0.35,
    critical: true,
  },
  PUSH_NOTIFICATIONS: {
    id: 'push_notifications',
    label: 'Setting up notifications',
    weight: 0.1,
    critical: false,
  },
  NON_ESSENTIAL_DATA: {
    id: 'non_essential_data',
    label: 'Loading content',
    weight: 0.1,
    critical: false,
  },
};