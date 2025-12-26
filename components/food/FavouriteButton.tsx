import React from 'react';
import { TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

interface FavoriteButtonProps {
  isFavorited: boolean; // Pass the current favorite status
  onToggle?: () => void; // Optional callback
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorited,
  onToggle,
}) => {
  return (
    <TouchableOpacity onPress={onToggle}>
      <FontAwesome6
        name='heart'
        size={28}
        solid={isFavorited}
        color={isFavorited ? '#E74C3C' : '#ccc'}
      />
    </TouchableOpacity>
  );
};

export default FavoriteButton;
