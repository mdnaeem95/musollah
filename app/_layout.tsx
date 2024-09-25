import React from 'react';
import { Provider } from 'react-redux';
import * as Notifications from "expo-notifications"
import { store, persistor } from '../redux/store/store';
import { NotificationProvider } from "../context/NotificationContext"
import RootLayout from './RootLayout'; // Adjust the path as necessary
import { PersistGate } from 'redux-persist/integration/react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  })
})

const AppLayout = () => (
  <NotificationProvider>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <RootLayout />
      </PersistGate>
    </Provider>
  </NotificationProvider>
);

export default AppLayout;
