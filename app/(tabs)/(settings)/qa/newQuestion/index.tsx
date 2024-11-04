import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { addQuestion } from '../../../../../redux/slices/qaSlice';
import { AppDispatch } from '../../../../../redux/store/store';
import { Question } from '../../../../../utils/types';
import { useRouter } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';
import SignInModal from '../../../../../components/SignInModal';

const NewQuestionScreen: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false); 
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert(
        'Authentication Required',
        'Please create an account or sign in to post a question.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => setIsAuthModalVisible(true) }
        ]
      );
      return;
    }

    if (!title || !body) {
      Alert.alert('Error', 'Title and body are required');
      return;
    }

    const newQuestion: Partial<Question> = {
      title,
      body,
      tags: tags.split(',').map(tag => tag.trim()),
      userId: 'current_user_id', // Replace with actual user ID
      createdAt: new Date(),
      votes: 0,
      answerCount: 0,
      views: 0,
      status: 'open',
    };

    try {
        dispatch(addQuestion(newQuestion));
        Alert.alert('Success', 'Your question has been posted!');
        setTitle('')
        setBody('')
        setTags('')
        router.push('/qa')
    } catch (error) {
        Alert.alert('Error', 'Failed to post question.')
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#ECDFCC"
        placeholder="Type catching attention title"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Body</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholderTextColor="#ECDFCC"
        placeholder="Type your question"
        value={body}
        onChangeText={setBody}
        multiline
      />

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#ECDFCC"
        placeholder="e.g. islam, fiqh, prayer"
        value={tags}
        onChangeText={setTags}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Publish</Text>
      </TouchableOpacity>

      {/* Sign In Modal */}
      <SignInModal
        isVisible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 5,
  },
  input: {
    height: 50,
    backgroundColor: '#3A504C',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#A3C0BB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default NewQuestionScreen;
