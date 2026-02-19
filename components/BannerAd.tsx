import React, { useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';
import { createLogger } from '../services/logging/logger';

const logger = createLogger('Ads');

const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-3113906121142395/6121333051';

const BannerAdComponent = () => {
  const bannerRef = useRef<BannerAd>(null);

  // Refresh the banner ad when the app comes to the foreground (iOS-specific behavior)
  useForeground(() => {
    if (Platform.OS === 'ios') {
      bannerRef.current?.load();
      logger.debug('Ad reloaded on foreground');
    }
  });

  return (
    <View style={styles.adContainer}>
      <BannerAd
        ref={bannerRef}
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true, // GDPR-compliant ads
        }}
        onAdLoaded={() => logger.info('Ad loaded')}
        onAdFailedToLoad={(error) => logger.error('Ad failed to load', error)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
});

export default BannerAdComponent;
