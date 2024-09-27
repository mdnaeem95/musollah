import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../../../redux/store/store';
import { completeModule } from '../../../../../../redux/slices/courseSlice';
import { getAuth } from '@react-native-firebase/auth';
import { CourseData, ModuleData } from '../../../../../../utils/types';

type Params = {
  courseId: string;
  moduleId: string;
}

const ModuleDetails = () => {
  const { courseId, moduleId } = useLocalSearchParams<Params>(); // Extract courseId and moduleId from the URL
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Get the course data from Redux (dashboard slice)
  const course: CourseData = useSelector((state: RootState) =>
    state.dashboard.courses.find((c) => c.id === courseId)
  );

  useEffect(() => {
    if (course) {
      // Fetch the module data for the current module
      const module = course.modules.find((m: any) => m.moduleId === moduleId);
      if (module) {
        setModuleData(module);
      }
    }
  }, [course, moduleId]);

  const handleCompleteModule = async () => {
    if (courseId && moduleId && userId) {
      try {
        console.log('Current course state:', course);

        // Ensure course progress exists
        const userCourseProgress = course?.modules.find((m: any) => m.moduleId === moduleId);
        if (!userCourseProgress) {
          throw new Error('Course progress not found for this module.');
        }

        // Complete the module
        await dispatch(completeModule({ courseId, moduleId, userId })).unwrap();

        // Find the index of the current module
        const currentModuleIndex = course?.modules.findIndex((m: any) => m.moduleId === moduleId);

        // Navigate to the next module or completion page
        if (currentModuleIndex !== undefined && currentModuleIndex < course!.modules.length - 1) {
          const nextModule = course!.modules[currentModuleIndex + 1];
          router.push(`/courses/${courseId}/modules/${nextModule.moduleId}`);
        } else {
          // If this was the last module, show a completion message or route to a course completion page
          alert('Congratulations! You have completed the course.');
          router.push('/courses'); // Or route to a different page
        }
      } catch (error) {
        console.error('Failed to complete module:', error);
      }
    }
  };

  if (!moduleData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{moduleData.title}</Text>

      {/* Render the module content */}
      {moduleData.content.map((contentItem, index) => (
        <View key={index} style={styles.contentContainer}>
          <Text style={styles.contentTitle}>{contentItem.title}</Text>
          <Text style={styles.textContent}>{contentItem.data}</Text>
        </View>
      ))}
      
      {/* Button to mark module as complete */}
      <TouchableOpacity style={styles.completeButton} onPress={handleCompleteModule}>
        <Text style={styles.completeButtonText}>Complete Module</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Outfit_600SemiBold', 
    fontSize: 24,
    marginBottom: 16,
  },
  contentContainer: {
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default ModuleDetails;
