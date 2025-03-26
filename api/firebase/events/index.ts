import firestore from '@react-native-firebase/firestore';
import storage from "@react-native-firebase/storage";

export const fetchEventsFromFirebase = async () => {
  try {
    const snapshot = await firestore().collection("events").get();
    const events = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Convert Firebase Storage gs:// URL to HTTP URL
        let imageUrl = "";
        if (data.image) {
          console.log("Poster Path:", data.image);
          const storageRef = storage().refFromURL(data.image);
          imageUrl = await storageRef.getDownloadURL();
        }

        return {
          id: doc.id, // Keep the Firestore document ID
          ...data, // Spread all event data fields
          image: imageUrl, // Override with the correct image URL
        };
      })
    );

    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};