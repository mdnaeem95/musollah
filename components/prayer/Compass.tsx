import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    Vibration,
    Animated,
    ActivityIndicator,
    Alert,
  } from 'react-native';
  import React, { useEffect, useRef, useState } from 'react';
  import useCompass from '../../hooks/useCompass';
  import { useTheme } from '../../context/ThemeContext';
  
  const screenWidth = Dimensions.get('window').width;
  const compassSize = screenWidth * 0.8;
  const vibrationDebounce = 1000;
  
  const Compass = () => {
    const { theme } = useTheme();
    const { userHeading, qiblaAzimuth, loading, error } = useCompass();
    const [bgColor] = useState(new Animated.Value(0));
    const kaabahScale = useRef(new Animated.Value(1)).current;
    const arrowRotation = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      if (userHeading === null || qiblaAzimuth === null) return;
  
      const angle = qiblaAzimuth - userHeading;
      Animated.timing(arrowRotation, {
        toValue: angle,
        duration: 300,
        useNativeDriver: true,
      }).start();
  
      const proximityToQibla = Math.abs(angle % 360);
      const isClose = proximityToQibla < 5 || proximityToQibla > 355;
  
      if (isClose) {
        Vibration.vibrate(vibrationDebounce);
        Animated.loop(
          Animated.sequence([
            Animated.timing(kaabahScale, {
              toValue: 1.15,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(kaabahScale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ).start();
      }
  
      Animated.timing(bgColor, {
        toValue: isClose ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }, [userHeading, qiblaAzimuth]);
  
    const interpolateColor = bgColor.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.accent, theme.colors.secondary],
    });
  
    if (error) {
      Alert.alert('Compass Error', error);
    }
  
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.text.muted} />
            <Text style={[styles.loadingText, { color: theme.colors.text.muted }]}>
              Calibrating Compass...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.qiblatText,
                  {
                    color: theme.colors.text.primary,
                  },
                ]}
              >
                Your heading: {Math.round(userHeading!)}°
              </Text>
              <Text
                style={[
                  styles.qiblatText,
                  {
                    color: theme.colors.text.primary,
                  },
                ]}
              >
                Qibla heading: {Math.round(qiblaAzimuth!)}°
              </Text>
              <Text
                style={[
                  styles.qiblatText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                When the arrow points to the Kaabah, you’re facing Qiblah.
              </Text>
            </View>
  
            <View style={styles.compassContainer}>
              <Animated.View
                style={[
                  styles.compassCircle,
                  { backgroundColor: interpolateColor },
                ]}
              >
                <Animated.Image
                  source={require('../../assets/kaabah.png')}
                  style={[
                    styles.kaabahIcon,
                    { transform: [{ scale: kaabahScale }] },
                  ]}
                />
                <Animated.Image
                  source={require('../../assets/arrow-up.png')}
                  style={[
                    styles.compassArrow,
                    {
                      transform: [
                        {
                          rotate: arrowRotation.interpolate({
                            inputRange: [-360, 360],
                            outputRange: ['-360deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            </View>
          </>
        )}
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    mainContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
    },
    textContainer: {
      alignItems: 'center',
      gap: 10,
    },
    qiblatText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 18,
      lineHeight: 21,
      textAlign: 'center',
    },
    compassContainer: {
      top: 150,
      justifyContent: 'center',
      alignItems: 'center',
    },
    compassCircle: {
      width: compassSize,
      height: compassSize,
      borderRadius: compassSize / 2,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    kaabahIcon: {
      position: 'absolute',
      top: -120,
      left: 115,
      height: 90,
      width: 90,
      resizeMode: 'contain',
    },
    compassArrow: {
      height: 80,
      width: 80,
      resizeMode: 'contain',
    },
  });
  
  export default Compass;
  