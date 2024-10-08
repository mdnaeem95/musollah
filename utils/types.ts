import { LocationObject } from 'expo-location';

export interface CoursesState {
    courses: CourseData[];
    loading: boolean;
    error: string | null;
}

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
    status: 'unenrolled' | 'in progress' | 'completed'; 
}

export interface ModuleData {
    moduleId: string;
    title: string;
    content: ContentData[];
    status: 'locked' | 'in progress' | 'completed'
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
    enrolledCourses: string[],
    prayerLogs: any[],
    name: string
}

export interface MusollahState {
    bidetLocations: any[];
    mosqueLocations: any[];
    musollahLocations: any[];
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
  
  export interface CalendarObject {
    day: number,
    month: number,
    year: number,
    timestamp: string,
    dateString: string,
}

export interface QuranState {
    surahs: any[];
    isLoading: boolean;
    error: string | null;
}

export interface LocationState {
    userLocation: LocationObject | null;
    errorMsg: string | null;
    isLoading: boolean;
}

export interface UserState {
    user: any,
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
    user: any;
    courses: any[];
    teachers: any[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}