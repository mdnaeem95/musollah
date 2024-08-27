import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import React from 'react';
import { ModuleData } from '../../../../../../redux/slices/dashboardSlice';

interface ModuleContentProps {
  moduleData: ModuleData;
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
        {moduleData.content.map((contentItem, index) => (
          <View key={index} style={styles.contentItem}>
            <Text style={styles.contentTitle}>{contentItem.title}</Text>
            <Text style={styles.content}>{contentItem.data}</Text>
          </View>
        ))}
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
  contentItem: {
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555', // Adjust as per your theme
  },
});

export default ModuleContent;
