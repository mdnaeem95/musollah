import {initializeApp} from "firebase-admin/app";

initializeApp();

// Test functions
export {testScraperManual} from "./test/testScraper";
export {testMuisScraper} from "./test/testMuisScraper";
export {debugMuisApi} from "./test/debugMuisApi";
export {testMuisDiscovery} from "./scrapers/muisDiscovery";
export {debugMuisDiscovery} from "./test/debugMuisDiscovery";

// Production scrapers
export {scrapeMUISCertifications} from "./scrapers/muisScraper";
export {scrapeGooglePlaces} from "./scrapers/googlePlacesScraper";
export {checkSocialMediaActivity} from "./scrapers/socialMediaChecker";
export {discoverMUISRestaurants} from "./scrapers/muisDiscovery";
