/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import * as admin from "firebase-admin";
import axios from "axios";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/logger";
import {defineSecret} from "firebase-functions/params";
import {Restaurant, RestaurantUpdate} from "../types";

// Store API key as a Firebase Functions Secret (v2)
const GOOGLE_PLACES_API_KEY = defineSecret("GOOGLE_PLACES_API_KEY");

// Ensure Firebase Admin is initialised exactly once
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Google Places API Scraper (Cloud Functions v2)
 *
 * Updates: hours, phone, address, operational status
 * Runs: Weekly on Sundays at 2 AM (SGT)
 */
export const scrapeGooglePlaces = onSchedule(
  {
    schedule: "0 2 * * 0", // Sunday 2 AM
    timeZone: "Asia/Singapore",
    timeoutSeconds: 540,
    memory: "1GiB",
    secrets: [GOOGLE_PLACES_API_KEY],
  },
  async (event) => {
    void event;

    const db = admin.firestore();
    const apiKey = GOOGLE_PLACES_API_KEY.value();

    logger.info("🗺️ Starting Google Places scraper...");

    // Get restaurants that haven't been verified in last 7 days
    const cutoffDate = admin.firestore.Timestamp.fromMillis(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const restaurantsSnapshot = await db
      .collection("restaurants")
      .where("isActive", "==", true)
      .where("lastVerified", "<=", cutoffDate)
      .limit(50) // Process in batches to avoid timeout
      .get();

    const updates: RestaurantUpdate[] = [];

    for (const doc of restaurantsSnapshot.docs) {
      const restaurant = doc.data() as Restaurant;

      try {
        // Step 1: Find Place ID using name + coordinates
        const placeId = await findGooglePlaceId(
          restaurant.name,
          restaurant.location,
          apiKey
        );

        if (!placeId) {
          logger.warn(`⚠️ No Google Place ID found for ${restaurant.name}`);
          continue;
        }

        // Step 2: Get Place Details
        const placeDetails = await getGooglePlaceDetails(placeId, apiKey);
        if (!placeDetails) continue;

        // Step 3: Compare and create updates

        // Check if permanently closed
        if (placeDetails.business_status === "CLOSED_PERMANENTLY") {
          updates.push({
            restaurantId: doc.id,
            field: "isActive",
            oldValue: true,
            newValue: false,
            source: "Google Places",
            confidence: 0.95,
            timestamp: admin.firestore.Timestamp.now(),
            status: "pending",
          });
        }

        // Check operating hours
        if (placeDetails.opening_hours?.weekday_text) {
          const newHours = placeDetails.opening_hours.weekday_text.join(",");
          if (newHours !== restaurant.hours) {
            updates.push({
              restaurantId: doc.id,
              field: "hours",
              oldValue: restaurant.hours ?? "",
              newValue: newHours,
              source: "Google Places",
              confidence: 0.9,
              timestamp: admin.firestore.Timestamp.now(),
              status: "pending",
            });
          }
        }

        // Check phone number
        if (placeDetails.formatted_phone_number) {
          const newPhone = placeDetails.formatted_phone_number;
          if (newPhone !== restaurant.number) {
            updates.push({
              restaurantId: doc.id,
              field: "number",
              oldValue: restaurant.number || "",
              newValue: newPhone,
              source: "Google Places",
              confidence: 0.85,
              timestamp: admin.firestore.Timestamp.now(),
              status: "pending",
            });
          }
        }

        // Check address
        if (placeDetails.formatted_address) {
          const newAddress = placeDetails.formatted_address;
          if (newAddress !== restaurant.address) {
            updates.push({
              restaurantId: doc.id,
              field: "address",
              oldValue: restaurant.address ?? "",
              newValue: newAddress,
              source: "Google Places",
              confidence: 0.9,
              timestamp: admin.firestore.Timestamp.now(),
              status: "pending",
            });
          }
        }

        // Update lastVerified timestamp
        await doc.ref.update({
          lastVerified: admin.firestore.Timestamp.now(),
        });

        // Respect rate limits (basic throttle)
        await sleep(100);
      } catch (error) {
        logger.error(`Error scraping ${restaurant.name}:`, error);
      }
    }

    // Save updates
    if (updates.length > 0) {
      const batch = db.batch();
      for (const update of updates) {
        const ref = db.collection("restaurant_updates").doc();
        batch.set(ref, update);
      }
      await batch.commit();
      logger.info(`✅ Found ${updates.length} updates from Google Places`);
    } else {
      logger.info("✅ No Google Places updates found");
    }

    return; // IMPORTANT: v2 scheduled handlers should return void
  }
);

async function findGooglePlaceId(
  name: string,
  location: FirebaseFirestore.GeoPoint,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
      {
        params: {
          input: name,
          inputtype: "textquery",
          locationbias: `circle:100@${location.latitude},${location.longitude}`,
          fields: "place_id",
          key: apiKey,
        },
        timeout: 30000,
      }
    );

    const candidates = response.data?.candidates;
    if (Array.isArray(candidates) && candidates.length > 0) {
      return candidates[0].place_id ?? null;
    }

    return null;
  } catch (error) {
    logger.error("Error finding place ID:", error);
    return null;
  }
}

async function getGooglePlaceDetails(placeId: string, apiKey: string) {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          place_id: placeId,
          fields:
            "name,formatted_address,formatted_phone_number,opening_hours, business_status,photos,website",
          key: apiKey,
        },
        timeout: 30000,
      }
    );

    return response.data?.result ?? null;
  } catch (error) {
    logger.error("Error getting place details:", error);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
