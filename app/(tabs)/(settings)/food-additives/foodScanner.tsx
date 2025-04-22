import React from 'react';
import {
  View, Text, StyleSheet, Image, ActivityIndicator, Alert,
  TouchableOpacity, Modal, FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import { FAB } from '@rneui/base';
import { useTheme } from '../../../../context/ThemeContext';
import { AnimatedIngredientCard } from '../../../../components/foodScanner/AnimatedIngredientCard';

const ScannerScreen = () => {
  const { theme } = useTheme();
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [ingredients, setIngredients] = React.useState<any[]>([]);
  const [overallStatus, setOverallStatus] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [photoOptionsVisible, setPhotoOptionsVisible] = React.useState(false);

  const handleScan = async (base64Image: string) => {
    setIsLoading(true);
    setIngredients([]);
    setOverallStatus(null);

    try {
      const response = await axios.post('https://your-backend.com/api/scan-ingredients', {
        image: base64Image,
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
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Image = asset.base64;
      const uri = asset.uri;

      if (base64Image && uri) {
        setImageUri(uri);
        handleScan(base64Image);
      } else {
        Alert.alert('Error', 'Failed to retrieve image data.');
      }
    }
  };

  const handleTakePhoto = async () => {
    setPhotoOptionsVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Image = asset.base64;
      const uri = asset.uri;

      if (base64Image && uri) {
        setImageUri(uri);
        handleScan(base64Image);
      } else {
        Alert.alert('Error', 'Failed to retrieve image data.');
      }
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
        <FlatList
          style={styles.results}
          data={ingredients}
          keyExtractor={(item, index) => item.name + index}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.statusHeader, { color: getStatusColor(overallStatus || '') }]}>
              Overall: {overallStatus}
            </Text>
          }
          renderItem={({ item, index }) => (
            <AnimatedIngredientCard ingredient={item} index={index} theme={theme} />
          )}
        />
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
  statusHeader: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
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