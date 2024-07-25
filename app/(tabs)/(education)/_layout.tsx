import React from 'react';
import { Stack } from 'expo-router';

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="physicalclasses/index" options={{ title: 'Physical Classes', headerShown: false }} />
    </Stack>
  );
};

export default Layout;