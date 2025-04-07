import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  socials: Record<string, string>;
}

const iconMap: Record<string, any> = {
  facebook: 'facebook',
  instagram: 'instagram',
  tiktok: 'tiktok',
  number: 'phone',
};

const SocialIcons: React.FC<Props> = ({ socials }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const { theme } = useTheme();

  const handlePhone = (number: string) => {
    const options = ['Call', 'Cancel'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 1,
        title: `Call ${number}`,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          Linking.openURL(`tel:${number}`);
        }
      }
    );
  };

  const handlePress = (platform: string, url: string) => {
    if (platform === 'number') {
      handlePhone(url);
    } else {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) Linking.openURL(url);
          else Alert.alert('Error', 'Unable to open this link.');
        })
        .catch(() => Alert.alert('Error', 'Unable to open this link.'));
    }
  };

  return (
    <View style={styles.container}>
      {Object.entries(socials).map(([platform, link], index) => (
        <MotiView
          key={platform}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: index * 80 }}
        >
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.colors.secondary }]}
            onPress={() => handlePress(platform, link)}
          >
            <FontAwesome6 name={iconMap[platform]} size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </MotiView>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SocialIcons;
