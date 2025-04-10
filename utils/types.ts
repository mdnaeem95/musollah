import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { LocationObject } from 'expo-location';

type Procedure = {
    procedure: string;
    steps: ProcedureStep[];
  };
  
  type ProcedureStep = {
    id: string; // unique identifier (e.g., 'step-1', 'eligibility', etc)
    messages: Message[];
    options?: Option[];
    fallback?: string; // optional global fallback for link actions
  };
  
  type Message = {
    type: 
      | 'title'
      | 'description'
      | 'criteria'
      | 'instructions'
      | 'details'
      | 'note'
      | 'prompt';
    content: string | string[];
  };
  
  type Option = {
    label: string;
    nextStep?: string;       // reference to another step by id
    action?: 
      | 'startOver'
      | 'openLink'
      | 'saveChecklist'
      | 'showTooltip'
      | 'connectSupport';
    link?: string;           // only used for openLink
  };  

export type CourseStatus = 'completed' | 'in progress' | 'unenrolled';
export type ModuleStatus = 'completed' | 'in progress' | 'locked';

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

export type Article = {
    id: string;
    title: string;
    author: string;
    content: ArticleContent[];
    createdAt: string; // Firestore Timestamp will be converted to Date
    category?: ArticleCategory;
    tags?: string[];
    imageUrl?: string;
    likes: string[];  // Stores user IDs who liked the article
    bookmarks: string[];  // Stores user IDs who bookmarked the article
    comments: ArticleComment[];
};

export type Event = {
    id: string; // Unique Event ID
    category: string;
    status: string;
    name: string;
    date: string; // Format: "YYYY-MM-DD"
    time: string; // e.g., "17:00 - 20:00"
    venue: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    mosque?: string; // Optional if the event is in a mosque
    address: string;
    organizer: string;
    organizerId?: string;
    livestreamAvailable: boolean;
    wheelchairAccessible: boolean;
    language: string;
    targetAudience: string; // "All", "Men", "Women", "Youth", etc.
    description: string; // Event Description
    image?: string; // Firebase Storage URL or external link
    ticketPrice?: string; // Free or Price string
    eventType: "Open" | "Registration" | "External"; // Internal tracking of event type
    registrationLink?: string; // Only for External events
    isExternal: boolean; // True if using an external registration system
    externalClicks?: number; // Count of people who clicked the link
    interestedCount?: number; // Count of users who marked as Interested
    interested?: {
      [userId: string]: {
        name: string;
        email?: string;
        clickedRegistration: boolean;
        timestamp: string;
      };
    };
    attendees?: {
      [userId: string]: {
        name: string;
        email?: string;
        checkedIn: boolean;
        timestamp: string;
        avatarUrl?: string;
      };
    };
};  

export type ArticleCategory = {
    id: string;
    name: string;
    imageUrl: string;
};  

export type ArticleContent = 
 | { type: 'paragraph'; text: string }
 | { type: 'heading'; text: string }
 | { type: 'quote'; text: string }
 | { type: 'list'; text: string[] }

export type ArticleComment = {
    userId: string;
    text: string;
    timestamp: string; // Store as ISO string
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

export interface CoursesState {
    courses: CourseData[];
    loading: boolean;
    error: string | null;
}

// Immutable courseData type, (no status)
export interface CourseData {
    id: string,
    backgroundColour: string;
    category: string;
    description: string;
    icon: string;
    teacherId: string;
    title: string;
    modules: ModuleData[];
    type: string;
}

export interface ModuleData {
    moduleId: string;
    title: string;
    content: ContentData[];
}

// new type for tracking user's progress per course
export interface CourseAndModuleProgress {
    courseId: string;
    status: {
        courseStatus: CourseStatus,
        modules: {
            [moduleId: string]: ModuleStatus
        }
    }
}

export interface ContentData {
    contentId: string;
    title: string;
    type: string;
    data: string;
}

export interface TeacherData {
    id: string;
    expertise: string;
    name: string;
    imagePath: string;
    background: string;
    courses: string[];
}

export type UserRole = 'user' | 'admin' | 'organizer'

export interface UserData {
    id: string;
    avatarUrl?: string;
    email: string;
    enrolledCourses: CourseAndModuleProgress[],
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

export interface DashboardState {
    user: UserData | null;
    courses: CourseData[];
    teachers: TeacherData[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
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
}

export interface FoodAdditive {
    id: string;
    eCode: string;
    chemicalName: string;
    category: string;
    description: string;
    status: string;
}

// New type for questions in the Q&A system
export interface Question {
    id: string;
    title: string;
    body: string;
    userId: string;
    tags: string[];
    createdAt: Date | string;
    updatedAt?: Date | string;
    status: 'open' | 'closed';
    votes: number;
    answerCount: number;
    views: number;
}

// New type for answers
export interface Answer {
    id: string;
    questionId: string;
    body: string;
    userId: string;
    createdAt: Date;
    updatedAt?: Date;
    votes: number;
    isAccepted: boolean;
}

// New type for tags
export interface Tag {
    id: string;
    name: string;
    questionCount: number;
}

// New type for comments
export interface Comment {
    id: string;
    questionId?: string;
    answerId?: string;
    body: string;
    userId: string;
    createdAt: Date;
}

// New type for voting
export interface Vote {
    id: string;
    userId: string;
    questionId?: string;
    answerId?: string;
    type: 'upvote' | 'downvote';
}

export interface Restaurant {
    id: string,
    image: string,
    name : string,
    address: string,
    coordinates: {
        latitude: number;
        longitude: number;
    };
    status: string,
    hours: string,
    website: string,
    categories: string[],
    averageRating?: number;
    totalReviews?: number;
    menuUrl?: string;
    socials?: {
        instagram?: string;
        tiktok?: string;
        facebook?: string;
        number?: string;
    }
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