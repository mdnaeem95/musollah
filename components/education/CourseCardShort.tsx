  import React from 'react';
  import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
  import { Link } from 'expo-router';
  import { FontAwesome6 } from '@expo/vector-icons';
  import { useTheme } from '../../context/ThemeContext';

  interface CourseCardProps {
      id: string;
      title: string;
      description: string;
      category: string;
      icon: string;
      backgroundColour: string;
  }

  const CourseCardShort: React.FC<CourseCardProps> = ({ id, title, description, category, icon, backgroundColour }) => {
    const { theme } = useTheme();

    return (
      <View style={styles.cardShadow}>
        <TouchableOpacity style={[styles.cardContainer, { backgroundColor: theme.colors.secondary }]}>
          <Link
            href={{
              pathname: '/courses/[courseId]',
              params: { courseId: `${id}` },
            }}
          >
            <View style={styles.cardContent}>
              {/* Icon Section as full width background */}
              <View style={[styles.iconContainer, { backgroundColor: backgroundColour }]}>
                <FontAwesome6 size={60} name={icon} color="black" />
              </View>

              {/* Course Details Section */}
              <View style={styles.cardDetails}>
                <View style={[styles.cardHashTag, { borderColor: theme.colors.text.primary }]}>
                  <Text style={[styles.hashtagText, { color: theme.colors.text.primary }]}>{category}</Text>
                </View>
                <Text style={[styles.headerText, { color: theme.colors.text.primary }]}>{title}</Text>
              </View>
            </View>
          </Link>
        </TouchableOpacity>
      </View>
    );
  };

  const styles = StyleSheet.create({
    cardShadow: {
      borderRadius: 15,
      backgroundColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: Platform.OS === 'android' ? 0 : 1 },
      shadowOpacity: 0.22,
      shadowRadius: Platform.OS === 'android' ? 0 : 2.22,
      elevation: Platform.OS === 'android' ? 0 : 3
    },
    cardContainer: {
      flex: 1,
      borderRadius: 15,
      marginVertical: 10,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: Platform.OS === 'android' ? 2 : 3 },
      shadowOpacity: 0.3,
      shadowRadius: Platform.OS === 'android' ? 3.5 : 4.65,
      elevation: Platform.OS === 'android' ? 2.5 : 6,
      margin: 2
    },
    cardContent: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
    },
    iconContainer: {
      width: '100%',
      height: 120, // Icon section height, adjust as needed
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    cardDetails: {
      paddingTop: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    cardHashTag: {
      borderWidth: 0.5,
      borderRadius: 15,
      paddingVertical: 4,
      paddingHorizontal: 10,
      alignSelf: 'center',
      marginBottom: 6,
    },
    hashtagText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
    },
    headerText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 16,
      textAlign: 'center',
      paddingVertical: 5,
    },
  });

  export default CourseCardShort;
