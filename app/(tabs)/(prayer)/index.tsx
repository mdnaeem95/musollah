// app/(tabs)/(prayer)/index.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { addDays, subDays, format } from 'date-fns';
import { MotiView, AnimatePresence } from 'moti';
import { useQuery, useQueryClient } from '@tanstack/react-query';
const ErrorBoundary = require('react-native-error-boundary').default;

// Components
import PrayerActionsModal from '../../../components/prayer/PrayerActionsModal';
import { useTheme } from '../../../context/ThemeContext';
import CurrentPrayerInfo from '../../../components/prayer/CurrentPrayerInfo';
import PrayerTimesList from '../../../components/prayer/PrayerTimesList';
import PrayerLocationModal from '../../../components/prayer/PrayerLocationModal';
import CustomClock from '../../../components/prayer/CustomClock';
import PrayerTimesSkeleton from '../../../components/prayer/PrayerTimesSkeleton';

// Hooks & Services
import { usePrayerTimes } from '../../../hooks/usePrayerTimes';
import { usePrayerNotifications } from '../../../hooks/usePrayerNotifications';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { prayerService } from '../../../services/prayer.service';
import { analyticsService } from '../../../services/analytics/service';

// Types & Constants
import { DailyPrayerTimes } from '../../../utils/types/prayer.types';
import { DATE_FORMATS, CACHE_KEYS } from '../../../constants/prayer.constants';
import { scaleSize } from '../../../utils';

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,backgroundColor: theme.colors.primary }}>
      <FontAwesome6 name="exclamation-triangle" size={48} color={theme.colors.text.error} />
      <Text style={{ fontSize: 18, fontFamily: 'Outfit_600SemiBold', marginTop: 16,color: theme.colors.text.primary }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 14, fontFamily: 'Outfit_400Regular', marginTop: 8, textAlign: 'center',color: theme.colors.text.secondary }}>
        {error.message}
      </Text>
      <TouchableOpacity
        style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.secondary }}
        onPress={resetErrorBoundary}
      >
        <Text style={{ fontSize: 16, fontFamily: 'Outfit_500Medium', color: theme.colors.text.primary }}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const PrayerTab = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  // State Management
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
  const [isPrayerLocationModalVisible, setIsPrayerLocationModalVisible] = useState(false);

  // Formatted dates
  const formattedDate = useMemo(
    () => format(selectedDate, DATE_FORMATS.FIREBASE),
    [selectedDate]
  );

  // Query for prayer times with proper caching and error handling
  const {
    data: prayerData,
    isLoading,
    error,
    refetch,
  } = useQuery<DailyPrayerTimes, Error>({
    queryKey: [CACHE_KEYS.PRAYER_TIMES, formattedDate],
    queryFn: () => prayerService.fetchPrayerTimesForDate(formattedDate),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
    enabled: isOnline || !!queryClient.getQueryData([CACHE_KEYS.PRAYER_TIMES, formattedDate]),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Custom hooks for prayer functionality
  const { currentPrayer, nextPrayerInfo, backgroundImage } = usePrayerTimes(
    prayerData?.prayers || null
  );
  
  // Initialize notifications
  usePrayerNotifications(prayerData!);

  // Handle app state changes for refreshing data
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refetch();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refetch]);

  // Track screen views for analytics
  useEffect(() => {
    analyticsService.trackScreenView('PrayerTab', {
      date: formattedDate,
      isOnline,
    });
  }, [formattedDate, isOnline]);

  // Memoized handlers
  const handleDateChange = useCallback((direction: 'prev' | 'next') => {
    setSelectedDate(current => {
      const newDate = direction === 'prev' 
        ? subDays(current, 1) 
        : addDays(current, 1);
      
      // Don't allow future dates beyond tomorrow
      const tomorrow = addDays(new Date(), 1);
      if (newDate > tomorrow) return current;
      
      return newDate;
    });
  }, []);

  const handleCityPress = useCallback(() => {
    setIsActionsModalVisible(false);
    setIsPrayerLocationModalVisible(true);
  }, []);

  const prayerActions = useMemo(() => [
    {
      icon: 'compass' as const,
      label: 'Qiblat',
      onPress: () => {
        setIsActionsModalVisible(false);
        router.push('/qiblat');
      }
    },
    {
      icon: 'hands-praying' as const,
      label: 'Doa',
      onPress: () => {
        setIsActionsModalVisible(false);
        router.push('/doa');
      }
    },
    {
      icon: 'calendar-alt' as const,
      label: 'Calendar',
      onPress: () => {
        setIsActionsModalVisible(false);
        router.push('/monthlyPrayerTimes');
      }
    },
    {
      icon: 'location-dot' as const,
      label: 'Change City',
      onPress: handleCityPress
    },
    {
      icon: 'chart-simple' as const,
      label: 'Dashboard',
      onPress: () => {
        setIsActionsModalVisible(false);
        router.push('/prayerDashboard');
      }
    },
    {
      icon: 'message' as const,
      label: 'Khutbah',
      onPress: () => {
        setIsActionsModalVisible(false);
        router.push('/khutbah');
      }
    }
  ], [router, handleCityPress]);

  // Render content based on state
  const renderContent = () => {
    if (error && !prayerData) {
      throw error; // Let error boundary handle it
    }

    return (
      <AnimatePresence exitBeforeEnter>
        {isLoading && !prayerData ? (
          <PrayerTimesSkeleton key="skeleton" />
        ) : (
          <MotiView
            key={formattedDate}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'timing', duration: 250 }}
            style={styles.contentContainer}
          >
            <CurrentPrayerInfo
              currentPrayer={currentPrayer}
              nextPrayerInfo={nextPrayerInfo}
            />
            <PrayerTimesList 
              prayerTimes={prayerData?.prayers || null}
              selectedDate={selectedDate}
            />
          </MotiView>
        )}
      </AnimatePresence>
    );
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={(error: Error, stackTrace: string) => {
      console.error('Prayer Tab Error:', error, stackTrace);
      analyticsService.logError(error, { screen: 'PrayerTab' });
    }}>
      <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
        <View style={styles.mainContainer}>
          <View style={styles.centeredView}>
            <View style={styles.dateRow}>
              <TouchableOpacity
                onPress={() => handleDateChange('prev')}
              >
                <FontAwesome6 name="chevron-left" size={16} color="black" />
              </TouchableOpacity>

              <Text style={styles.dateText}>{format(selectedDate, 'd MMMM yyyy')}</Text>

              <TouchableOpacity
                onPress={() => handleDateChange('next')}
                disabled={selectedDate >= addDays(new Date(), 1)}
              >
                <FontAwesome6 
                  name="chevron-right" 
                  size={16} 
                  color={selectedDate < addDays(new Date(), 1) ? "black" : "#ccc"} 
                />
              </TouchableOpacity>
            </View>
            
            <CustomClock />
            
            {prayerData?.hijriDate && (
              <Text style={styles.islamicDateText}>
                {prayerData.hijriDate}
              </Text>
            )}
          </View>
          
          {!isOnline && (
            <View style={styles.offlineIndicator}>
              <FontAwesome6 name="wifi-slash" size={16} color={theme.colors.text.muted} />
              <Text style={styles.offlineText}>Offline Mode</Text>
            </View>
          )}
          
          {renderContent()}
        </View>

        <PrayerLocationModal
          isVisible={isPrayerLocationModalVisible}
          onClose={() => {
            setIsPrayerLocationModalVisible(false);
            refetch();
          }}
        />

        <TouchableOpacity 
          onPress={() => setIsActionsModalVisible(true)} 
          style={styles.fab}
          accessibilityLabel="Prayer actions menu"
          accessibilityRole="button"
        >
          <FontAwesome6 name="plus" size={18} color="#fff" />
        </TouchableOpacity>

        <PrayerActionsModal
          visible={isActionsModalVisible}
          onClose={() => setIsActionsModalVisible(false)}
          actions={prayerActions}
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
  centeredView: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 5 : 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(18),
    color: 'black',
    textAlign: 'center',
  },
  islamicDateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(14),
    color: 'black',
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? 5 : -10,
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
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  offlineText: {
    marginLeft: 6,
    fontSize: 12,
    color: theme.colors.text.primary,
    fontFamily: 'Outfit_500Medium',
  },
});

export default PrayerTab;