// NotificationContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";

import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import { useAuth } from "./AuthContext";
import { Notification as AppNotification } from "../utils/types";

// ✅ Modular Firestore (RN Firebase v22+ style)
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";
import { db } from "../api/client/firebase";

// ============================================================================
// TYPES
// ============================================================================

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  inAppNotifications: AppNotification[];
  unreadCount: number;
}

// ============================================================================
// CONTEXT
// ============================================================================

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [inAppNotifications, setInAppNotifications] = useState<AppNotification[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);

  const lastToastIdRef = useRef<string | null>(null);

  // ✅ In newer expo-notifications, subscriptions have `.remove()`
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // 1) Register for push notifications + attach listeners
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? null))
      .catch((err) => setError(err));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        console.log("📥 Notification received (foreground):", notif);
        setNotification(notif);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("📨 Notification response received:", response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // 2) Save token to Firestore when available
  useEffect(() => {
    const savePushToken = async () => {
      if (!user?.uid || !expoPushToken) return;

      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { expoPushToken });
        console.log("✅ Saved push token to Firestore");
      } catch (err) {
        console.error("❌ Failed to save push token:", err);
      }
    };

    savePushToken();
  }, [user?.uid, expoPushToken]);

  // 3) Listen to Firestore for in-app notifications
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("targetUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allNotifs = snapshot.docs.map((d: any) => ({
          id: d.id,
          ...(d.data() as Omit<AppNotification, "id">),
        })) as AppNotification[];

        const unread = allNotifs.filter((n) => !n.read);

        setUnreadCount(unread.length);
        setInAppNotifications(allNotifs);

        // toast newest unread (once)
        const newest = unread[0];
        if (newest?.message && newest.id !== lastToastIdRef.current) {
          Toast.show({
            type: "info",
            text1: newest.message,
          });
          lastToastIdRef.current = newest.id;
        }
      },
      (err) => {
        console.error("❌ Notifications snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        error,
        inAppNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
