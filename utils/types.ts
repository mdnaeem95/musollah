import { LocationObject } from 'expo-location';

export type CourseStatus = 'completed' | 'in progress' | 'unenrolled';
export type ModuleStatus = 'completed' | 'in progress' | 'locked';

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

export interface UserData {
    id: string;
    avatarUrl: string;
    email: string;
    enrolledCourses: CourseAndModuleProgress[],
    prayerLogs?: { [date:string]: any },
    name: string,
    monthlyLogs?: { date: string; prayersCompleted: number }[];  // Add this field
}

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