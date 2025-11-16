import { useState, useCallback } from 'react';

interface UsePrayerModalsReturn {
  isActionsModalVisible: boolean;
  isLocationModalVisible: boolean;
  openActionsModal: () => void;
  closeActionsModal: () => void;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  closeAllModals: () => void;
}

/**
 * Hook for managing prayer modal states
 * Implements modal visibility logic
 * 
 * Manages:
 * - Actions modal (FAB menu)
 * - Location modal (city selection)
 */
export const usePrayerModals = (): UsePrayerModalsReturn => {
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const openActionsModal = useCallback(() => {
    setIsActionsModalVisible(true);
  }, []);

  const closeActionsModal = useCallback(() => {
    setIsActionsModalVisible(false);
  }, []);

  const openLocationModal = useCallback(() => {
    // Close actions modal if open
    setIsActionsModalVisible(false);
    setIsLocationModalVisible(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setIsLocationModalVisible(false);
  }, []);

  const closeAllModals = useCallback(() => {
    setIsActionsModalVisible(false);
    setIsLocationModalVisible(false);
  }, []);

  return {
    isActionsModalVisible,
    isLocationModalVisible,
    openActionsModal,
    closeActionsModal,
    openLocationModal,
    closeLocationModal,
    closeAllModals,
  };
};