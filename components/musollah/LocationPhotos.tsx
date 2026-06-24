/**
 * LocationPhotos — community photo strip for a musollah / bidet.
 *
 * Horizontal strip of thumbnails with an "Add" tile (camera or library), and a
 * full-screen viewer with Report (flag-to-hide moderation) / Delete (own photo).
 * Adding/reporting is auth-gated via the parent's sign-in modal.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useActionSheet } from '@expo/react-native-action-sheet';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../context/ThemeContext';
import { useAccent } from '../../hooks/useAccent';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  RatingTargetType,
  LocationPhoto,
  useLocationPhotos,
  useUploadLocationPhoto,
  useFlagLocationPhoto,
  useDeleteLocationPhoto,
} from '../../api/services/musollah';

interface Props {
  type: RatingTargetType;
  locationId: string;
  onRequireSignIn: () => void;
}

export default function LocationPhotos({ type, locationId, onRequireSignIn }: Props) {
  const { theme } = useTheme();
  const { accent } = useAccent();
  const { user } = useAuthStore();
  const { showActionSheetWithOptions } = useActionSheet();

  const { data: photos = [], isLoading } = useLocationPhotos(type, locationId);
  const upload = useUploadLocationPhoto();
  const flag = useFlagLocationPhoto();
  const remove = useDeleteLocationPhoto();

  const [viewer, setViewer] = useState<LocationPhoto | null>(null);

  const pickAndUpload = useCallback(
    async (fromCamera: boolean) => {
      if (!user) return;
      try {
        const perm = fromCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Toast.show({ type: 'error', text1: 'Permission needed', text2: 'Allow photo access to add a picture.' });
          return;
        }
        const res = fromCamera
          ? await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: true });
        if (res.canceled || !res.assets?.[0]?.uri) return;

        await upload.mutateAsync({ type, id: locationId, userId: user.uid, uri: res.assets[0].uri });
        Toast.show({ type: 'success', text1: 'Photo added', text2: 'Thanks for helping the community!' });
      } catch {
        Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      }
    },
    [type, locationId, user, upload]
  );

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!user) {
      onRequireSignIn();
      return;
    }
    showActionSheetWithOptions(
      { options: ['Take Photo', 'Choose from Library', 'Cancel'], cancelButtonIndex: 2 },
      (i) => {
        if (i === 0) pickAndUpload(true);
        else if (i === 1) pickAndUpload(false);
      }
    );
  }, [user, onRequireSignIn, showActionSheetWithOptions, pickAndUpload]);

  const handleReport = useCallback(
    (photo: LocationPhoto) => {
      if (!user) {
        onRequireSignIn();
        return;
      }
      Alert.alert('Report photo', 'Report this photo as inappropriate or inaccurate?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            await flag.mutateAsync({ type, id: locationId, photoId: photo.id, userId: user.uid });
            setViewer(null);
            Toast.show({ type: 'success', text1: 'Reported', text2: 'Thanks — we’ll review it.' });
          },
        },
      ]);
    },
    [user, type, locationId, flag, onRequireSignIn]
  );

  const handleDelete = useCallback(
    (photo: LocationPhoto) => {
      Alert.alert('Delete photo', 'Remove your photo?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await remove.mutateAsync({ type, id: locationId, photoId: photo.id, storagePath: photo.storagePath });
            setViewer(null);
          },
        },
      ]);
    },
    [type, locationId, remove]
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.colors.text.primary }]}>Photos</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.addTile, { borderColor: accent }]}
          activeOpacity={0.7}
          disabled={upload.isPending}
        >
          {upload.isPending ? (
            <ActivityIndicator color={accent} />
          ) : (
            <>
              <FontAwesome6 name="camera" size={18} color={accent} />
              <Text style={[styles.addText, { color: accent }]}>Add</Text>
            </>
          )}
        </TouchableOpacity>

        {photos.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => setViewer(p)} activeOpacity={0.85}>
            <Image source={{ uri: p.url }} style={styles.thumb} />
          </TouchableOpacity>
        ))}

        {!isLoading && photos.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={[styles.empty, { color: theme.colors.text.muted }]}>
              Be the first to add a photo
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Full-screen viewer */}
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerBg}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewer(null)} hitSlop={12}>
            <FontAwesome6 name="xmark" size={22} color="#fff" />
          </TouchableOpacity>

          {viewer && <Image source={{ uri: viewer.url }} style={styles.viewerImage} resizeMode="contain" />}

          <View style={styles.viewerActions}>
            {viewer?.uploadedBy === user?.uid ? (
              <TouchableOpacity style={styles.viewerBtn} onPress={() => viewer && handleDelete(viewer)}>
                <FontAwesome6 name="trash" size={15} color="#fff" />
                <Text style={styles.viewerBtnText}>Delete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.viewerBtn} onPress={() => viewer && handleReport(viewer)}>
                <FontAwesome6 name="flag" size={15} color="#fff" />
                <Text style={styles.viewerBtnText}>Report</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const THUMB = 92;

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  heading: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', marginBottom: 10 },
  strip: { gap: 10, alignItems: 'center', paddingRight: 8 },
  addTile: {
    width: THUMB,
    height: THUMB,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addText: { fontSize: 12, fontFamily: 'Outfit_600SemiBold' },
  thumb: { width: THUMB, height: THUMB, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.05)' },
  emptyWrap: { height: THUMB, justifyContent: 'center', paddingLeft: 4 },
  empty: { fontSize: 13, fontFamily: 'Outfit_400Regular' },

  viewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 60, right: 24, zIndex: 2, padding: 6 },
  viewerImage: { width: '100%', height: '70%' },
  viewerActions: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
  viewerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  viewerBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Outfit_600SemiBold' },
});
