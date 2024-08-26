import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import React from 'react';

interface ModuleContentProps {
  moduleData: {
    title: string;
    data: string;
  };
}

const ModuleContent = ({ moduleData }: ModuleContentProps) => {
  if (!moduleData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{moduleData.title}</Text>
        <Text style={styles.content}>{moduleData.data}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333', // Adjust as per your theme
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555', // Adjust as per your theme
  },
});

export default ModuleContent;
