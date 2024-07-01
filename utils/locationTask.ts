import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const LOCATION_TASK_NAME = 'background-location-task';

interface LocationTaskData {
    locations: Location.LocationObject[];
  }

  TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error, executionInfo }: TaskManager.TaskManagerTaskBody<LocationTaskData>) => {
    if (error) {
      console.error(error.message);
      return;
    }
    if (data) {
      const { locations } = data;
      console.log('Received new locations:', locations);
      // Handle the location updates here
    }
  });

export const startBackgroundLocationUpdates = async () => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status === 'granted') {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 100, // Minimum distance in meters between updates
      deferredUpdatesInterval: 1000, // Minimum time interval in ms between updates
      showsBackgroundLocationIndicator: true, // iOS only
    });
  } else {
    console.error('Permission to access background location was denied');
  }
};

export const stopBackgroundLocationUpdates = async () => {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
};
