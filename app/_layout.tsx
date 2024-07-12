// app/(tabs)/_layout.tsx
import React from 'react';
import { Provider } from 'react-redux';
import store from '../redux/store/store';
import RootLayout from './RootLayout'; // Adjust the path as necessary

const AppLayout = () => (
  <Provider store={store}>
    <RootLayout />
  </Provider>
);

export default AppLayout;
