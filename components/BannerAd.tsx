import React, { useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-3113906121142395/6121333051';

const BannerAdComponent = () => {
  const bannerRef = useRef<BannerAd>(null);

  // Refresh the banner ad when the app comes to the foreground (iOS-specific behavior)
  useForeground(() => {
    if (Platform.OS === 'ios') {
      bannerRef.current?.load();
      console.log('Ad reloaded on foreground');
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
        onAdLoaded={() => console.log('Ad Loaded')}
        onAdFailedToLoad={(error) => console.error('Ad Failed to Load', error)}
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
