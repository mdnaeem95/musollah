import axios from "axios";
import firestore from "@react-native-firebase/firestore";

const OPENAI_API_KEY = "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";

// 🔹 Function to check Firestore first
export const getAnswer = async (question: string) => {
  try {
    // Check Firestore for an existing answer
    const querySnapshot = await firestore()
      .collection("questions")
      .where("question", "==", question)
      .get();

    if (!querySnapshot.empty) {
      // Return Firestore answer if found
      return querySnapshot.docs[0].data().answer;
    }

    // If not in Firestore, call OpenAI API
    return await askOpenAI(question);
  } catch (error) {
    console.error("Firestore Error:", error);
    return "Error fetching answer. Please try again later.";
  }
};

// 🔹 OpenAI API call
const askOpenAI = async (question: string) => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o", // Ensure the model is available under your plan
          messages: [{ role: "user", content: question }],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`, // Ensure 'Bearer' is included
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error("AI Error:", error.response?.data || error.message);
      return "Sorry, I couldn't find an answer. Please check with an Islamic scholar.";
    }
};  