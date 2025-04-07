import React from 'react';
import { FontAwesome6 } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";

const BackButton = () => {
    const router = useRouter();
    const { theme } = useTheme();
    return (
      <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 6 }}>
        <FontAwesome6 name="arrow-left" size={20} color={theme.colors.text.primary} />
      </TouchableOpacity>
    );
  };

export default BackButton