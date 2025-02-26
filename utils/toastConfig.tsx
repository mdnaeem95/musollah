import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import React from 'react'
import { FontAwesome6 } from '@expo/vector-icons';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#212B2A', // Twitter blue
        backgroundColor: '#212B2A',
        borderRadius: 10, // Rounded corners like Twitter
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
      }}
      contentContainerStyle={{
        paddingHorizontal: 5,
      }}
      text1Style={{
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#FFF',  // White text like Twitter
      }}
      renderLeadingIcon={() => (
        <FontAwesome6
          name="bookmark"
          color="#FFF"
          size={24}  // Adjust the icon size
        />
      )}
    />
  ),
  removed: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#212B2A',  // Green for the checkmark icon
        backgroundColor: '#212B2A',  // Green background like a success checkmark
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      contentContainerStyle={{
        paddingHorizontal: 5,
      }}
      text1Style={{
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#FFF',
      }}
      renderLeadingIcon={() => (
        <FontAwesome6
          name="check-circle"
          color="#FFF"
          size={24}
        />
      )}
    />
  ),
};
