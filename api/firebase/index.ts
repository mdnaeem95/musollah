import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { BidetLocation, MosqueLocation, MusollahLocation, Region } from "../../components/Map";
import { getDistanceFromLatLonInKm } from "../../utils/distance";
import { Surah } from "../../hooks/useLoadQuranData";

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
                numberOfAyahs: data.NumberOfAyahs
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