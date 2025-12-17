/* eslint-disable max-len */
/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
import * as admin from "firebase-admin";
import axios from "axios";
import https from "https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/v2";
import {Restaurant, RestaurantUpdate} from "../types";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * MUIS Halal Certification Scraper (Production)
 *
 * Uses official MUIS API with CSRF token handling
 * Runs: Daily at 3 AM Singapore time
 */
export const scrapeMUISCertifications = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Asia/Singapore",
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async (event) => {
    void event;

    const startTime = Date.now();
    const db = admin.firestore();

    logger.info("🕌 Starting MUIS certification scraper...");

    try {
      // Step 1: Get CSRF token
      logger.info("Getting CSRF token...");
      const {csrfToken, cookies} = await getMuisSession();

      if (!csrfToken) {
        throw new Error("Failed to get CSRF token from MUIS website");
      }

      logger.info("✅ Got CSRF token");

      // Step 2: Get all restaurants
      const restaurantsSnapshot = await db
        .collection("restaurants")
        .get();

      const updates: RestaurantUpdate[] = [];
      const errors: string[] = [];
      let checked = 0;

      for (const doc of restaurantsSnapshot.docs) {
        const restaurant = doc.data() as Restaurant;

        try {
          const certificationResult = await checkMUISCertificationAPI(
            restaurant.name,
            restaurant.address,
            csrfToken,
            cookies
          );

          const {status} = certificationResult;

          // Only update if status changed and not "Unknown"
          if (status !== "Unknown" && status !== restaurant.status) {
            updates.push({
              restaurantId: doc.id,
              field: "status",
              oldValue: restaurant.status,
              newValue: status,
              source: "MUIS API",
              confidence: 1.0,
              timestamp: admin.firestore.Timestamp.now(),
              status: "pending",
            });

            logger.info(`Status change: ${restaurant.name}`, {
              oldStatus: restaurant.status,
              newStatus: status,
            });
          }

          checked++;

          // Rate limiting (500ms between requests)
          await sleep(500);
        } catch (error) {
          const errorMsg = `Error checking ${restaurant.name}: ${error}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
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
        logger.info(`✅ Found ${updates.length} certification changes`);
      } else {
        logger.info("✅ No certification changes found");
      }

      // Save log
      await db.collection("scraper_logs").add({
        scraper: "MUIS_API",
        timestamp: admin.firestore.Timestamp.now(),
        restaurantsChecked: checked,
        updatesFound: updates.length,
        errors,
        duration: Date.now() - startTime,
      });

      logger.info("🎯 MUIS scraper complete", {
        checked,
        updates: updates.length,
        errors: errors.length,
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
      });

      return;
    } catch (error) {
      logger.error("❌ MUIS scraper error:", error);

      try {
        await db.collection("scraper_logs").add({
          scraper: "MUIS_API",
          timestamp: admin.firestore.Timestamp.now(),
          restaurantsChecked: null,
          updatesFound: null,
          errors: [String(error)],
          duration: Date.now() - startTime,
        });
      } catch (e) {
        logger.error("Failed to write error log:", e);
      }

      throw error;
    }
  }
);

/**
 * Get CSRF token and session cookies from MUIS website
 */
async function getMuisSession(): Promise<{
  csrfToken: string | null;
  cookies: string;
}> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    const response = await axios.get("https://halal.muis.gov.sg/", {
      httpsAgent,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const html = response.data;
    let csrfToken: string | null = null;

    // Try multiple patterns to find CSRF token

    // Pattern 1: Input field
    const inputMatch = html.match(/<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"/i);
    if (inputMatch) {
      csrfToken = inputMatch[1];
    }

    // Pattern 2: Meta tag
    if (!csrfToken) {
      const metaMatch = html.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/i);
      if (metaMatch) {
        csrfToken = metaMatch[1];
      }
    }

    // Pattern 3: JavaScript variable
    if (!csrfToken) {
      const scriptMatch = html.match(/csrfToken["\s]*[:=]["\s]*["']([^"']+)["']/i);
      if (scriptMatch) {
        csrfToken = scriptMatch[1];
      }
    }

    // Get cookies
    const setCookieHeaders = response.headers["set-cookie"] || [];
    const cookies = setCookieHeaders.join("; ");

    logger.info("Session acquired:", {
      csrfTokenFound: !!csrfToken,
      csrfTokenLength: csrfToken?.length || 0,
      cookiesCount: setCookieHeaders.length,
    });

    return {csrfToken, cookies};
  } catch (error) {
    logger.error("Error getting MUIS session:", error);
    return {csrfToken: null, cookies: ""};
  }
}

/**
 * Check MUIS certification using API with CSRF token
 */
async function checkMUISCertificationAPI(
  restaurantName: string,
  address: string,
  csrfToken: string,
  cookies: string
): Promise<{ status: string; details?: any }> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    const apiUrl = "https://halal.muis.gov.sg/api/halal/establishments";

    const response = await axios.post(
      apiUrl,
      {
        text: restaurantName,
      },
      {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-CSRF-TOKEN": csrfToken,
          "Cookie": cookies,
          "Origin": "https://halal.muis.gov.sg",
          "Referer": "https://halal.muis.gov.sg/",
        },
        timeout: 30000,
      }
    );

    const establishments = response.data?.data;

    if (!Array.isArray(establishments) || establishments.length === 0) {
      return {status: "Not Certified"};
    }

    // Search for match
    return searchEstablishments(establishments, restaurantName, address);
  } catch (error: any) {
    logger.error(`Error checking MUIS API for ${restaurantName}:`, {
      error: error.message,
      status: error.response?.status,
    });

    return {status: "Unknown"};
  }
}

/**
 * Search for matching establishment in results
 */
function searchEstablishments(
  establishments: any[],
  restaurantName: string,
  address: string
): { status: string; details?: any } {
  const searchName = restaurantName.toLowerCase().trim();

  // Try exact match first
  let match = establishments.find((est) => {
    const apiName = est.name.toLowerCase().trim();
    return apiName === searchName;
  });

  // Try partial match
  if (!match) {
    match = establishments.find((est) => {
      const apiName = est.name.toLowerCase().trim();
      return apiName.includes(searchName) || searchName.includes(apiName);
    });
  }

  // Try postal code match
  if (!match && address) {
    match = establishments.find((est) => {
      return address.includes(est.postal);
    });
  }

  if (match) {
    return {
      status: "MUIS Halal-Certified",
      details: match,
    };
  }

  return {status: "Not Certified"};
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
