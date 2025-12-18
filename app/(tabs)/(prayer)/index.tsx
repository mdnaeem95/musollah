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
import { LocationDisplay } from '../../../components/prayer/LocationDisplay';

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
  const { closeLocationModal } = modals;

  const handleLocationModalClose = useCallback(() => {
    closeLocationModal();
    refetch();
  }, [closeLocationModal, refetch]);

  const renderContent = () => {
    // Show data if available
    if (prayerData) {
      console.log('✅ Rendering prayer data for:', dateNavigation.formattedDate);
      return (
        <View key={dateNavigation.formattedDate} style={styles.contentContainer}>
          <PrayerTimesList
            prayerTimes={prayerData.prayers}
            selectedDate={dateNavigation.selectedDate}
            currentPrayer={currentPrayer}
            nextPrayerInfo={nextPrayerInfo}
          />
        </View>
      );
    }

    // Show skeleton if loading
    if (isLoading) {
      console.log('🔄 Loading initial data...');
      return <PrayerTimesSkeleton key="skeleton" />;
    }

    // Show error if we have error AND no data
    if (error) {
      console.log('❌ Error with no cached data');
      return (
        <View style={styles.contentContainer}>
          <PrayerErrorFallback
            error={error}
            resetError={refetch}
            isOffline={isOffline}
          />
        </View>
      );
    }

    // Fallback
    console.warn('⚠️ No data, no loading, no error - unexpected state');
    return <PrayerTimesSkeleton key="skeleton-fallback" />;
  };

  // Debug logging for data flow
  useEffect(() => {
    console.log('📊 Prayer UI State:', {
      date: dateNavigation.formattedDate,
      isLoading,
      hasData: !!prayerData,
      hasPrayers: !!prayerData?.prayers,
      prayerCount: prayerData?.prayers ? Object.keys(prayerData.prayers).length : 0,
    });
  }, [dateNavigation.formattedDate, isLoading, prayerData]);

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
            <LocationDisplay />
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
    justifyContent: 'flex-start', // ✅ Changed from 'center'
    alignItems: 'center',
    paddingTop: 60, // ✅ Add top padding for status bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 20, // ✅ Add spacing below header section
    gap: 12, // ✅ Add gap between header items (Date, Clock, Location)
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8, // ✅ Small padding above prayer list
  },
  fab: {
    position: 'absolute',
    bottom: 20, // ✅ Moved up to avoid tab bar overlap
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