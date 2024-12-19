import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { store, persistor } from '../redux/store/store';
import LoadingScreen from '../components/LoadingScreen';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../utils/toastConfig';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ActionSheetProvider>
      <ThemeProvider>
        <NotificationProvider>
          <ReduxProvider store={store}>
            <PersistGate
              persistor={persistor}
              loading={<LoadingScreen message="Setting up the app..." />}
            >
              {children}
              <Toast config={toastConfig} />
            </PersistGate>
          </ReduxProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ActionSheetProvider>
  );
};

export default AppProviders;
