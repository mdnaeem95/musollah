import { useState, useRef } from "react";
import { View, TextInput, TouchableOpacity, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { getAnswer } from "../../../../../services/AIService";
import { useTheme } from "../../../../../context/ThemeContext";
import { FontAwesome6 } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Audio } from "expo-av";

const ChatScreen = () => {
  const { theme, textSize, isDarkMode } = useTheme();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAIResponse, setCurrentAIResponse] = useState(""); // Real-time streaming effect
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setHistory([...history, { question: input, answer: "" }]);
    setIsLoading(true);
    setInput("");

    // Fake AI thinking time
    const delay = Math.random() * (3000 - 1500) + 1500;
    setTimeout(async () => {
      const fullAnswer = await getAnswer(input);
      setCurrentAIResponse(""); // Clear previous response
      simulateStreamingResponse(fullAnswer); // Display response word by word
    }, delay);
  };

  // Function to simulate word-by-word response
  const simulateStreamingResponse = (fullAnswer: string) => {
    let index = 0;
    const words = fullAnswer.split(" ");
    setIsLoading(false);

    const interval = setInterval(() => {
      if (index < words.length) {
        setCurrentAIResponse((prev) => prev + " " + words[index]);
        index++;
        scrollViewRef.current?.scrollToEnd({ animated: true }); // Auto-scroll as text appears
      } else {
        clearInterval(interval);
        setHistory((prev) => prev.map((msg, i) => (i === prev.length - 1 ? { ...msg, answer: fullAnswer } : msg)));
      }
    }, 50); // Adjust speed for real-time effect
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.chatContainer}>
        {history.map((entry, index) => (
          <View key={index} style={styles.messageContainer}>
            {/* User Message */}
            <Animated.View entering={FadeInUp.duration(300)} style={[styles.userMessage, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.userText, { fontSize: textSize, fontFamily: "Outfit_600SemiBold" }]}>{entry.question}</Text>
            </Animated.View>

            {/* AI Response with Streaming Effect */}
            <View style={styles.botMessageContainer}>
              <FontAwesome6 name="robot" size={24} color={theme.colors.text.primary} style={styles.avatar} />
              <Animated.View entering={FadeInUp.delay(200).duration(300)} style={[styles.botMessage, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.botText, { fontSize: textSize, fontFamily: "Outfit_400Regular" }]}>
                  {index === history.length - 1 ? currentAIResponse : entry.answer}
                </Text>
              </Animated.View>
            </View>
          </View>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.text.secondary} />
            <Text style={[styles.typingText, { color: theme.colors.text.secondary }]}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Action Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickQuestions}>
        {["What is the importance of prayer?", "Is Wudu needed after sleep?", "What breaks my fast?"].map((question) => (
          <TouchableOpacity key={question} style={styles.quickButton} onPress={() => setInput(question)}>
            <Text style={styles.quickText}>{question}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.primary }]}>
        <TextInput
          placeholder="Ask something..."
          placeholderTextColor={theme.colors.text.muted}
          style={[styles.input, { color: theme.colors.text.primary, fontFamily: "Outfit_400Regular" }]}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity onPress={handleSend} disabled={isLoading} style={styles.sendButton}>
          <FontAwesome6 name="paper-plane" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  chatContainer: {
    paddingBottom: 80,
  },
  messageContainer: {
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: "flex-end",
    padding: 12,
    borderRadius: 10,
    maxWidth: "80%",
  },
  botMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  botMessage: {
    padding: 12,
    borderRadius: 10,
    maxWidth: "80%",
  },
  avatar: {
    marginRight: 10,
  },
  userText: {
    color: "#fff",
    fontSize: 16,
  },
  botText: {
    color: "#000",
    fontSize: 16,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  typingText: {
    marginLeft: 5,
    fontSize: 14,
  },
  quickQuestions: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  quickButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  quickText: {
    fontFamily: "Outfit_500Medium",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    padding: 10,
  },
});

export default ChatScreen;