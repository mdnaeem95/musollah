import React from 'react';
import { Provider } from 'react-redux';
import * as Notifications from "expo-notifications"
import { store, persistor } from '../redux/store/store';
import { NotificationProvider } from "../context/NotificationContext"
import RootLayout from './RootLayout'; // Adjust the path as necessary
import { PersistGate } from 'redux-persist/integration/react';
import LoadingScreen from '../components/LoadingScreen';
import { ThemeProvider } from '../context/ThemeContext';
import { ActionSheetProvider } from '@expo/react-native-action-sheet'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  })
})

const AppLayout = () => (
  <ActionSheetProvider>
    <ThemeProvider>
      <NotificationProvider>
        <Provider store={store}>
          <PersistGate persistor={persistor} loading={<LoadingScreen message='Setting up the app...' />}>
            <RootLayout />
          </PersistGate>
        </Provider>
      </NotificationProvider>
    </ThemeProvider>
  </ActionSheetProvider>
);

export default AppLayout;
