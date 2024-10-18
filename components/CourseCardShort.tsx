import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

interface CourseCardProps {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    backgroundColour: string;
  }

const CourseCardShort: React.FC<CourseCardProps> = ({ id, title, description, category, icon, backgroundColour }) => {
  return (
    <TouchableOpacity style={styles.cardContainer}>
        <Link href={{
            pathname: '/courses/[courseId]',
            params: { courseId: `${id}` }
        }} >
        <View style={styles.cardContent}>
          {/* Icon Section as full width background */}
          <View style={[styles.iconContainer, { backgroundColor: backgroundColour }]}>
            <FontAwesome6 size={60} name={icon} color="black" />
          </View>
          
          {/* Course Details Section */}
          <View style={styles.cardDetails}>
            <View style={styles.cardHashTag}>
              <Text style={styles.hashtagText}>{category}</Text>
            </View>
            <Text style={styles.headerText}>{title}</Text>
          </View>
        </View>
      </Link>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 10,
    paddingBottom: 10, // Ensure there is spacing at the bottom
    overflow: 'hidden',
    width: '100%', // Take full width
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  cardContent: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    alignSelf: 'stretch',
    width: '100%',
    flexGrow: 1,
    height: 120, // Icon section height, adjust as needed
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    paddingTop: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cardHashTag: {
    borderWidth: 0.5,
    borderColor: '#CCCCCC',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'center',
    marginBottom: 6,
  },
  hashtagText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#333333',
  },
  headerText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
});

export default CourseCardShort;
