import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import 'expo-dev-client';
import React from 'react';
import * as Sentry from '@sentry/react-native';

export default function App() {
  Sentry.init({
    dsn: 'https://6273527f044ad3d726f911727730fdf7@o4507860915257344.ingest.us.sentry.io/4507860932034560',
    debug: true,
  })

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});