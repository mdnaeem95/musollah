import React from 'react';
import AppProviders from '../providers/AppProviders';
import RootLayout from './RootLayout';

const AppLayout = () => (
  <AppProviders>
    <RootLayout />
  </AppProviders>
);

export default AppLayout;
