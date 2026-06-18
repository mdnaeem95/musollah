/* eslint-disable max-len */
import {initializeApp} from "firebase-admin/app";

initializeApp();

// Test functions
export {testMuisDiscovery} from "./scrapers/muisDiscovery";
export {testGooglePlacesScraper} from "./scrapers/googlePlacesScraper"; // ✅ ADD THIS

// Production scrapers
export {scrapeMUISCertifications} from "./scrapers/muisScraper";
export {checkSocialMediaActivity} from "./scrapers/socialMediaChecker";
export {discoverMUISRestaurants} from "./scrapers/muisDiscovery";

// Restaurant rating backfill (Google Places rating -> restaurant docs)
export {backfillRestaurantRatings, scheduledRatingBackfill} from "./scrapers/ratingBackfill";

// Utils
export {migrateRestaurantSchema} from "./utils/migrateRestaurants";
export {analyzeMUISRestaurants} from "./utils/analyzeMUISRestaurants";
export {debugFirestoreQuery} from "./utils/debugFirestoreQuery";
