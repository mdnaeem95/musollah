import { useRef } from "react";
import { Animated, Easing } from "react-native";

export const useThemeTransition = () => {
  const themeTransitionAnim = useRef(new Animated.Value(0)).current;

  const triggerThemeTransition = (onMidway: () => void) => {
    themeTransitionAnim.setValue(0);
    Animated.timing(themeTransitionAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onMidway?.();
      Animated.timing(themeTransitionAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  return { themeTransitionAnim, triggerThemeTransition };
};