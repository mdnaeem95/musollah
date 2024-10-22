import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { addQuestion } from '../../../../../redux/slices/qaSlice';
import { AppDispatch } from '../../../../../redux/store/store';
import { Question } from '../../../../../utils/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrayerHeader from '../../../../../components/PrayerHeader';
import { useRouter } from 'expo-router';

const NewQuestionScreen: React.FC = () => {
    const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = () => {
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
    <SafeAreaView style={styles.container}>
        <PrayerHeader title='Ask a Question' backgroundColor='#f5f5f5' textColor='#000' />
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Type catching attention title"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Body</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Type your question"
        value={body}
        onChangeText={setBody}
        multiline
      />

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. islam, fiqh, prayer"
        value={tags}
        onChangeText={setTags}
      />

      <View style={styles.buttonContainer}>
        <Button title="Publish" onPress={handleSubmit} color="#ff8c00" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  textArea: {
    height: 100,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default NewQuestionScreen;
