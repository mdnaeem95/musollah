import firestore from '@react-native-firebase/firestore';

export const followUser = async (
  currentUserId: string,
  targetUserId: string,
  senderName: string,
  avatarUrl?: string
) => {
  if (!senderName || avatarUrl === undefined) {
    throw new Error("Missing senderName or avatarUrl in followUser");
  }

  const userRef = firestore().collection('users');
  const notificationId = `follow:${currentUserId}:${targetUserId}`;
  const notificationRef = firestore().collection("notifications").doc(notificationId);

  const batch = firestore().batch();

  // 1. Update follow maps
  batch.update(userRef.doc(currentUserId), {
    [`following.${targetUserId}`]: true,
  });
  batch.update(userRef.doc(targetUserId), {
    [`followers.${currentUserId}`]: true,
  });

  // 2. Set or overwrite follow notification in Firestore
  const notificationPayload = {
    id: notificationId,
    type: 'follow',
    senderId: currentUserId,
    senderName,
    avatarUrl,
    targetUserId,
    message: `${senderName} started following you.`,
    createdAt: firestore.FieldValue.serverTimestamp(),
    read: false,
  };
  batch.set(notificationRef, notificationPayload);

  await batch.commit();
  console.log("✅ Firestore: Follow and notification written");

  // 3. Send push notification via Expo Push API
  try {
    const targetDoc = await userRef.doc(targetUserId).get();
    const expoPushToken = targetDoc.data()?.expoPushToken;

    if (expoPushToken) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: expoPushToken,
          sound: "default",
          title: "New Follower 👤",
          body: notificationPayload.message,
          data: {
            type: "follow",
            senderId: currentUserId,
          },
        }),
      });

      console.log("📲 Push notification sent via Expo API");
    } else {
      console.log("ℹ️ No expoPushToken found for target user");
    }
  } catch (err) {
    console.error("❌ Failed to send push notification:", err);
  }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
    const userRef = firestore().collection('users');
  
    await firestore().runTransaction(async (transaction) => {
      const currentUserDoc = userRef.doc(currentUserId);
      const targetUserDoc = userRef.doc(targetUserId);
  
      transaction.update(currentUserDoc, {
        [`following.${targetUserId}`]: firestore.FieldValue.delete(),
      });
      transaction.update(targetUserDoc, {
        [`followers.${currentUserId}`]: firestore.FieldValue.delete(),
      });
    });
};

export const inviteUsersToEvent = async ({
  inviterId,
  inviterName,
  inviterAvatarUrl,
  targetUserIds,
  eventId,
  eventTitle,
}: {
  inviterId: string;
  inviterName: string;
  inviterAvatarUrl?: string;
  targetUserIds: string[];
  eventId: string;
  eventTitle: string;
}) => {
  const notificationsRef = firestore().collection("notifications");
  const batch = firestore().batch();

  targetUserIds.forEach((uid) => {
    const docRef = notificationsRef.doc();
    batch.set(docRef, {
      id: docRef.id,
      type: "event-invite",
      senderId: inviterId,
      senderName: inviterName,
      avatarUrl: inviterAvatarUrl || null,
      targetUserId: uid,
      eventId,
      message: `${inviterName} invited you to join "${eventTitle}"`,
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log("✅ Sent invites to:", targetUserIds);
};