import * as Sentry from '@sentry/react-native';
import { useNavigationContainerRef } from 'expo-router';
import { useEffect } from 'react';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

export const initSentry = () => {
  if (!__DEV__) {
    Sentry.init({
      dsn: 'https://e606301f65d449242eb9dbea2fd17f07@o4508641454587904.ingest.de.sentry.io/4508641475166288',
      integrations: [navigationIntegration],
    });
  }
};

export const useSentryNavigationConfig = () => {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef && !__DEV__) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);
};