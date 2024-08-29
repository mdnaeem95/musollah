import React from 'react';
import { Provider } from 'react-redux';
import store from '../redux/store/store';
import RootLayout from './RootLayout'; // Adjust the path as necessary

import * as Sentry from '@sentry/react-native'

const AppLayout = () => (
  <Provider store={store}>
    <RootLayout />
  </Provider>
);

export default Sentry.wrap(AppLayout);
