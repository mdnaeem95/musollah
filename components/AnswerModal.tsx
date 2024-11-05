import React, { useState } from 'react';
import { Modal, View, TextInput, Button, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addAnswer, fetchAnswers } from '../redux/slices/qaSlice'; // Ensure you have this action or implement it accordingly
import { ActivityIndicator } from 'react-native-paper';
import { AppDispatch, RootState } from '../redux/store/store';

interface AnswerModalProps {
  visible: boolean;
  onClose: () => void;
  questionId: string;
}

const AnswerModal: React.FC<AnswerModalProps> = ({ visible, onClose, questionId }) => {
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);

  const handleSubmit = async () => {
    if (!answerText.trim()) {
        Alert.alert('Error', 'Answer cannot be empty.');
        return;
    }
  
    setIsSubmitting(true);

    try {
        await dispatch(addAnswer({ 
            questionId, 
            newAnswer: { 
                body: answerText, 
                userId: user?.id,
                votes: 0,
                isAccepted: false 
            } 
        }));
        Alert.alert('Success', 'Your answer has been submitted.');
        setAnswerText('');
        await dispatch(fetchAnswers(questionId));
        onClose();
      } catch (error) {
        Alert.alert('Error', 'Failed to submit your answer. Please try again.');
        console.error('Error submitting answer:', error);
      } finally {
        setIsSubmitting(false);
      }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.title}>Write Your Answer</Text>
              <TextInput
                style={styles.input}
                multiline
                placeholderTextColor='#ECDFCC'
                placeholder="Type your answer here..."
                value={answerText}
                onChangeText={setAnswerText}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Submit</Text>
                    )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
      },
      scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
      },
      modalContent: {
        backgroundColor: '#2E3D3A',
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%',
        flex: 1,
      },
      title: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#ECDFCC',
        marginBottom: 10,
      },
      input: {
        flex: 1,
        borderColor: '#3A504C',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        fontSize: 14,
        color: '#ECDFCC',
        backgroundColor: '#3A504C',
        fontFamily: 'Outfit_400Regular',
        marginBottom: 20,
        textAlignVertical: 'top',
      },
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      button: {
        backgroundColor: '#A3C0BB',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
      },
      closeButton: {
        backgroundColor: '#FF6B6B', // Custom color for the close button
      },
      buttonText: {
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
        fontSize: 16,
      },
});

export default AnswerModal;
