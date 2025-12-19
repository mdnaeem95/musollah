/* eslint-disable valid-jsdoc */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import * as admin from "firebase-admin";
import axios from "axios";
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import {Restaurant} from "../types";
import {getCoordinatesFromPostal} from "../utils/oneMapGeocoding";

const GOOGLE_PLACES_API_KEY = defineSecret("GOOGLE_PLACES_API_KEY");

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * IMPROVED Google Places Scraper v2.0
 *
 * NEW FEATURES:
 * ✅ OneMap API integration (postal → coordinates)
 * ✅ Multiple search strategies for hawker stalls
 * ✅ Better logging and debugging
 * ✅ Handles food court vendors
 *
 * Usage:
 * ?dryRun=true&limit=10&prioritizeNew=true&updateCoords=true
 */
export const testGooglePlacesScraper = onRequest(
  {
    timeoutSeconds: 540,
    memory: "1GiB",
    secrets: [GOOGLE_PLACES_API_KEY],
  },
  async (req, res) => {
    const db = admin.firestore();
    const apiKey = GOOGLE_PLACES_API_KEY.value();

    // Parse query parameters
    const dryRun = req.query.dryRun === "true";
    const limit = parseInt(req.query.limit as string) || 50;
    const prioritizeNew = req.query.prioritizeNew === "true";
    const updateCoords = req.query.updateCoords !== "false"; // Default true

    const startTime = Date.now();

    logger.info("🗺️ Starting Google Places scraper v2.0 (TEST MODE)...");
    logger.info(`📊 Settings: dryRun=${dryRun}, limit=${limit}, prioritizeNew=${prioritizeNew}, updateCoords=${updateCoords}`);

    try {
      // Query logic
      let restaurantsSnapshot;

      if (prioritizeNew) {
        logger.info("📍 Prioritizing needsReview restaurants...");

        restaurantsSnapshot = await db
          .collection("restaurants")
          .where("isActive", "==", true)
          .where("needsReview", "==", true)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();

        logger.info(`Found ${restaurantsSnapshot.size} restaurants needing review`);
      } else {
        const cutoffDate = admin.firestore.Timestamp.fromMillis(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        );

        restaurantsSnapshot = await db
          .collection("restaurants")
          .where("isActive", "==", true)
          .where("lastVerified", "<=", cutoffDate)
          .limit(limit)
          .get();
      }

      const directUpdates: any[] = [];
      const pendingUpdates: any[] = [];
      const coordsUpdated: any[] = [];
      let apiCallsMade = 0;
      let successfulLookups = 0;
      let notFound = 0;
      let oneMapCalls = 0;

      for (const doc of restaurantsSnapshot.docs) {
        const restaurant = doc.data() as Restaurant;
        const {name, address, postal, location} = restaurant;
        const isNewRestaurant = restaurant.needsReview === true;

        logger.info(`\n${"=".repeat(80)}`);
        logger.info(`📍 Processing: ${name}`);
        logger.info(`   Address: ${address}`);
        logger.info(`   Postal: ${postal || "N/A"}`);
        logger.info(`   Current Coords: ${location ? `${location.latitude}, ${location.longitude}` : "N/A"}`);
        logger.info(`   Status: ${isNewRestaurant ? "🆕 NEW (auto-fill)" : "✅ EXISTING (verify)"}`);

        try {
          // STEP 1: Get accurate coordinates from postal code
          let coords = location;
          const isDefaultLocation = location &&
            Math.abs(location.latitude - 1.3521) < 0.001 &&
            Math.abs(location.longitude - 103.8198) < 0.001;

          if (updateCoords && postal && isDefaultLocation) {
            logger.info("🔄 Updating coordinates from postal code...");
            const oneMapCoords = await getCoordinatesFromPostal(postal);
            oneMapCalls++;

            if (oneMapCoords) {
              coords = oneMapCoords;
              logger.info(`✅ OneMap: ${postal} → (${coords.latitude}, ${coords.longitude})`);

              // Update coordinates in Firestore
              if (!dryRun) {
                await doc.ref.update({location: coords});
              }

              coordsUpdated.push({
                restaurantId: doc.id,
                name,
                postal,
                oldCoords: location,
                newCoords: coords,
              });
            } else {
              logger.warn(`❌ OneMap: Could not find coordinates for postal ${postal}`);
            }

            await sleep(250); // OneMap rate limit
          } else if (!coords) {
            logger.warn("⚠️ No coordinates available, using Singapore center");
            coords = new admin.firestore.GeoPoint(1.3521, 103.8198);
          }

          // STEP 2: Search Google Places with multiple strategies
          const searchStrategies = buildSearchStrategies(name, address, postal);

          logger.info(`🔍 Trying ${searchStrategies.length} search strategies...`);

          let placeData = null;

          for (let i = 0; i < searchStrategies.length; i++) {
            const strategy = searchStrategies[i];
            logger.info(`\n   Strategy ${i + 1}: ${strategy.description}`);
            logger.info(`   Query: "${strategy.query}"`);
            logger.info(`   Location: (${coords.latitude}, ${coords.longitude})`);
            logger.info(`   Radius: ${strategy.radius}m`);

            try {
              const searchResponse = await axios.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                {
                  params: {
                    query: strategy.query,
                    location: `${coords.latitude},${coords.longitude}`,
                    radius: strategy.radius,
                    key: apiKey,
                  },
                  timeout: 10000,
                }
              );

              apiCallsMade++;
              const results = searchResponse.data.results;

              if (results && results.length > 0) {
                const place = results[0];
                logger.info(`   ✅ FOUND: ${place.name}`);
                logger.info(`   Address: ${place.formatted_address}`);
                logger.info(`   Rating: ${place.rating || "N/A"} (${place.user_ratings_total || 0} reviews)`);

                // Extract data
                placeData = {
                  hours: place.opening_hours?.weekday_text?.join(", ") || "",
                  number: place.formatted_phone_number || "",
                  address: place.formatted_address || address,
                  website: place.website || "",
                  location: place.geometry?.location ?
                    new admin.firestore.GeoPoint(
                      place.geometry.location.lat,
                      place.geometry.location.lng
                    ) :
                    coords,
                  googlePlaceId: place.place_id,
                  googleName: place.name,
                };

                successfulLookups++;
                break; // Found it, stop searching
              } else {
                logger.info("   ❌ Not found with this strategy");
              }

              await sleep(200); // Rate limiting between requests
            } catch (error: any) {
              logger.error(`   ⚠️ Error with strategy ${i + 1}:`, error.message);
            }
          }

          if (!placeData) {
            logger.warn(`\n❌ NOT FOUND: Could not locate "${name}" in Google Places after ${searchStrategies.length} attempts`);
            notFound++;
            continue;
          }

          // STEP 3: Log extracted data
          logger.info("\n📊 Extracted Data:");
          logger.info(`   Hours: ${placeData.hours ? "✅ " + placeData.hours.substring(0, 50) + "..." : "❌ None"}`);
          logger.info(`   Phone: ${placeData.number ? "✅ " + placeData.number : "❌ None"}`);
          logger.info(`   Website: ${placeData.website ? "✅ " + placeData.website : "❌ None"}`);
          logger.info(`   Coordinates: (${placeData.location.latitude}, ${placeData.location.longitude})`);
          logger.info(`   Google Name: ${placeData.googleName}`);

          // STEP 4: Decide action based on restaurant status
          if (isNewRestaurant) {
            // AUTO-FILL new restaurants directly
            logger.info("\n🚀 AUTO-FILL MODE: Updating Firestore directly");

            if (!dryRun) {
              await doc.ref.update({
                hours: placeData.hours || "",
                number: placeData.number || "",
                address: placeData.address,
                menuUrl: placeData.website || "",
                location: placeData.location,
                lastVerified: admin.firestore.Timestamp.now(),
                lastUpdated: admin.firestore.Timestamp.now(),
              });
            }

            directUpdates.push({
              restaurantId: doc.id,
              name,
              googleName: placeData.googleName,
              updates: {
                hours: placeData.hours ? "✅" : "❌",
                number: placeData.number ? "✅" : "❌",
                website: placeData.website ? "✅" : "❌",
                coords: "✅",
              },
            });
          } else {
            // CREATE PENDING UPDATES for existing restaurants
            logger.info("\n📝 VERIFY MODE: Creating pending updates");

            const updates: any[] = [];

            if (placeData.hours && placeData.hours !== restaurant.hours) {
              updates.push({
                restaurantId: doc.id,
                field: "hours",
                oldValue: restaurant.hours || "",
                newValue: placeData.hours,
                source: "Google Places",
                confidence: 0.9,
                timestamp: admin.firestore.Timestamp.now(),
                status: "pending",
              });
            }

            if (placeData.number && placeData.number !== restaurant.number) {
              updates.push({
                restaurantId: doc.id,
                field: "number",
                oldValue: restaurant.number || "",
                newValue: placeData.number,
                source: "Google Places",
                confidence: 0.85,
                timestamp: admin.firestore.Timestamp.now(),
                status: "pending",
              });
            }

            if (placeData.website && placeData.website !== restaurant.menuUrl) {
              updates.push({
                restaurantId: doc.id,
                field: "menuUrl",
                oldValue: restaurant.menuUrl || "",
                newValue: placeData.website,
                source: "Google Places",
                confidence: 0.7,
                timestamp: admin.firestore.Timestamp.now(),
                status: "pending",
              });
            }

            if (updates.length > 0) {
              if (!dryRun) {
                const batch = db.batch();
                for (const update of updates) {
                  const ref = db.collection("restaurant_updates").doc();
                  batch.set(ref, update);
                }
                await batch.commit();
              }

              pendingUpdates.push({
                restaurantId: doc.id,
                name,
                updateCount: updates.length,
                fields: updates.map((u) => u.field),
              });
            }
          }
        } catch (error: any) {
          logger.error(`❌ Error processing ${name}:`, error.message);
        }
      }

      // Calculate costs
      const googlePlacesCost = (apiCallsMade * 0.017).toFixed(2);
      const totalCost = parseFloat(googlePlacesCost);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const summary = {
        restaurantsProcessed: restaurantsSnapshot.size,
        apiCalls: {
          googlePlaces: apiCallsMade,
          oneMap: oneMapCalls,
        },
        results: {
          successfulLookups,
          notFound,
          coordsUpdated: coordsUpdated.length,
          directUpdates: directUpdates.length,
          pendingUpdates: pendingUpdates.length,
        },
        costs: {
          googlePlaces: `$${googlePlacesCost}`,
          oneMap: "$0.00 (FREE)",
          total: `$${totalCost.toFixed(2)}`,
        },
        successRate: `${((successfulLookups / restaurantsSnapshot.size) * 100).toFixed(1)}%`,
      };

      logger.info("\n" + "=".repeat(80));
      logger.info("📊 FINAL SUMMARY:");
      logger.info(JSON.stringify(summary, null, 2));

      res.status(200).json({
        success: true,
        dryRun,
        duration: `${duration}s`,
        summary,
        details: {
          directUpdates: dryRun ? directUpdates : directUpdates.slice(0, 5),
          pendingUpdates: dryRun ? pendingUpdates : pendingUpdates.slice(0, 5),
          coordsUpdated: dryRun ? coordsUpdated : coordsUpdated.slice(0, 5),
        },
        message: dryRun ?
          `Would auto-fill ${directUpdates.length} new restaurants, create ${pendingUpdates.length} pending updates, and update ${coordsUpdated.length} coordinates` :
          `Auto-filled ${directUpdates.length} new restaurants, created ${pendingUpdates.length} pending updates, and updated ${coordsUpdated.length} coordinates`,
      });
    } catch (error: any) {
      logger.error("Error in Google Places scraper:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Build multiple search strategies for a restaurant
 * Tries different combinations to maximize success rate
 */
function buildSearchStrategies(name: string, address: string, postal?: string) {
  const strategies: Array<{query: string; radius: number; description: string}> = [];

  // Strategy 1: Name + Postal (best for most restaurants)
  if (postal) {
    strategies.push({
      query: `${name} ${postal}`,
      radius: 500,
      description: "Name + Postal (500m)",
    });
  }

  // Strategy 2: Name only with larger radius
  strategies.push({
    query: name,
    radius: 1000,
    description: "Name only (1km)",
  });

  // Strategy 3: Extract parent location for hawker stalls
  // Example: "HJH MAIMUNAH @ KOPITIAM" → "KOPITIAM"
  const parentMatch = name.match(/@\s*(.+?)(?:\s|$)/);
  if (parentMatch && postal) {
    const parentLocation = parentMatch[1].trim();
    strategies.push({
      query: `${parentLocation} ${postal}`,
      radius: 200,
      description: `Parent location: "${parentLocation}" + Postal (200m)`,
    });
  }

  // Strategy 4: Name + Street (from address)
  const street = address.match(/^[\d\s]+([A-Z\s]+?)(?:#|\d{6})/)?.[1]?.trim();
  if (street && street.length > 5) {
    strategies.push({
      query: `${name} ${street}`,
      radius: 800,
      description: `Name + Street: "${street}" (800m)`,
    });
  }

  // Strategy 5: Last resort - name with very large radius
  strategies.push({
    query: name,
    radius: 2000,
    description: "Name only (2km - last resort)",
  });

  return strategies;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
