import storage from '@react-native-firebase/storage'

export const uploadImageToFirebase = async (uri: string, path: string) => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();

        const storageRef = storage().ref(path);

        const task = storageRef.put(blob);

        task.on('state_changed', (snapshot) => {
            console.log(
                `Transferred: ${snapshot.bytesTransferred} / ${snapshot.totalBytes}`
            )
        });

        await task;
        const downloadURL = await storageRef.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image: ', error);
        throw error
    }
}