/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable valid-jsdoc */
/**
 * Restaurant rating backfill
 *
 * The Google Places scraper already fetches `place.rating` + `user_ratings_total`
 * but never saved them, so most restaurants have no `rating` (the field the app's
 * cards + detail page read). This backfills the aggregated Google rating onto any
 * restaurant that doesn't have one.
 *
 * Idempotent: every processed restaurant is stamped with `lastRatingSync`, so the
 * job is attempted at most once per restaurant. Repeated runs continue through the
 * backlog and become cheap no-ops once everything has been attempted (including
 * places that genuinely aren't on Google — so we don't keep paying to re-query them).
 *
 * Triggers:
 *   - scheduledRatingBackfill: daily, processes a batch automatically.
 *   - backfillRestaurantRatings: HTTP, for testing / accelerating (?dryRun=true&limit=N).
 */

import * as admin from "firebase-admin";
import axios from "axios";
import {onRequest} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import {Restaurant} from "../types";
import {buildSearchStrategies} from "./googlePlacesScraper";

const GOOGLE_PLACES_API_KEY = defineSecret("GOOGLE_PLACES_API_KEY");

if (!admin.apps.length) {
  admin.initializeApp();
}

const SG_CENTER = {latitude: 1.3521, longitude: 103.8198};
const GOOGLE_PLACES_COST_PER_CALL = 0.017; // USD, Text Search

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * True if a matched Google place plausibly IS this restaurant, rather than the
 * food court / kopitiam it sits inside. Compares the restaurant's primary name
 * (the part before "@" or " - ", parentheticals stripped) against the Google
 * name — so "Kamala Express @ Kedai Kopi 108" won't inherit "Kedai Kopi 108"'s rating.
 */
function primaryNameMatches(restaurantName: string, googleName: string): boolean {
  const norm = (s: string) =>
    s
      .replace(/\([^)]*\)/g, " ")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(the|restaurant|cafe|pte|ltd|sg|singapore|halal)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const primary = norm(restaurantName.split(/@| - /)[0]);
  const g = norm(googleName);
  if (!primary || !g) return false;
  if (g.includes(primary) || primary.includes(g)) return true;
  const pt = primary.split(" ").filter(Boolean);
  const gt = new Set(g.split(" ").filter(Boolean));
  if (pt.length === 0) return false;
  const overlap = pt.filter((t) => gt.has(t)).length / pt.length;
  return overlap >= 0.6; // most of the restaurant's name tokens appear in the Google name
}

interface BackfillResult {
  scanned: number;
  candidates: number;
  processed: number;
  updatedWithRating: number;
  foundNoRating: number;
  notFound: number;
  apiCalls: number;
  remaining: number;
  estCost: string;
  samples: Array<{name: string; rating: number | null; total: number; googleName?: string}>;
}

/**
 * Backfill Google ratings onto restaurants that don't have one yet.
 */
export async function runRatingBackfill(
  db: admin.firestore.Firestore,
  apiKey: string,
  opts: {dryRun: boolean; limit: number}
): Promise<BackfillResult> {
  const {dryRun, limit} = opts;

  // Read the whole collection (hundreds of docs — cheap) so we also catch old
  // restaurants that predate the scrape and may lack an `isActive` flag.
  const snapshot = await db.collection("restaurants").get();

  const hasRating = (r: Restaurant) => typeof r.rating === "number" && (r.rating as number) > 0;
  const attempted = (r: Restaurant) => !!r.lastRatingSync;

  const candidates = snapshot.docs.filter((d) => {
    const r = d.data() as Restaurant;
    return !hasRating(r) && !attempted(r);
  });

  const batch = candidates.slice(0, limit);

  logger.info(`Rating backfill: scanned=${snapshot.size}, need-rating=${candidates.length}, processing=${batch.length}, dryRun=${dryRun}`);

  let apiCalls = 0;
  let updatedWithRating = 0;
  let foundNoRating = 0;
  let notFound = 0;
  const samples: BackfillResult["samples"] = [];

  for (const doc of batch) {
    const r = doc.data() as Restaurant;
    const name = r.name || "";
    const address = r.address || "";
    const postal = r.postal;
    const coords = r.location && typeof r.location.latitude === "number" ?
      {latitude: r.location.latitude, longitude: r.location.longitude} :
      SG_CENTER;

    const strategies = buildSearchStrategies(name, address, postal);
    let place: any = null;

    for (const strategy of strategies) {
      try {
        const resp = await axios.get(
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
        apiCalls++;
        const top = resp.data?.results?.[0];
        // Only accept a result whose name actually matches this restaurant, so a
        // stall doesn't inherit the rating of the food court it's matched to.
        if (top && primaryNameMatches(name, top.name || "")) {
          place = top;
          break;
        }
        await sleep(200); // rate limit between strategies
      } catch (err: any) {
        logger.warn(`Places search error for "${name}": ${err.message}`);
      }
    }

    // Always stamp lastRatingSync so this restaurant isn't re-queried next run.
    const update: Record<string, any> = {
      lastRatingSync: admin.firestore.Timestamp.now(),
    };

    let ratingForSample: number | null = null;
    let totalForSample = 0;

    if (place) {
      const rating = typeof place.rating === "number" ? place.rating : null;
      const total = typeof place.user_ratings_total === "number" ? place.user_ratings_total : 0;
      update.googlePlaceId = place.place_id || "";
      update.googleName = place.name || "";
      if (rating !== null && rating > 0) {
        update.rating = rating;
        update.userRatingsTotal = total;
        updatedWithRating++;
        ratingForSample = rating;
        totalForSample = total;
        logger.info(`✓ ${name} → ${rating} (${total}) [${place.name}]`);
      } else {
        foundNoRating++;
        logger.info(`~ ${name} → found "${place.name}" but no rating`);
      }
    } else {
      notFound++;
      logger.info(`✗ ${name} → no confident name match on Google`);
    }

    if (!dryRun) {
      await doc.ref.update(update);
    }

    if (samples.length < 8) {
      samples.push({name, rating: ratingForSample, total: totalForSample, googleName: place?.name});
    }

    await sleep(150); // gentle pacing between restaurants
  }

  const remaining = Math.max(0, candidates.length - batch.length);
  const estCost = `$${(apiCalls * GOOGLE_PLACES_COST_PER_CALL).toFixed(2)}`;

  logger.info(`Rating backfill done: updated=${updatedWithRating}, foundNoRating=${foundNoRating}, notFound=${notFound}, apiCalls=${apiCalls}, remaining=${remaining}, estCost=${estCost}`);

  return {
    scanned: snapshot.size,
    candidates: candidates.length,
    processed: batch.length,
    updatedWithRating,
    foundNoRating,
    notFound,
    apiCalls,
    remaining,
    estCost,
    samples,
  };
}

/**
 * Manual / dry-run trigger. Hit this to test or to accelerate the backfill.
 * Example: ...cloudfunctions.net/backfillRestaurantRatings?dryRun=true&limit=50
 */
export const backfillRestaurantRatings = onRequest(
  {timeoutSeconds: 540, memory: "1GiB", secrets: [GOOGLE_PLACES_API_KEY]},
  async (req, res) => {
    const db = admin.firestore();
    const dryRun = req.query.dryRun === "true";
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 400);
    try {
      const result = await runRatingBackfill(db, GOOGLE_PLACES_API_KEY.value(), {dryRun, limit});
      res.status(200).json({success: true, dryRun, ...result});
    } catch (err: any) {
      logger.error("Rating backfill failed:", err);
      res.status(500).json({success: false, error: err.message});
    }
  }
);

/**
 * Scheduled auto-backfill. Runs daily, processes a batch, and converges to a
 * cheap no-op once every restaurant has been attempted.
 */
export const scheduledRatingBackfill = onSchedule(
  {
    schedule: "0 3 * * *", // 03:00 daily
    timeZone: "Asia/Singapore",
    timeoutSeconds: 540,
    memory: "1GiB",
    secrets: [GOOGLE_PLACES_API_KEY],
  },
  async () => {
    const db = admin.firestore();
    const result = await runRatingBackfill(db, GOOGLE_PLACES_API_KEY.value(), {dryRun: false, limit: 150});
    logger.info("Scheduled rating backfill complete", result);
  }
);
