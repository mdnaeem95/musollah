/* eslint-disable require-jsdoc */
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/logger";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {defineString, defineSecret} from "firebase-functions/params";
import {DryRunManager} from "../utils/dryRun";
import {Restaurant, RestaurantUpdate} from "../types";

// Environment parameter (plain param)
const DRY_RUN = defineString("DRY_RUN", {default: "false"});

// Secret (Secret Manager) for API key
const GOOGLE_PLACES_API_KEY = defineSecret("GOOGLE_PLACES_API_KEY");

/**
 * Example scraper with dry-run support (Cloud Functions v2)
 *
 * Schedule: Every Sunday at 2 AM Singapore time
 * Memory: 1GiB
 * Timeout: 540 seconds (9 minutes)
 */
export const exampleScraper = onSchedule(
  {
    schedule: "0 2 * * 0",
    timeZone: "Asia/Singapore",
    memory: "1GiB",
    timeoutSeconds: 540,
    secrets: [GOOGLE_PLACES_API_KEY],
  },
  async (event) => {
    void event;

    const startTime = Date.now();
    const db = getFirestore();

    const dryRunMode = DRY_RUN.value() === "true";
    const dryRun = new DryRunManager(dryRunMode);

    logger.info("🚀 Starting example scraper...", {dryRun: dryRunMode});

    try {
      const restaurantsSnapshot = await db
        .collection("restaurants")
        .where("isActive", "==", true)
        .limit(10)
        .get();

      logger.info(`📊 Checking ${restaurantsSnapshot.size} restaurants`);

      let updatesFound = 0;
      const errors: string[] = [];

      // If you actually need the key:
      const apiKey = GOOGLE_PLACES_API_KEY.value();
      void apiKey; // remove this when you actually use apiKey

      for (const doc of restaurantsSnapshot.docs) {
        const restaurant = doc.data() as Restaurant;

        try {
          // Demo logic
          const hasUpdate = Math.random() > 0.7;

          if (hasUpdate) {
            const update: RestaurantUpdate = {
              restaurantId: doc.id,
              field: "hours",
              oldValue: restaurant.hours,
              newValue: "Monday-Sunday: 10:00-22:00",
              source: "Example Scraper",
              confidence: 0.9,
              timestamp: Timestamp.now(),
              status: "pending",
            };

            await dryRun.recordUpdate(update);
            updatesFound++;
          }

          await sleep(100);
        } catch (error) {
          const errorMsg = `Error: ${restaurant.name}: ${String(error)}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      await dryRun.saveDryRunResults();

      const summary = dryRun.getSummary();

      logger.info("📈 Scraper Summary:", {
        dryRun: dryRunMode,
        restaurantsChecked: restaurantsSnapshot.size,
        updatesFound,
        errors: errors.length,
        duration: Date.now() - startTime,
        breakdown: summary,
      });

      await db.collection("scraper_logs").add({
        scraper: "example",
        timestamp: Timestamp.now(),
        restaurantsChecked: restaurantsSnapshot.size,
        updatesFound,
        errors,
        duration: Date.now() - startTime,
        dryRun: dryRunMode,
      });

      return; // IMPORTANT: v2 scheduled functions return void
    } catch (error) {
      logger.error("❌ Scraper failed:", error);
      throw error;
    }
  }
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
