/* eslint-disable valid-jsdoc */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Diagnostic Tool: Categorize MUIS Restaurants
 *
 * Analyzes restaurant names to predict Google Places findability
 *
 * Categories:
 * 1. Standalone - Likely findable (90%)
 * 2. Food Court - Maybe findable (40%)
 * 3. Hawker Stall - Unlikely findable (20%)
 * 4. Mall/Building - Maybe findable (50%)
 */
export const analyzeMUISRestaurants = onRequest(
  {
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    const db = admin.firestore();

    logger.info("🔍 Analyzing MUIS restaurants...");

    try {
      const restaurantsSnapshot = await db
        .collection("restaurants")
        .where("needsReview", "==", true)
        .where("source", "==", "MUIS Discovery")
        .get();

      const categories = {
        standalone: [] as any[],
        foodCourt: [] as any[],
        hawkerStall: [] as any[],
        mallBased: [] as any[],
        university: [] as any[],
        unknown: [] as any[],
      };

      for (const doc of restaurantsSnapshot.docs) {
        const restaurant = doc.data();
        const {name, address, muisScheme, muisSubScheme} = restaurant;

        const category = categorizeRestaurant(name, address, muisScheme, muisSubScheme);

        const entry = {
          id: doc.id,
          name,
          address,
          scheme: muisScheme,
          subScheme: muisSubScheme,
          postal: restaurant.postal,
        };

        switch (category) {
        case "standalone":
          categories.standalone.push(entry);
          break;
        case "foodCourt":
          categories.foodCourt.push(entry);
          break;
        case "hawkerStall":
          categories.hawkerStall.push(entry);
          break;
        case "mallBased":
          categories.mallBased.push(entry);
          break;
        case "university":
          categories.university.push(entry);
          break;
        default:
          categories.unknown.push(entry);
        }
      }

      const summary = {
        total: restaurantsSnapshot.size,
        breakdown: {
          standalone: {
            count: categories.standalone.length,
            percentage: `${((categories.standalone.length / restaurantsSnapshot.size) * 100).toFixed(1)}%`,
            googleFindability: "90%",
            recommendation: "Use Google Places API ✅",
          },
          foodCourt: {
            count: categories.foodCourt.length,
            percentage: `${((categories.foodCourt.length / restaurantsSnapshot.size) * 100).toFixed(1)}%`,
            googleFindability: "40%",
            recommendation: "Try Google, fallback to manual ⚠️",
          },
          hawkerStall: {
            count: categories.hawkerStall.length,
            percentage: `${((categories.hawkerStall.length / restaurantsSnapshot.size) * 100).toFixed(1)}%`,
            googleFindability: "20%",
            recommendation: "Manual entry required ❌",
          },
          mallBased: {
            count: categories.mallBased.length,
            percentage: `${((categories.mallBased.length / restaurantsSnapshot.size) * 100).toFixed(1)}%`,
            googleFindability: "50%",
            recommendation: "Try Google, fallback to manual ⚠️",
          },
          university: {
            count: categories.university.length,
            percentage: `${((categories.university.length / restaurantsSnapshot.size) * 100).toFixed(1)}%`,
            googleFindability: "10%",
            recommendation: "Manual entry required ❌",
          },
          unknown: {
            count: categories.unknown.length,
            percentage: `${((categories.unknown.length / restaurantsSnapshot.size) * 100).toFixed(1)}%`,
            googleFindability: "Unknown",
            recommendation: "Needs review",
          },
        },
      };

      logger.info("📊 Analysis complete:");
      logger.info(JSON.stringify(summary, null, 2));

      res.status(200).json({
        success: true,
        summary,
        samples: {
          standalone: categories.standalone.slice(0, 5),
          foodCourt: categories.foodCourt.slice(0, 5),
          hawkerStall: categories.hawkerStall.slice(0, 5),
          mallBased: categories.mallBased.slice(0, 5),
          university: categories.university.slice(0, 5),
        },
        fullData: {
          standalone: categories.standalone,
          foodCourt: categories.foodCourt,
          hawkerStall: categories.hawkerStall,
          mallBased: categories.mallBased,
          university: categories.university,
          unknown: categories.unknown,
        },
      });
    } catch (error: any) {
      logger.error("Error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Categorize restaurant based on name patterns
 */
function categorizeRestaurant(
  name: string,
  address: string,
  scheme: string,
  subScheme: string
): string {
  const nameLower = name.toLowerCase();
  const addressLower = address.toLowerCase();

  // University food courts (very unlikely to be in Google)
  if (
    addressLower.includes("nus") ||
    addressLower.includes("ntu") ||
    addressLower.includes("smu") ||
    addressLower.includes("university")
  ) {
    return "university";
  }

  // Hawker stalls (unlikely to be in Google)
  if (
    subScheme === "Hawker" ||
    nameLower.includes("@ hawker") ||
    nameLower.includes("@hawker") ||
    nameLower.includes("@ kedai kopi") ||
    nameLower.includes("@kedai kopi") ||
    addressLower.includes("hawker") ||
    addressLower.includes("coffee shop")
  ) {
    return "hawkerStall";
  }

  // Food court vendors (maybe findable)
  if (
    nameLower.includes("@ koufu") ||
    nameLower.includes("@koufu") ||
    nameLower.includes("@ kopitiam") ||
    nameLower.includes("@kopitiam") ||
    nameLower.includes("@ food") ||
    nameLower.includes("@food") ||
    nameLower.includes("(s1)") ||
    nameLower.includes("(s2)") ||
    nameLower.includes("(s3)") ||
    nameLower.match(/\(s\d+\)/i)
  ) {
    return "foodCourt";
  }

  // Mall-based (maybe findable)
  if (
    addressLower.includes("plaza") ||
    addressLower.includes("mall") ||
    addressLower.includes("shopping") ||
    nameLower.includes("@") // General @ symbol often indicates food court
  ) {
    return "mallBased";
  }

  // Standalone restaurants (likely findable)
  if (
    scheme === "Eating Establishment" &&
    (subScheme === "Restaurant" ||
      subScheme === "Snack Bar / Bakery" ||
      subScheme === "Fast Food")
  ) {
    // Double-check it's not a food court vendor
    if (!nameLower.includes("@") && !nameLower.match(/\(s\d+\)/i)) {
      return "standalone";
    }
  }

  return "unknown";
}
