import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../redux/store/store';
import RootLayout from './RootLayout'; // Adjust the path as necessary

import * as Sentry from '@sentry/react-native'
import { useNavigationContainerRef } from 'expo-router';

const AppLayout = () => (
  <Provider store={store}>
    <RootLayout />
  </Provider>
);

export default AppLayout;
