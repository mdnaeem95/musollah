import firestore from '@react-native-firebase/firestore';
import storage from "@react-native-firebase/storage";
import { getAuth } from "@react-native-firebase/auth";
import { Event } from "../../../utils/types";
import { useAuth } from '../../../context/AuthContext';

export type EventStatus = "upcoming" | "ongoing" | "past";

interface FirebaseEventData {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  organizer: string;
  organizerId?: string;
  description: string;
  status?: EventStatus;
  lastStatusUpdate?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  mosque?: string;
  livestreamAvailable: boolean;
  wheelchairAccessible: boolean;
  language: string;
  targetAudience: string;
  image?: string;
  ticketPrice?: string;
  eventType: "Open" | "Registration" | "External";
  registrationLink?: string;
  isExternal: boolean;
  externalClicks?: number;
  interestedCount?: number;
  endDate?: string;
  interested?: Record<string, {
    name: string;
    email?: string;
    clickedRegistration: boolean;
    timestamp: string;
  }>;
  attendees?: Record<string, {
    name: string;
    email?: string;
    checkedIn: boolean;
    timestamp: string;
  }>;
}

function determineEventStatus(eventData: FirebaseEventData): EventStatus {
  const currentDate = new Date();
  let eventStatus: EventStatus = "upcoming";

  try {
    const dateParts = eventData.date.split(' ');
    const day = parseInt(dateParts[0], 10);
    const months = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
    const month = months.indexOf(dateParts[1]);
    const year = parseInt(dateParts[2], 10);

    if (!isNaN(day) && month !== -1 && !isNaN(year)) {
      const eventDate = new Date(year, month, day, 23, 59, 59);

      if (eventDate < currentDate) {
        eventStatus = "past";
      }

      if (eventData.endDate) {
        const endDateParts = eventData.endDate.split(' ');
        const endDay = parseInt(endDateParts[0], 10);
        const endMonth = months.indexOf(endDateParts[1]);
        const endYear = parseInt(endDateParts[2], 10);

        if (!isNaN(endDay) && endMonth !== -1 && !isNaN(endYear)) {
          const eventEndDate = new Date(endYear, endMonth, endDay, 23, 59, 59);

          if (currentDate >= new Date(year, month, day, 0, 0, 0) &&
              currentDate <= eventEndDate) {
            eventStatus = "ongoing";
          } else if (currentDate > eventEndDate) {
            eventStatus = "past";
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Error determining status for event: ${error instanceof Error ? error.message : String(error)}`);
    eventStatus = "upcoming";
  }

  return eventStatus;
}

export const fetchEventsFromFirebase = async (): Promise<Event[]> => {
  try {
    const snapshot = await firestore().collection("events").get();
    const currentTime = Date.now();

    const statusUpdates: Promise<void>[] = [];

    const events = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data() as FirebaseEventData;
        const docRef = firestore().collection("events").doc(doc.id);

        let imageUrl = "";
        if (data.image) {
          try {
            const storageRef = storage().refFromURL(data.image);
            imageUrl = await storageRef.getDownloadURL();
          } catch (error) {
            console.warn(`Error fetching image for event ${doc.id}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Always determine new status and update backend
        const eventStatus = determineEventStatus(data);
        statusUpdates.push(
          docRef.update({
            status: eventStatus,
            lastStatusUpdate: currentTime
          }).catch(error => {
            console.error(`Failed to update status for event ${doc.id}: ${error instanceof Error ? error.message : String(error)}`);
          })
        );

        return {
          id: doc.id,
          ...data,
          image: imageUrl,
          status: eventStatus
        } as Event;
      })
    );

    if (statusUpdates.length > 0) {
      console.log(`Updating status for ${statusUpdates.length} events in Firestore...`);
      await Promise.all(statusUpdates);
    }

    return events.sort((a, b) => {
      const statusPriority: Record<EventStatus, number> = { "ongoing": 0, "upcoming": 1, "past": 2 };
      const statusDiff = (statusPriority[a.status as EventStatus] ?? 3) - (statusPriority[b.status as EventStatus] ?? 3);

      if (statusDiff !== 0) return statusDiff;

      try {
        const dateA = parseDateString(a.date);
        const dateB = parseDateString(b.date);

        if (a.status === "past") {
          return dateB.getTime() - dateA.getTime();
        } else {
          return dateA.getTime() - dateB.getTime();
        }
      } catch (error) {
        console.warn("Error sorting by date:", error instanceof Error ? error.message : String(error));
        return 0;
      }
    });
  } catch (error) {
    console.error("Error fetching events:", error instanceof Error ? error.message : String(error));
    throw error;
  }
};

function parseDateString(dateString: string): Date {
  try {
    const parts = dateString.split(' ');
    const day = parseInt(parts[0], 10);
    const months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
    const month = months.indexOf(parts[1]);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || month === -1 || isNaN(year)) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    return new Date(year, month, day);
  } catch (error) {
    console.warn(`Error parsing date string "${dateString}": ${error instanceof Error ? error.message : String(error)}`);
    return new Date();
  }
}

export const markExternalInterest = async (eventId: string) => {
  try {
    const user = getAuth().currentUser;
    if (!user) throw new Error("User not logged in");

    const userRef = firestore().collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const eventRef = firestore().collection("events").doc(eventId);

    await eventRef.update({
      [`interested.${user.uid}.clickedRegistration`]: true,
      externalClicks: firestore.FieldValue.increment(1),
    });

    console.log("External interest registered successfully");
  } catch (error) {
    console.error("Error in markExternalInterest:", error);
    throw error;
  }
};

export const toggleEventInterest = async (eventId: string) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not logged in");

  const userRef = firestore().collection("users").doc(user.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  const eventRef = firestore().collection("events").doc(eventId);
  const eventDoc = await eventRef.get();
  const eventData = eventDoc.data();

  const isInterested = eventData?.interested?.[user.uid];

  if (isInterested) {
    // Remove interest
    await eventRef.update({
      [`interested.${user.uid}`]: firestore.FieldValue.delete(),
      interestedCount: firestore.FieldValue.increment(-1),
    });
  } else {
    // Add interest
    await eventRef.update({
      [`interested.${user.uid}`]: {
        name: userData?.name || user.displayName || "Anonymous",
        email: user.email || "",
        clickedRegistration: false,
        timestamp: new Date().toISOString(),
      },
      interestedCount: firestore.FieldValue.increment(1),
    });
  }

  return !isInterested;
};

export const confirmExternalAttendance = async (eventId: string) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not logged in");

  const userRef = firestore().collection("users").doc(user.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  const eventRef = firestore().collection("events").doc(eventId);

  await eventRef.update({
    [`attendees.${user.uid}`]: {
      name: userData?.name || user.displayName || "Anonymous",
      avatarUrl: userData?.avatarUrl || "",
      email: user.email || "",
      checkedIn: false,
      timestamp: new Date().toISOString()
    }
  });
};