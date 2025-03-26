import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import TypewriterText from '../../../../components/procedureBot/TypewriterText';
import { useTheme } from '../../../../context/ThemeContext';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import hajSteps from '../../../../data/hajSteps.json';
import zakatSteps from '../../../../data/zakatSteps.json';
import nikahSteps from '../../../../data/nikahSteps.json'
import qurbanSteps from '../../../../data/qurbanSteps.json';
import scholarshipSteps from '../../../../data/scholarshipSteps.json';

const procedures: Record<string, any> = {
  haj: hajSteps,
  zakat: zakatSteps,
  nikah: nikahSteps,
  qurban: qurbanSteps,
  scholarships: scholarshipSteps
};

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
  const { slug } = useLocalSearchParams();
  const procedure = procedures[slug as string];
  const { theme } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stepQueue, setStepQueue] = useState<Message[]>([]);
  const [currentBotMessage, setCurrentBotMessage] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const currentStep = procedure.steps[stepIndex];
  const styles = createStyles(theme);

  useEffect(() => {
    const stepMessages: Message[] = currentStep.messages.map((msg: any) => ({
      type: 'bot',
      content: Array.isArray(msg.content) ? msg.content.join('\n') : msg.content,
      styleType: msg.type,
    }));

    setMessages([]);
    setStepQueue(stepMessages);
    setCurrentBotMessage(null);
  }, [stepIndex]);

  useEffect(() => {
    if (!currentBotMessage && stepQueue.length > 0) {
      const next = stepQueue[0];
      setStepQueue((prev) => prev.slice(1));
      setCurrentBotMessage(next);
      setIsTyping(true);
    }
  }, [stepQueue, currentBotMessage]);

  const handleOptionPress = async (option: string) => {
    setMessages((prev) => [...prev, { type: 'user', content: option }]);
  
    setTimeout(async () => {
      flatListRef.current?.scrollToEnd({ animated: true });
  
      const isFinalStep = stepIndex === procedure.steps.length - 1;
      if (option.toLowerCase().includes('save')) {
        try {
          const allMessages = procedure.steps.flatMap((step: any) => step.messages);
          await AsyncStorage.setItem(
            `checklist-${slug}`,
            JSON.stringify({
              title: procedure.procedure,
              messages: allMessages
            })
          );
          router.push(`/procedureBot/checklist?slug=${slug}`);
        } catch (error) {
          console.error('Error saving checklist:', error);
        }      
      } else if (option.toLowerCase().includes('view')) {
        const fallback = procedure.steps[0]?.fallback;
      
        if (fallback) {
          // extract URL from markdown if needed
          const match = fallback.match(/\\((.*?)\\)/) || fallback.match(/\\((.*?)\\)/);
          const url = match?.[1] || fallback;
      
          if (url.startsWith('http')) {
            Linking.openURL(url);
          } else {
            Alert.alert('Invalid URL', 'No valid link found for this step.');
          }
        } else {
          Alert.alert('Unavailable', 'No link is available for this step.');
        }      
      } else if (option.toLowerCase().includes('start over')) {
        setStepIndex(0);
      } else if (!isFinalStep) {
        setStepIndex((prev) => Math.min(prev + 1, procedure.steps.length - 1));
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <FlatList
        ref={flatListRef}
        data={currentBotMessage ? [...messages, currentBotMessage] : messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          const isBotTyping = item.type === 'bot' && item.content === currentBotMessage?.content;

          return (
            <View
              style={[styles.bubble, item.type === 'bot' ? styles.botBubble : styles.userBubble]}
            >
              {isBotTyping ? (
                <TypewriterText
                  content={item.content}
                  onTypingEnd={() => {
                    setMessages((prev) => [...prev, item]);
                    setCurrentBotMessage(null);
                    setIsTyping(false);
                  }}
                />
              ) : (
                item.type === 'bot'
                  ? renderStyledText(item)
                  : <Text style={[styles.bubbleText, { color: '#fff' }]}>{item.content}</Text>
              )}
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

      <View style={[styles.options, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.muted }]}>
        {!isTyping &&
          currentStep.options.map((option: string, idx: number) => (
            <Pressable
              key={idx}
              style={[styles.button, { backgroundColor: theme.colors.muted }]}
              onPress={() => handleOptionPress(option)}
            >
              <Text style={[styles.buttonText]}>{option}</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
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
    color: theme.colors.text.primary,
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
