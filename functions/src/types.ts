export interface Restaurant {
  id: string;
  name: string;
  address: string;
  location: FirebaseFirestore.GeoPoint;
  categories: string[];
  hours: string;
  image: string;
  menuUrl?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
  };
  number?: string;
  status: string; // "MUIS Halal-Certified" | "Self-Certified" | etc.
  averageRating: number;
  totalReviews: number;
  // NEW FIELDS for tracking
  lastVerified: FirebaseFirestore.Timestamp;
  lastUpdated: FirebaseFirestore.Timestamp;
  dataSource: "manual" | "google" | "muis" | "scraper";
  isActive: boolean; // false if permanently closed
}

export interface RestaurantUpdate {
  restaurantId: string;
  field: string; // 'hours' | 'address' | 'phone' etc.
  oldValue: any;
  newValue: any;
  source: string;
  confidence: number; // 0-1
  timestamp: FirebaseFirestore.Timestamp;
  status: "pending" | "approved" | "rejected";
}

export interface ScraperLog {
  scraper: string;
  timestamp: FirebaseFirestore.Timestamp;
  restaurantsChecked: number;
  updatesFound: number;
  errors: string[];
  duration: number;
  dryRun: boolean;
}
