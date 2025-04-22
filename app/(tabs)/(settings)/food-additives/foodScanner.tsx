import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, ActivityIndicator, Alert,
  TouchableOpacity, Modal, Dimensions,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import { FAB } from '@rneui/base';
import { useTheme } from '../../../../context/ThemeContext';

const screenHeight = Dimensions.get('window').height;

const ScannerScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [overallStatus, setOverallStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoOptionsVisible, setPhotoOptionsVisible] = useState(false);

  const handleScan = async (uri: string) => {
    setIsLoading(true);
    setIngredients([]);
    setOverallStatus(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: 'image.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await axios.post('https://your-backend.com/api/scan-ingredients', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIngredients(response.data.ingredients);
      setOverallStatus(response.data.overallStatus);
    } catch (error) {
      console.error(error);
      Alert.alert('Scan Failed', 'Unable to analyze the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    setPhotoOptionsVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      handleScan(uri);
    }
  };

  const handleTakePhoto = async () => {
    setPhotoOptionsVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      handleScan(uri);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ok': return theme.colors.text.success;
      case 'caution': return theme.colors.accent;
      case 'avoid': return theme.colors.text.error;
      default: return theme.colors.text.muted;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      )}

      {isLoading && <ActivityIndicator size="large" color={theme.colors.text.primary} style={{ marginTop: 16 }} />}

      {!isLoading && ingredients.length > 0 && (
        <View style={styles.results}>
          <Text style={[styles.statusHeader, { color: getStatusColor(overallStatus || '') }]}>
            Overall: {overallStatus}
          </Text>

          {ingredients.map((ing, index) => (
            <View
              key={index}
              style={[styles.ingredientCard, { backgroundColor: theme.colors.secondary }]}
            >
              <Text style={[styles.ingredientName, { color: theme.colors.text.primary }]}>
                {ing.name}
              </Text>
              <Text style={{ color: getStatusColor(ing.status), fontWeight: 'bold' }}>
                {ing.status}
              </Text>
              {ing.description && (
                <Text style={[styles.ingredientDesc, { color: theme.colors.text.secondary }]}>
                  {ing.description}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <FAB
        placement="right"
        color={theme.colors.secondary}
        icon={{ name: 'camera-alt', type: 'material', color: theme.colors.text.primary }}
        onPress={() => setPhotoOptionsVisible(true)}
      />

      <Modal
        transparent
        visible={photoOptionsVisible}
        animationType="fade"
        onRequestClose={() => setPhotoOptionsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setPhotoOptionsVisible(false)}
          activeOpacity={1}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.secondary }]}>
            <Text style={styles.modalSheetTitle}>Scan Ingredient Label</Text>

            <TouchableOpacity style={styles.modalSheetOption} onPress={handleTakePhoto}>
              <FontAwesome name="camera" size={20} color={theme.colors.text.primary} />
              <Text style={styles.modalSheetOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalSheetOption} onPress={handleChooseFromLibrary}>
              <FontAwesome name="image" size={20} color={theme.colors.text.primary} />
              <Text style={styles.modalSheetOptionText}>Choose From Library</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalSheetOption, { marginTop: 10 }]} onPress={() => setPhotoOptionsVisible(false)}>
              <Text style={styles.modalSheetOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  imagePreview: { width: '100%', height: 300, borderRadius: 16, marginBottom: 20 },
  results: { marginTop: 24 },
  ingredientCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({ ios: { shadowOpacity: 0.1 }, android: { elevation: 3 } }),
  },
  ingredientName: { fontSize: 18 },
  ingredientDesc: { marginTop: 6, fontSize: 13 },
  statusHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    marginBottom: 15,
  },
  modalSheetOption: {
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  modalSheetOptionText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
});

export default ScannerScreen;