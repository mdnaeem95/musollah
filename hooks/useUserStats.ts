// hooks/useUserStats.ts
import { useEffect, useState } from "react";
import firestore from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";

export const useUserStats = () => {
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .onSnapshot((doc) => {
        const data = doc.data();
        setStats({
          followers: data?.followers ? Object.keys(data.followers).length : 0,
          following: data?.following ? Object.keys(data.following).length : 0,
        });
      });

    return () => unsubscribe();
  }, []);

  return stats;
};