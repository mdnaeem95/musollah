/**
 * Prayer Modals Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: State transition tracking and debugging
 * 
 * Manages prayer modal states (actions menu, location selector).
 * Uses single state to prevent race conditions.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Prayer Modals');

// ============================================================================
// TYPES
// ============================================================================

type ActiveModal = 'none' | 'actions' | 'location';

interface UsePrayerModalsReturn {
  isActionsModalVisible: boolean;
  isLocationModalVisible: boolean;
  openActionsModal: () => void;
  closeActionsModal: () => void;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  closeAllModals: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing prayer modal states
 * Uses single state to prevent race conditions
 * 
 * @returns {UsePrayerModalsReturn} Modal visibility flags and control functions
 * 
 * @example
 * ```tsx
 * const {
 *   isActionsModalVisible,
 *   isLocationModalVisible,
 *   openActionsModal,
 *   closeActionsModal,
 *   openLocationModal,
 *   closeLocationModal,
 * } = usePrayerModals();
 * 
 * <Modal visible={isActionsModalVisible} onClose={closeActionsModal} />
 * <Modal visible={isLocationModalVisible} onClose={closeLocationModal} />
 * ```
 */
export const usePrayerModals = (): UsePrayerModalsReturn => {
  // ✅ Single source of truth - only one modal can be active
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Prayer modals hook mounted', {
      initialState: activeModal,
    });
    
    return () => {
      logger.debug('Prayer modals hook unmounted', {
        finalState: activeModal,
      });
    };
  }, []);

  // ✅ Log state changes
  useEffect(() => {
    if (activeModal !== 'none') {
      logger.debug('Modal state changed', {
        activeModal,
        isActionsVisible: activeModal === 'actions',
        isLocationVisible: activeModal === 'location',
      });
    }
  }, [activeModal]);

  // ✅ Actions modal controls with logging
  const openActionsModal = useCallback(() => {
    setActiveModal((prev) => {
      logger.info('Opening actions modal', { previousState: prev });
      return 'actions';
    });
  }, []);

  const closeActionsModal = useCallback(() => {
    setActiveModal((current) => {
      if (current === 'actions') {
        logger.info('Closing actions modal');
        return 'none';
      }

      // If we’re here, it's definitely not 'actions'
      logger.debug('Attempted to close actions modal when not active', {
        currentState: current,
      });

      return current;
    });
  }, []);


  // ✅ Location modal controls with logging
  const openLocationModal = useCallback(() => {
    setActiveModal((prev) => {
      logger.info('Opening location modal', {
        previousState: prev,
        switchingFromActions: prev === 'actions',
      });
      return 'location';
    });
  }, []);

  const closeLocationModal = useCallback(() => {
    setActiveModal((current) => {
      if (current === 'location') {
        logger.info('Closing location modal');
        return 'none';
      }

      logger.debug('Attempted to close location modal when not active', {
        currentState: current,
      });

      return current;
    });
  }, []);

  // ✅ Close all with logging
  const closeAllModals = useCallback(() => {
    setActiveModal((prev) => {
      logger.info('Closing all modals', {
        previousState: prev,
        hadActiveModal: prev !== 'none',
      });
      return 'none';
    });
  }, []);

  // Derive boolean states from single source
  const isActionsModalVisible = activeModal === 'actions';
  const isLocationModalVisible = activeModal === 'location';

  return useMemo(() => ({
    isActionsModalVisible,
    isLocationModalVisible,
    openActionsModal,
    closeActionsModal,
    openLocationModal,
    closeLocationModal,
    closeAllModals,
  }), [
    isActionsModalVisible,
    isLocationModalVisible,
    openActionsModal,
    closeActionsModal,
    openLocationModal,
    closeLocationModal,
    closeAllModals,
  ]);
};