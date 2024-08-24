import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { BidetLocation, MosqueLocation, MusollahLocation, Region } from "../../components/Map";
import { getDistanceFromLatLonInKm } from "../../utils/distance";
import { Surah } from "../../app/(tabs)/(quran)/index"
import { DoaAfterPrayer } from "../../app/(tabs)/(prayer)/doa";
import { ContentData, CourseData, ModuleData, TeacherData, UserData } from "../../redux/slices/dashboardSlice"

export const fetchUserData = async (userId: string ): Promise<UserData> => {
    try {
        const userSnapshot = await getDoc(doc(db, 'users', userId))
        const data = userSnapshot.data();

        console.log('Fetched user data', data);

        return {
            id: userSnapshot.id,
            avatarUrl: data?.avatarUrl || 'https://via.placeholder.com/100', // Default avatar
            email: data?.email || 'No email provided',
            enrolledCourses: data?.enrolledCourses || [], // Default to an empty array
            name: data?.name || 'Unnamed User',
        } as UserData
    } catch (error) {
        console.error('Error fetching user data: ', error);
        throw error;
    }
}

export const fetchCoursesData = async (): Promise<CourseData[]> => {
    try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesList = coursesSnapshot.docs.map(doc => {
            const data = doc.data();

            const modules = data.modules.map((module: ModuleData) => ({
                moduleId: module.moduleId,
                title: module.title,
                content: module.content.map((contentItem: ContentData) => ({
                    contentId: contentItem.contentId,
                    title: contentItem.title,
                    type: contentItem.type,
                    data: contentItem.data
                }))
            }))

            return {
                id: doc.id,
                backgroundColour: data.backgroundColour,
                category: data.category,
                description: data.description,
                icon: data.icon,
                teacherId: data.teacherId,
                title: data.title,
                modules: modules,
                type: data.type
            } as CourseData
        })

        return coursesList
    } catch (error) {
        console.error('Error fetching courses: ', error);
        throw error;
    }
}

export const fetchTeachersData = async (): Promise<TeacherData[]> => {
    try {
        const teachersSnapshot = await getDocs(collection(db, 'teachers'));
        const teachersList = teachersSnapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                courses: data.courses,
                expertise: data.expertise,
                imagePath: data.imagePath,
                name: data.name,
                background: data.background,
            } as TeacherData
        })

        return teachersList
    } catch (error) {
        console.error('Error fetching teachers: ', error);
        throw error;
    }
}

export const getDoaAfterPrayer  = async (): Promise<DoaAfterPrayer[]> => {
    try {
        const doaSnapshot = await getDocs(collection(db, 'DoaAfterPrayer'));
        const doaList = doaSnapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                step: data.step,
                title: data.title,
                arabicText: data.arabicText,
                romanized: data.romanized,
                englishTranslation: data.englishTranslation
            } as DoaAfterPrayer
        })

        return doaList.sort((a, b) => a.step - b.step);
    } catch (error) {
        console.error('Error fetching doa after prayers: ', error);
        throw error
    }
}

export const getBidetLocations = async (userRegion: Region): Promise<BidetLocation[]> => {
    try {
        const bidetSnapshot = await getDocs(collection(db, 'Bidets'));
        const bidetList = bidetSnapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                address: data.Address,
                building: data.Building,
                postal: data.Postal,
                coordinates: {
                    latitude: data.Coordinates.latitude,
                    longitude: data.Coordinates.longitude,
                },
                female: data.Female,
                handicap: data.Handicap,
                male: data.Male
            } as BidetLocation
        });

        // Calculate distance for each bidet location
        bidetList.forEach((location) => {
            location.distance = getDistanceFromLatLonInKm(
                userRegion.latitude,
                userRegion.longitude,
                location.coordinates.latitude,
                location.coordinates.longitude
            )
        });

        return bidetList.sort((a, b) => a.distance! - b.distance!);
    } catch (error) {
        console.error("Error fetching bidet locations: ", error);
        throw error;
    }
}

export const getMosqueLocations = async (userRegion: Region): Promise<MosqueLocation[]> => {
    try {
        const mosqueSnapshot = await getDocs(collection(db, 'Mosques'));
        const mosqueList = mosqueSnapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                building: data.Building,
                address: data.Address,
                coordinates: {
                    latitude: data.Coordinates.latitude,
                    longitude: data.Coordinates.longitude,
                },
                shia: data.Shia,
            } as MosqueLocation;
        })

        // Calculate distance for each mosque location
        mosqueList.forEach((location) => {
            location.distance = getDistanceFromLatLonInKm(
                userRegion.latitude,
                userRegion.longitude,
                location.coordinates.latitude,
                location.coordinates.longitude
            )
        });

        return mosqueList.sort((a, b) => a.distance! - b.distance!);
    } catch (error) {
        console.error("Error fetching mosques locations: ", error);
        throw error;
    }
}

export const getMusollahsLocations = async (userRegion: Region): Promise<MusollahLocation[]> => {
    try {
        const musollahSnapshot = await getDocs(collection(db, 'Musollahs'));
        const musollahList = musollahSnapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                building: data.Building,
                address: data.Address,
                coordinates: {
                    latitude: data.Coordinates.latitude,
                    longitude: data.Coordinates.longitude,
                },
                segregated: data.Segregated,
                airConditioned: data.AirConditioned,
                ablutionArea: data.AblutionArea,
                slippers: data.Slippers,
                prayerMats: data.PrayerMats,
                telekung: data.Telekung,
                directions: data.Directions
            } as MusollahLocation;
        });

        // Calculate distance for each mosque location
        musollahList.forEach((location) => {
            location.distance = getDistanceFromLatLonInKm(
                userRegion.latitude,
                userRegion.longitude,
                location.coordinates.latitude,
                location.coordinates.longitude
            )
        });

        return musollahList.sort((a, b) => a.distance! - b.distance!);
    } catch (error) {
        console.error("Error fetching musollahs locations: ", error);
        throw error;
    }
}

export const fetchSurahs = async (): Promise<Surah[]> => {
    try {
        const surahSnapshot = await getDocs(collection(db, 'Surahs'));
        const surahList = surahSnapshot.docs.map(doc =>{
            const data = doc.data();
            return {
                id: doc.id,
                arabicName: data.ArabicName,
                englishName: data.EnglishName,
                englishNameTranslation: data.EnglishNameTranslation,
                number: data.Number,
                numberOfAyahs: data.NumberOfAyahs,
                arabicText: data.arabicText,
                audioLinks: data.audioLinks,
                englishTranslation: data.englishTranslation
            } as Surah;
        });

        // Sort by number
        surahList.sort((a, b) => a.number - b.number);
        return surahList
    } catch (error) {
        console.error("Error fetching surahs: ", error);
        throw error;
    }
}

