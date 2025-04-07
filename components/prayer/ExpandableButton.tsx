import { View, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import React, { useRef, useState } from 'react';
import RoundButton from './RoundButton';

interface ExpendableButtonProps {
  onQiblatPress: () => void;
  onDoaPress: () => void;
  onCalendarPress: () => void;
  onCityPress: () => void;
  onDashboardPress: () => void;
  onKhutbahPress?: () => void; // Add more here if needed
}

const ExpandableButton = ({
  onQiblatPress,
  onDoaPress,
  onCalendarPress,
  onCityPress,
  onDashboardPress,
  onKhutbahPress,
}: ExpendableButtonProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const animationValue = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    if (expanded) {
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setExpanded(false));
    } else {
      setExpanded(true);
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const opacity = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      {!expanded ? (
        <RoundButton iconName="plus" onPress={toggleExpand} size={22} />
      ) : (
        <Animated.View style={[styles.scrollWrapper, { opacity }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <RoundButton iconName="xmark" onPress={toggleExpand} size={22} />
            <RoundButton iconName="compass" onPress={onQiblatPress} size={22} />
            <RoundButton iconName="hands-praying" onPress={onDoaPress} size={22} />
            <RoundButton iconName="calendar-alt" onPress={onCalendarPress} size={22} />
            <RoundButton iconName="location-dot" onPress={onCityPress} size={22} />
            <RoundButton iconName="chart-simple" onPress={onDashboardPress} size={22} />
            {onKhutbahPress && (
              <RoundButton iconName="file-lines" onPress={onKhutbahPress} size={22} />
            )}
            {/* Add more buttons as needed */}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    width: Dimensions.get('window').width,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
  },
  scrollWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
});

export default ExpandableButton;