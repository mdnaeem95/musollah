import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../../../redux/store/store';
import { completeModule } from '../../../../../../redux/slices/courseSlice';
import { CourseData, ModuleData } from '../../../../../../redux/slices/dashboardSlice';

type Params = {
  courseId: string;
  moduleId: string;
}

const ModuleDetails = () => {
  const { courseId, moduleId } = useLocalSearchParams<Params>(); // Extract courseId and moduleId from the URL
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const course: CourseData = useSelector((state: RootState) =>
    state.dashboard.courses.find((c) => c.id === courseId)
  );
  
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);

  useEffect(() => {
    if (course) {
      // Fetch the full module data, not just progress
      const module = course.modules.find((m) => m.moduleId === moduleId);
      if (module) {
        setModuleData(module)
      }
    }
  }, [course, moduleId]);

  const handleCompleteModule = () => {
    if (courseId && moduleId) {
      dispatch(completeModule({ courseId, moduleId, userId: 'currentUserId' })) // Replace with actual user ID
        .then(() => {
          router.back(); // Navigate back or to the next module
        });
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
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
