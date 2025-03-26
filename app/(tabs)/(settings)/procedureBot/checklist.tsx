import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../../context/ThemeContext';
import { useLocalSearchParams } from 'expo-router';

export default function ChecklistScreen() {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const viewShotRef = useRef<any>(null);
  const { theme } = useTheme();
  const { slug } = useLocalSearchParams();

  useEffect(() => {
    (async () => {
        const stored = await AsyncStorage.getItem(`checklist-${slug}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            setChecklist(parsed.messages || parsed); // support both formats
        }
  
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted');
    })();
  }, []);
  
  const saveToGallery = async () => {
    if (!viewShotRef.current) return;
    try {
      const uri = await viewShotRef.current.capture();
      if (!hasPermission) {
        Alert.alert('Permission denied', 'Please allow media access to save the checklist.');
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Rihlah Checklists', asset, false);
      Alert.alert('Saved', 'Checklist saved to gallery.');
    } catch (error) {
      console.error(error);
    }
  };

  const shareAsPDF = async () => {
    if (!viewShotRef.current) return;
    try {
      const uri = await viewShotRef.current.capture();
      const fileUri = FileSystem.documentDirectory + 'checklist.jpg';
      await FileSystem.copyAsync({ from: uri, to: fileUri });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <ScrollView>
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }}>
          <Text style={[styles.header, { color: theme.colors.text.primary }]}>Saved Checklist</Text>
          {checklist.map((item, idx) => (
            <View key={idx} style={styles.item}>
              {item.type === 'title' && <Text style={[styles.title, { color: theme.colors.text.primary }]}>{item.content}</Text>}
              {item.type === 'description' && <Text style={[styles.description, { color: theme.colors.text.secondary }]}>{item.content}</Text>}
              {item.type === 'note' && <Text style={[styles.note, { backgroundColor: theme.colors.muted }]}>{item.content}</Text>}
              {(item.type === 'criteria' || item.type === 'instructions') && (
                item.content.map((line: string, i: number) => (
                  <Text key={i} style={[styles.bullet, { color: theme.colors.text.muted }]}>• {line}</Text>
                ))
              )}
            </View>
          ))}
        </ViewShot>
      </ScrollView>
      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={saveToGallery}>
          <Text style={styles.buttonText}>Save to Device</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={shareAsPDF}>
          <Text style={styles.buttonText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    fontSize: 22,
    marginBottom: 16,
    fontFamily: 'Outfit_700Bold',
  },
  item: { marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Outfit_700Bold', marginBottom: 4 },
  description: { fontSize: 16, fontFamily: 'Outfit_400Regular', marginBottom: 4 },
  bullet: { fontSize: 16, fontFamily: 'Outfit_400Regular', marginLeft: 12 },
  note: {
    fontSize: 15,
    fontStyle: 'italic',
    padding: 10,
    borderRadius: 10,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});