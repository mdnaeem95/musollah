import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { LocationObject } from 'expo-location';

export type Language = 'English' | 'Malay' | 'Tamil';

export type Khutbah = {
  id: string; // unique identifier
  title: string;
  date: string; // ISO format preferred (e.g. 2025-04-01)
  links: {
    [lang in Language]?: string; // language-specific PDF links
  };
  tags?: string[]; // Optional: For future filtering/search
  speaker?: string; // Optional: If provided by MUIS
  summary?: string;
};
  
export interface PrayerTimes2025 {
    date: string; // Stored as "D/M/YYYY" in Firebase
    time: {
      subuh: string;
      syuruk: string;
      zohor: string;
      asar: string;
      maghrib: string;
      isyak: string;
    };
}

export type UserRole = 'user' | 'admin' | 'organizer'

export interface UserData {
    id: string;
    avatarUrl?: string;
    email: string;
    prayerLogs?: { [date: string]: any },
    name: string,
    monthlyLogs?: { date: string; prayersCompleted: number }[];  // Add this field
    role: UserRole
    likedQuestions: string[];
    favouriteRestaurants?: { restaurantId: string; timestamp: string }[];
    referralCode?: string;
    referralCount?: number,
    interests?: string[];
    aboutMe?: string
    followers?: { [userId: string]: boolean };
    following?: { [userId: string]: boolean };
    savedEvents?: string[];
}

export type Notification = {
    id: string;
    type: 'follow' | 'event_rsvp' | 'like' | 'comment'; // Customize as needed
    message: string;
    fromUserId: string;
    senderName?: string;
    avatarUrl?: string;
    createdAt: FirebaseFirestoreTypes.Timestamp; // or firebase.firestore.Timestamp
    read?: boolean;
};

export interface MusollahState {
    bidetLocations: BidetLocation[];
    mosqueLocations: MosqueLocation[];
    musollahLocations: MusollahLocation[];
    isLoading: boolean;
    error: string | null;
}
export interface PrayerState {
    prayerTimes: PrayerTimes | null;
    islamicDate: string | null;
    currentPrayer: string | null;
    nextPrayerInfo: { nextPrayer: string | null, timeUntilNextPrayer: string | null } | null;
    isLoading: boolean;
    error: string | null;
    selectedDate: string | null;
}
export interface PrayerTimes {
    Subuh: string;
    Syuruk: string;
    Zohor: string;
    Asar: string;
    Maghrib: string;
    Isyak: string;
    [key: string]: string;
}
export interface QuranState {
    surahs: Surah[];
    bookmarks: Bookmark[];
    isLoading: boolean;
    error: string | null;
    recitationPlan?: {
        planType: 'ayahs' | 'surahs' | 'juz',
        daysToFinish: number,
        startDate: string,
        dailyTarget: number,
        completedAyahKeys: string[],
        lastReadAyah: string,
    }
}

export interface LocationState {
    userLocation: LocationObject | null;
    errorMsg: string | null;
    isLoading: boolean;
}
export interface UserState {
    user: UserData | null,
    loading: boolean;
    error: string | null;
}
export interface UserInfo {
    email: string,
    password: string
}
export interface Surah {
    id: string;
    arabicName: string;
    englishName: string;
    englishNameTranslation: string;
    number: number;
    numberOfAyahs: number;
    arabicText: string;
    audioLinks: string;
    englishTranslation: string;
}
export interface DoaAfterPrayer {
    id: string,
    step: number,
    title: string,
    arabicText: string,
    romanized: string,
    englishTranslation: string
}
export interface DoasState {
    doas: Doa[],
    bookmarks: DoaBookmark[]
    loading: boolean;
    error: string | null;
}
export interface Doa {
    number: string;
    arabicText: string;
    englishTranslation: string;
    romanizedText: string;
    source: string;
    title: string
}
export interface Bookmark {
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
}

export interface DoaBookmark {
    doaId: string;
    doaTitle: string;
}
export interface BidetLocation {
    id: string;
    address: string;
    building: string;
    postal: number;
    coordinates: {
    latitude: number;
    longitude: number;
    };
    female: string;
    handicap: string;
    male: string;
    distance?: number;
    status?: 'Available' | 'Unavailable' | 'Unknown';
    lastUpdated?: number; // timestamp  
}
  
export interface MosqueLocation {
    id: string;
    building: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    shia: string;
    distance?: number;
}
  
export interface MusollahLocation {
    id: string;
    building: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    segregated: string;
    airConditioned: string;
    ablutionArea: string;
    slippers: string;
    prayerMats: string;
    telekung: string;
    directions: string;
    distance?: number;
    status?: 'Available' | 'Unavailable' | 'Unknown';
    lastUpdated?: number; // timestamp  
}

export interface FoodAdditive {
    id: string;
    eCode: string;
    chemicalName: string;
    category: string;
    description: string;
    status: string;
}

export interface Restaurant {
  // Core fields
  id: string;
  name: string;
  categories: string[];

  // Location (normalized from Firebase 'location' GeoPoint)
  coordinates: {
    latitude: number;
    longitude: number;
  };

  // Details
  address: string;
  image: string;
  hours: string;
  website: string;
  menuUrl: string;
  status: string;

  // Social links
  socials: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    number?: string;
  };

  // Ratings & Reviews
  averageRating: number;
  totalReviews: number;

  // Optional fields
  rating?: number;
  priceRange?: string;
  description?: string;
  halal?: boolean;
  tags?: string[];
}

export interface RestaurantReview {
    id: string;
    restaurantId: string;
    userId?: string;
    rating: number;
    review: string;
    timestamp: string;
    images?: string[];
}
export interface ZakatType {
    id: string;
    label: string;
    icon: string;
    amount: string;
  }
  
export interface ZakatEligibilityInputs {
    savings: string;
    goldWearing: string;
    goldNotWearing: string;
    insurance: string;
    shares: string;
}
  
export interface ZakatSwitches {
    savings: boolean;
    goldWearing: boolean;
    goldNotWearing: boolean;
}
  
export interface Modals {
    eligibility: boolean;
}
  
export interface ZakatState {
    nisabAmount: number;
    zakatTypes: ZakatType[];
    eligibility: Record<string, boolean>;
    eligibilityInputs: ZakatEligibilityInputs;
    switches: ZakatSwitches;
    modals: Modals;
}
  
export type ZakatAction =
    | { type: 'TOGGLE_MODAL'; payload: string }
    | { type: 'SHOW_MODAL'; payload: string }
    | { type: 'UPDATE_AMOUNT'; payload: { id: string; amount: string } }
    | { type: 'UPDATE_ELIGIBILITY_INPUT'; payload: { id: string; value: string } }
    | { type: 'UPDATE_SWITCH'; payload: { id: string; value: boolean } }
    | { type: 'ASSESS_ELIGIBILITY' };