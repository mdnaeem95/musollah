import * as Sentry from '@sentry/react-native';
import { useNavigationContainerRef } from 'expo-router';
import { useEffect } from 'react';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

export const initSentry = () => {
    Sentry.init({
        enabled: !__DEV__,
        dsn: 'https://e606301f65d449242eb9dbea2fd17f07@o4508641454587904.ingest.de.sentry.io/4508641475166288',
        integrations: [navigationIntegration],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
    });
};

export const useSentryNavigationConfig = () => {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef && !__DEV__) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);
};