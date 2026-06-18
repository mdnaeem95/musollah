import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
const ErrorBoundary = require('react-native-error-boundary').default;

// Components
import SkyBackground from '../../../components/prayer/SkyBackground';
import PrayerActionsModal from '../../../components/prayer/PrayerActionsModal';
import { useTheme } from '../../../context/ThemeContext';
import PrayerTimesList from '../../../components/prayer/PrayerTimesList';
import PrayerLocationModal from '../../../components/prayer/PrayerLocationModal';
import CustomClock from '../../../components/prayer/CustomClock';
import PrayerTimesSkeleton from '../../../components/prayer/PrayerTimesSkeleton';
import { PrayerDateSelector } from '../../../components/prayer/PrayerDateSelector';
import { PrayerErrorFallback } from '../../../components/prayer/PrayerErrorFallback';
import { LocationDisplay } from '../../../components/prayer/LocationDisplay';

import { NextPrayerHero } from '../../../components/prayer/NextPrayerHero';

// Hooks & Services
import { usePrayerTimesOptimized } from '../../../hooks/prayer/usePrayerTimesOptimized';
import { usePrayerNotifications } from '../../../hooks/prayer/usePrayerNotifications';
import { usePrayerDateNavigation } from '../../../hooks/prayer/usePrayerDateNavigation';
import { usePrayerModals } from '../../../hooks/prayer/usePrayerModals';
import { usePrayerActions } from '../../../hooks/prayer/usePrayerActions';
import { analyticsService } from '../../../services/analytics/service';
import { createLogger } from '../../../services/logging/logger';
import { useLocationStore } from '../../../stores/useLocationStore';
import { useCoordinates } from '../../../stores/useLocationStore';

// API
import { usePrayerTimesByDate, useTodayIslamicDate, useTodayPrayerTimes, formatIslamicDate } from '../../../api/services/prayer';

const logger = createLogger('Prayer Tab');

const PrayerTab: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Get user location (convert undefined to null for API compatibility)
  const coordinates = useCoordinates(); 

  // Date navigation hook with location for prefetching
  const dateNavigation = usePrayerDateNavigation(coordinates);

  // Islamic date
  const { data: islamicDateData } = useTodayIslamicDate();

  // Modal management hook
  const modals = usePrayerModals();

  // Prayer actions hook
  const actions = usePrayerActions({
    onLocationPress: modals.openLocationModal,
    onActionComplete: modals.closeActionsModal,
  });

  // Determine if we're viewing today or a specific date
  const isToday = dateNavigation.formattedDate === new Date().toISOString().split('T')[0];

  // Fetch prayer times using new API
  const todayQuery = useTodayPrayerTimes(coordinates);
  const dateQuery = usePrayerTimesByDate(coordinates, dateNavigation.selectedDate);

  // Use the appropriate query based on date selection
  const { data: prayerData, isLoading, error, refetch } = isToday ? todayQuery : dateQuery;

  // Calculate prayer times with new structure
  const { currentPrayer, nextPrayerInfo } = usePrayerTimesOptimized(prayerData || null);

  // Initialize notifications
  usePrayerNotifications(prayerData || null);

  // Track analytics
  useEffect(() => {
    analyticsService.trackScreenView('PrayerTab', {
      date: dateNavigation.formattedDate,
    });
  }, [dateNavigation.formattedDate]);

  // Handle location modal close with refetch
  const handleLocationModalClose = useCallback(() => {
    modals.closeLocationModal();
    refetch();
  }, [modals.closeLocationModal, refetch]);

  // Render prayer times content
  const renderContent = () => {
    // Show data if available
    if (prayerData) {
      logger.info('Rendering prayer data for:', dateNavigation.formattedDate);
      
      // Convert flat structure to Record for PrayerTimesList
      const prayerTimesRecord = {
        Subuh: prayerData.subuh,
        Syuruk: prayerData.syuruk,
        Zohor: prayerData.zohor,
        Asar: prayerData.asar,
        Maghrib: prayerData.maghrib,
        Isyak: prayerData.isyak,
      };
      
      return (
        <View key={dateNavigation.formattedDate} style={styles.contentContainer}>
          <PrayerTimesList
            prayerTimes={prayerTimesRecord}
            selectedDate={dateNavigation.selectedDate}
            currentPrayer={currentPrayer}
            nextPrayerInfo={nextPrayerInfo ? {
              nextPrayer: nextPrayerInfo.prayer,
              timeUntilNextPrayer: nextPrayerInfo.timeUntil,
            } : null}
          />
        </View>
      );
    }

    // Show skeleton if loading
    if (isLoading) {
      logger.debug('Loading initial data...');
      return <PrayerTimesSkeleton key="skeleton" />;
    }

    // Show error if we have error AND no data
    if (error) {
      logger.error('Error with no cached data');
      return (
        <View style={styles.contentContainer}>
          <PrayerErrorFallback
            error={error}
            resetError={refetch}
            isOffline={false}
          />
        </View>
      );
    }

    // Fallback
    logger.warn('No data, no loading, no error - unexpected state');
    return <PrayerTimesSkeleton key="skeleton-fallback" />;
  };

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }: any) => (
        <PrayerErrorFallback
          error={error}
          resetError={resetErrorBoundary}
          isOffline={false}
        />
      )}
      onError={(error: Error, stackTrace: string) => {
        logger.error('Prayer Tab Error:', error);
        analyticsService.logError(error, { screen: 'PrayerTab' });
      }}
    >
      <SkyBackground prayerTimes={prayerData ?? null}>
        <View style={styles.mainContainer}>
          {/* Date selector */}
          <View style={styles.header}>
            <PrayerDateSelector
              selectedDate={dateNavigation.selectedDate}
              onPrevious={dateNavigation.goToPrevDay}
              onNext={dateNavigation.goToNextDay}
              canGoNext={dateNavigation.canGoNext}
              canGoPrev={dateNavigation.canGoPrev}
              hijriDate={islamicDateData?.hijri ? formatIslamicDate({
                day: islamicDateData.hijri.day,
                month: islamicDateData.hijri.month,
                year: islamicDateData.hijri.year,
              }) : undefined}
            />

            <CustomClock />
            <LocationDisplay />
          </View>

          {/* Next prayer hero (phase-aware focal point) */}
          {isToday && nextPrayerInfo && (
            <NextPrayerHero
              prayerData={prayerData ?? null}
              nextPrayer={nextPrayerInfo.prayer}
              timeUntil={nextPrayerInfo.timeUntil}
            />
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
      </SkyBackground>
    </ErrorBoundary>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 52,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
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