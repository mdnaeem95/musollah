import { useState, useCallback, useMemo } from 'react';

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

/**
 * Hook for managing prayer modal states
 * Uses single state to prevent race conditions
 */
export const usePrayerModals = (): UsePrayerModalsReturn => {
  // ✅ Single source of truth - only one modal can be active
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  const openActionsModal = useCallback(() => {
    setActiveModal('actions');
  }, []);

  const closeActionsModal = useCallback(() => {
    setActiveModal((current) => {
      // ✅ Only close if actions is currently active
      return current === 'actions' ? 'none' : current;
    });
  }, []);

  const openLocationModal = useCallback(() => {
    // ✅ Directly switch to location modal
    setActiveModal('location');
  }, []);

  const closeLocationModal = useCallback(() => {
    setActiveModal((current) => {
      // ✅ Only close if location is currently active
      return current === 'location' ? 'none' : current;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setActiveModal('none');
  }, []);

  // ✅ Derive boolean states from single source
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