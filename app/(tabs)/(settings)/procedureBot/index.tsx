import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import TypewriterText from '../../../../components/procedureBot/TypewriterText';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';

import hajSteps from '../../../../data/hajSteps.json';

const proceduresList = [
  { slug: 'haj', title: 'Haj Registration', icon: '🕋', ...hajSteps },
];

interface Message {
  type: 'bot' | 'user';
  content: string;
  styleType?:
    | 'title'
    | 'description'
    | 'criteria'
    | 'instructions'
    | 'details'
    | 'note'
    | 'prompt';
}

export default function ProcedureBotScreen() {
  const { theme } = useTheme();
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stepQueue, setStepQueue] = useState<Message[]>([]);
  const [currentBotMessage, setCurrentBotMessage] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const getStepById = (id: string) => selectedProcedure?.steps?.find((s: any) => s.id === id);
  const currentStep = currentStepId ? getStepById(currentStepId) : null;
  const styles = createStyles(theme);

  useEffect(() => {
    // Initial message when no procedure is selected
    if (!selectedProcedure && messages.length === 0) {
      const introMessage: Message = {
        type: 'bot',
        content: "Assalamu’alaikum! I’m Ahmad the Assistant. What would you like help with today?",
      };
      setCurrentBotMessage(introMessage);
      setIsTyping(true);
    }
  }, [selectedProcedure]);

  useEffect(() => {
    if (!currentBotMessage && stepQueue.length > 0) {
      const next = stepQueue[0];
      setStepQueue((prev) => prev.slice(1));
      setCurrentBotMessage(next);
      setIsTyping(true);
    }
  }, [stepQueue, currentBotMessage]);

  useEffect(() => {
    if (!currentStep) return;
    const stepMessages: Message[] = currentStep.messages.map((msg: any) => ({
      type: 'bot',
      content: Array.isArray(msg.content) ? msg.content.join('\n') : msg.content,
      styleType: msg.type,
    }));
    setMessages([]);
    setStepQueue(stepMessages);
    setCurrentBotMessage(null);
  }, [currentStepId]);

  const handleOptionPress = async (option: any) => {
    setMessages((prev) => [...prev, { type: 'user', content: option.label }]);

    setTimeout(async () => {
      flatListRef.current?.scrollToEnd({ animated: true });

      if (option.action === 'saveChecklist') {
        try {
          const allMessages = selectedProcedure.steps.flatMap((step: any) => step.messages);
          await AsyncStorage.setItem(
            `checklist-${selectedProcedure.slug}`,
            JSON.stringify({ title: selectedProcedure.procedure, messages: allMessages })
          );
          router.push(`/procedureBot/checklist?slug=${selectedProcedure.slug}`);
        } catch (error) {
          console.error('Error saving checklist:', error);
        }
      } else if (option.action === 'openLink' && option.link) {
        if (option.link.startsWith('http')) {
          Linking.openURL(option.link);
        } else {
          Alert.alert('Invalid URL', 'No valid link found for this step.');
        }
      } else if (option.action === 'startOver') {
        setCurrentStepId(selectedProcedure.steps[0].id);
      } else if (option.nextStep) {
        setCurrentStepId(option.nextStep);
      }
    }, 300);
  };

  const renderStyledText = (message: Message) => {
    const baseStyle = [styles.bubbleText, { color: theme.colors.text.primary }];

    switch (message.styleType) {
      case 'title':
        return <Text style={[...baseStyle, styles.title]}>{message.content}</Text>;
      case 'description':
        return <Text style={[...baseStyle, styles.description]}>{message.content}</Text>;
      case 'criteria':
      case 'instructions':
        return message.content.split('\n').map((line, idx) => (
          <Text key={idx} style={[styles.bullet, { color: theme.colors.text.secondary }]}>• {line}</Text>
        ));
      case 'details':
        return <Text style={[...baseStyle, styles.details]}>{message.content}</Text>;
      case 'note':
        return <Text style={[...baseStyle, styles.note]}>{message.content}</Text>;
      case 'prompt':
        return <Text style={[...baseStyle, styles.prompt]}>{message.content}</Text>;
      default:
        return <Text style={baseStyle}>{message.content}</Text>;
    }
  };

  useEffect(() => {
    if (currentBotMessage?.type === 'bot' && !stepQueue.length && !selectedProcedure) {
      setMessages((prev) => [...prev, currentBotMessage]);
      setCurrentBotMessage(null);
      setIsTyping(false);
    }
  }, [currentBotMessage, stepQueue, selectedProcedure]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}> 
      <FlatList
        ref={flatListRef}
        data={currentBotMessage ? [...messages, currentBotMessage] : messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          const isBotTyping = item.type === 'bot' && item.content === currentBotMessage?.content;

          return (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
              {item.type === 'bot' && (
                <Image
                  source={require('../../../../assets/ahmadtheassistant.png')}
                  style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, marginTop: 4 }}
                />
              )}
              <MotiView
                style={[
                  styles.bubble,
                  item.type === 'bot' ? styles.botBubble : styles.userBubble,
                  { alignSelf: item.type === 'bot' ? 'flex-start' : 'flex-end' }
                ]}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing' }}
              >
                {isBotTyping ? (
                  <TypewriterText
                    content={item.content}
                    onTypingEnd={() => {
                      setMessages((prev) => [...prev, item]);
                      setCurrentBotMessage(null);
                      setIsTyping(false);
                    }}
                    renderText={(visibleContent) => renderStyledText({ ...item, content: visibleContent })}
                  />
                ) : (
                  item.type === 'bot'
                    ? renderStyledText(item)
                    : <Text style={[styles.bubbleText, { color: '#fff' }]}>{item.content}</Text>
                )}
              </MotiView>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={theme.colors.muted} />
          <Text style={{ marginLeft: 6, color: theme.colors.text.muted }}>Rihlah is typing…</Text>
        </View>
      )}

      {selectedProcedure && currentStep?.options?.length > 0 && !isTyping && !currentBotMessage && (
        <View style={[styles.options, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.muted }]}>
          <AnimatePresence>
            {currentStep.options.map((option: any, idx: number) => (
              <MotiView
                key={option.label}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 10 }}
                transition={{ delay: idx * 80, type: 'timing' }}
              >
                <Pressable
                  style={[styles.button, { backgroundColor: theme.colors.muted }]}
                  onPress={() => handleOptionPress(option)}
                >
                  <Text style={[styles.buttonText]}>{option.label}</Text>
                </Pressable>
              </MotiView>
            ))}
          </AnimatePresence>
        </View>
      )}

      {!selectedProcedure && !currentBotMessage && !isTyping && (
        <View style={[styles.options, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.muted }]}>
          <AnimatePresence>
            {proceduresList.map((proc, index) => (
              <MotiView
                key={proc.slug}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 10 }}
                transition={{ delay: index * 100, type: 'timing' }}
              >
                <Pressable
                  style={[styles.button, { backgroundColor: theme.colors.muted }]}
                  onPress={() => {
                    if (proc?.steps && proc.steps.length > 0) {
                      setSelectedProcedure(proc);
                      setCurrentStepId(proc.steps[0].id);
                    } else {
                      Alert.alert("Missing data", "This procedure has no steps defined.");
                    }
                  }}
                >
                  <Text style={[styles.buttonText]}>{proc.icon} {proc.title}</Text>
                </Pressable>
              </MotiView>
            ))}
          </AnimatePresence>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  subheader: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    marginTop: 4,
  },  
  bubble: {
    maxWidth: '80%',
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E90FF',
    borderTopRightRadius: 0,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Outfit_400Regular',
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    marginBottom: 6,
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    marginBottom: 4,
  },
  details: {
    fontStyle: 'italic',
    fontSize: 16,
    marginBottom: 4,
  },
  note: {
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
  },
  prompt: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    marginTop: 8,
  },
  bullet: {
    fontSize: 16,
    marginLeft: 12,
    marginBottom: 2,
    fontFamily: 'Outfit_400Regular',
  },
  options: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Outfit_500Medium',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 8,
  },
});