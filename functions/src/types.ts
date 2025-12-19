import {Timestamp, GeoPoint} from "firebase-admin/firestore";

/**
 * Restaurant Type - Matches Firestore Schema
 *
 * Based on actual mobile app structure
 */
export interface Restaurant {
  // Basic Info
  name: string;
  address: string;
  location: GeoPoint;
  image: string;

  // Categories & Hours
  categories: string[];
  hours: string;

  // Contact
  number: string;
  menuUrl?: string; // Website/menu URL (optional)

  // Halal Status
  status: string; // "MUIS Halal-Certified", "Muslim-Owned", etc.

  // Social Media
  socials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };

  // Reviews (calculated from reviews subcollection)
  averageRating?: number;
  totalReviews?: number;

  // === MUIS Discovery Fields (new) ===
  postal?: string; // Singapore postal code
  muisCertNumber?: string; // MUIS certification number
  muisScheme?: string; // "Eating Establishment"
  muisSubScheme?: string; // "Restaurant", "Hawker", "Cafe"

  // Operational Flags
  isActive?: boolean;
  needsReview?: boolean; // Flag for manual completion
  source?: string; // "MUIS Discovery", "Manual Entry"

  // Timestamps
  createdAt?: Timestamp;
  lastVerified?: Timestamp;
  lastUpdated?: Timestamp;
}

export interface RestaurantUpdate {
  restaurantId: string;
  field: string;
  oldValue: any;
  newValue: any;
  source: string;
  confidence: number;
  timestamp: Timestamp;
  status: "pending" | "approved" | "rejected";
}

export interface PrayerLog {
  prayers: {
    Subuh: boolean;
    Zohor: boolean;
    Asar: boolean;
    Maghrib: boolean;
    Isyak: boolean;
  };
  timestamp: Timestamp;
}

export interface PrayerStats {
  totalPrayers: number;
  completedPrayers: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UserProfile {
  enrolledCourses?: string[];
  likedQuestions?: string[];
  favouriteRestaurants?: string[];
  savedEvents?: string[];
  createdAt?: Timestamp;
  lastUpdated?: Timestamp;
}

export interface FoodAdditive {
  id: string;
  eCode: string;
  category: string;
  chemicalName: string;
  description: string;
  status: string;
}

export interface GoldPriceData {
  price: number;
  currency: string;
  timestamp: number;
  source: string;
}

export interface Khutbah {
  id: string;
  title: string;
  date: string;
  links: {
    English?: string;
    Malay?: string;
    Tamil?: string;
    Mandarin?: string;
  };
  tags?: string[];
  speaker?: string;
  summary?: string;
}

export interface BidetLocation {
  id: string;
  building: string;
  address: string;
  postal: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  female: "Yes" | "No";
  male: "Yes" | "No";
  handicap: "Yes" | "No";
  status?: "Available" | "Unavailable" | "Unknown";
  lastUpdated?: number;
}

export interface MusollahLocation {
  id: string;
  building: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  segregated: "Yes" | "No";
  airConditioned: "Yes" | "No";
  ablutionArea: "Yes" | "No";
  slippers: "Yes" | "No";
  prayerMats: "Yes" | "No";
  telekung: "Yes" | "No";
  directions: string;
  status?: "Available" | "Unavailable" | "Unknown";
  lastUpdated?: number;
}

export interface MosqueLocation {
  id: string;
  building: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  shia: "Yes" | "No";
}
