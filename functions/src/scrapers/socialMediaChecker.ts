/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import * as admin from "firebase-admin";
import axios from "axios";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/logger";
import {Restaurant} from "../types";

// Ensure Firebase Admin is initialised exactly once
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Social Media Activity Checker (Cloud Functions v2)
 *
 * Checks if restaurant Instagram still active
 * Runs: Monthly (1st of month, 4 AM SGT)
 */
export const checkSocialMediaActivity = onSchedule(
  {
    schedule: "0 4 1 * *",
    timeZone: "Asia/Singapore",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (event) => {
    void event;

    const db = admin.firestore();

    logger.info("📱 Starting social media activity checker...");

    const restaurantsSnapshot = await db
      .collection("restaurants")
      .where("isActive", "==", true)
      .get();

    let flagged = 0;

    for (const doc of restaurantsSnapshot.docs) {
      const restaurant = doc.data() as Restaurant;

      const ig = restaurant.socials?.instagram;
      if (!ig) continue;

      try {
        const isActive = await checkInstagramActive(ig);

        if (!isActive) {
          // Flag for manual review
          await db.collection("restaurant_updates").add({
            restaurantId: doc.id,
            field: "isActive",
            oldValue: true,
            newValue: false,
            source: "Instagram Activity Check",
            confidence: 0.6, // lower confidence, needs manual review
            timestamp: admin.firestore.Timestamp.now(),
            status: "pending",
          });

          flagged += 1;
        }

        // small throttle to reduce getting blocked
        await sleep(150);
      } catch (err) {
        logger.warn(
          `Instagram check failed for ${restaurant.name ?? doc.id}:`,
          err
        );
      }
    }

    logger.info(`✅ Social media check complete. Flagged: ${flagged}`);

    return; // IMPORTANT: v2 scheduled handlers should return void
  }
);

async function checkInstagramActive(instagramUrl: string): Promise<boolean> {
  try {
    // Extract username from URL
    const username = instagramUrl.split("/").filter(Boolean).pop();
    if (!username) return true; // can't check, assume active

    // NOTE:
    // Instagram often blocks scraping. This only checks if the profile page is reachable.
    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MusollahApp/1.0)",
      },
      timeout: 20000,
      // Treat 404/410 as "inactive", but avoid throwing for other statuses so we can decide.
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status === 404 || response.status === 410) return false;
    if (response.status >= 200 && response.status < 400) return true;

    // 429, 403, etc. likely rate-limited/blocked — don’t mark inactive off this
    return true;
  } catch {
    // Network/timeout errors: don't confidently mark inactive
    return true;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
