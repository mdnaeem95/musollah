import React from 'react';
import { Provider } from 'react-redux';
import store from '../redux/store/store';
import RootLayout from './RootLayout'; // Adjust the path as necessary

import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: 'https://6273527f044ad3d726f911727730fdf7@o4507860915257344.ingest.us.sentry.io/4507860932034560',
  debug: true,
})

const AppLayout = () => (
  
  <Provider store={store}>
    <RootLayout />
  </Provider>
);

export default Sentry.wrap(AppLayout);
