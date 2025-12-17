/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/logger";
import {RestaurantUpdate} from "./types";

// Ensure Firebase Admin is initialised exactly once
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Automatically approve high-confidence updates
 * Runs: Every hour
 */
export const autoApproveUpdates = onSchedule(
  {
    schedule: "0 * * * *", // Every hour
    timeZone: "Asia/Singapore",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (event) => {
    void event;

    const db = admin.firestore();

    // Get pending updates with high confidence
    const pendingUpdates = await db
      .collection("restaurant_updates")
      .where("status", "==", "pending")
      .where("confidence", ">=", 0.9)
      .get();

    if (pendingUpdates.empty) {
      logger.info("✅ Auto-approve: no eligible updates found.");
      return;
    }

    const batch = db.batch();

    for (const updateDoc of pendingUpdates.docs) {
      const update = updateDoc.data() as RestaurantUpdate;

      // Apply update to restaurant
      const restaurantRef = db.collection("restaurants").doc(update.restaurantId);
      batch.update(restaurantRef, {
        [update.field]: update.newValue,
        lastUpdated: admin.firestore.Timestamp.now(),
      });

      // Mark update as approved
      batch.update(updateDoc.ref, {
        status: "approved",
        approvedAt: admin.firestore.Timestamp.now(),
        approvedBy: "auto",
      });
    }

    await batch.commit();

    logger.info(`✅ Auto-approved ${pendingUpdates.size} updates`);

    return; // IMPORTANT: v2 scheduled handlers should return void
  }
);
