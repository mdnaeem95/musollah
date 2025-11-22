import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { AnimatePresence } from 'moti';
const ErrorBoundary = require('react-native-error-boundary').default;

// Components
import PrayerActionsModal from '../../../components/prayer/PrayerActionsModal';
import { useTheme } from '../../../context/ThemeContext';
import CurrentPrayerInfo from '../../../components/prayer/CurrentPrayerInfo';
import PrayerTimesList from '../../../components/prayer/PrayerTimesList';
import PrayerLocationModal from '../../../components/prayer/PrayerLocationModal';
import CustomClock from '../../../components/prayer/CustomClock';
import PrayerTimesSkeleton from '../../../components/prayer/PrayerTimesSkeleton';
import { OfflineIndicator } from '../../../components/prayer/OfflineIndicator';
import { PrayerDateSelector } from '../../../components/prayer/PrayerDateSelector';
import { PrayerErrorFallback } from '../../../components/prayer/PrayerErrorFallback';

// Hooks
import { usePrayerTimesOptimized } from '../../../hooks/prayer/usePrayerTimesOptimized';
import { usePrayerNotifications } from '../../../hooks/prayer/usePrayerNotifications';
import { usePrayerDateNavigation } from '../../../hooks/prayer/usePrayerDateNavigation';
import { usePrayerModals } from '../../../hooks/prayer/usePrayerModals';
import { usePrayerActions } from '../../../hooks/prayer/usePrayerActions';
import { usePrayerQuery } from '../../../hooks/prayer/usePrayerQuery';
import { analyticsService } from '../../../services/analytics/service';
import { formatIslamicDateResponseSingapore, useTodayIslamicDate } from '../../../api/services/prayer';

const PrayerTab: React.FC = () => {
  const { theme } = useTheme();  // Keep this as is!
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: islamicDateData } = useTodayIslamicDate();

  // Date navigation hook
  const dateNavigation = usePrayerDateNavigation();

  // Modal management hook
  const modals = usePrayerModals();

  // Prayer actions hook
  const actions = usePrayerActions({
    onLocationPress: modals.openLocationModal,
    onActionComplete: modals.closeActionsModal,
  });

  const handleSuccess = useCallback((data: any) => {
    console.log('✅ Prayer data loaded:', dateNavigation.formattedDate);
  }, [dateNavigation.formattedDate]);

  const handleError = useCallback((err: Error) => {
    console.error('❌ Prayer data error:', err);
    analyticsService.logError(err, { screen: 'PrayerTab' });
  }, []); // Empty deps - analyticsService is stable

  // Data fetching with React Query
  const {
    data: prayerData,
    isLoading,
    error,
    refetch,
    isOffline,
    usingStaleData,
  } = usePrayerQuery({
    date: dateNavigation.formattedDate,
    onSuccess: handleSuccess,
    onError: handleError,  
  });

  // Calculate prayer times
  const { currentPrayer, nextPrayerInfo, backgroundImage } = usePrayerTimesOptimized(
    prayerData?.prayers || null
  );

  // Initialize notifications
  usePrayerNotifications(prayerData || null);

  // Track analytics
  useEffect(() => {
    analyticsService.trackScreenView('PrayerTab', {
      date: dateNavigation.formattedDate,
      isOnline: !isOffline,
    });
  }, [dateNavigation.formattedDate]);

  // Handle location modal close with refetch
  const handleLocationModalClose = useCallback(() => {
    modals.closeLocationModal();
    refetch();
  }, [modals, refetch]);

  const renderContent = () => {
    // ✅ SIMPLIFIED loading check
    if (isLoading) {
      return <PrayerTimesSkeleton key="skeleton" />;
    }

    // ✅ Show error state if no data after loading
    if (!prayerData && !isLoading) {
      return (
        <View style={styles.contentContainer}>
          <PrayerErrorFallback
            error={error || new Error('No prayer data available')}
            resetError={refetch}
            isOffline={isOffline}
          />
        </View>
      );
    }

    return (
      <AnimatePresence exitBeforeEnter>
        <View key={dateNavigation.formattedDate} style={styles.contentContainer}>
          <CurrentPrayerInfo
            currentPrayer={currentPrayer}
            nextPrayerInfo={nextPrayerInfo}
          />
          <PrayerTimesList
            prayerTimes={prayerData?.prayers || null}
            selectedDate={dateNavigation.selectedDate}
          />
        </View>
      </AnimatePresence>
    );
  };

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }: any) => (
        <PrayerErrorFallback
          error={error}
          resetError={resetErrorBoundary}
          isOffline={isOffline}
        />
      )}
      onError={(error: Error, stackTrace: string) => {
        console.error('Prayer Tab Error:', error, stackTrace);
        analyticsService.logError(error, { screen: 'PrayerTab' });
      }}
    >
      <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
        <View style={styles.mainContainer}>
          {/* Date selector */}
          <View style={styles.header}>
            <PrayerDateSelector
              selectedDate={dateNavigation.selectedDate}
              onPrevious={dateNavigation.goToPrevDay}
              onNext={dateNavigation.goToNextDay}
              canGoNext={dateNavigation.canGoNext}
              canGoPrev={dateNavigation.canGoPrev}
              hijriDate={islamicDateData ? formatIslamicDateResponseSingapore(islamicDateData) : undefined}
            />

            <CustomClock />
          </View>

          {/* Offline indicator */}
          {(isOffline || usingStaleData) && (
            <OfflineIndicator usingStaleData={usingStaleData} />
          )}

          {/* Prayer times content */}
          {renderContent()}
        </View>

        {/* Location modal */}
        <PrayerLocationModal
          isVisible={modals.isLocationModalVisible}
          onClose={handleLocationModalClose}
        />

        {/* FAB button */}
        <TouchableOpacity
          onPress={modals.openActionsModal}
          style={styles.fab}
          accessibilityLabel="Prayer actions menu"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <FontAwesome6 name="plus" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Actions modal */}
        <PrayerActionsModal
          visible={modals.isActionsModalVisible}
          onClose={modals.closeActionsModal}
          actions={actions}
        />
      </ImageBackground>
    </ErrorBoundary>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 15,
    right: 20,
    backgroundColor: theme.colors.fab.background,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default PrayerTab;