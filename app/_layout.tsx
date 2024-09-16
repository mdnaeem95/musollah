import React from 'react';
import { Provider } from 'react-redux';
import * as Notifications from "expo-notifications"
import store from '../redux/store/store';
import { NotificationProvider } from "../context/NotificationContext"
import RootLayout from './RootLayout'; // Adjust the path as necessary

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
      <RootLayout />
    </Provider>
  </NotificationProvider>
);

export default AppLayout;
