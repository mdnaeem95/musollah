// redux/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';
import locationReducer from '../reducer/userLocationReducer';
import prayerTimesReducer from '../reducer/prayerTimesReducer';
import musollahReducer from '../reducer/musollahReducer';

const store = configureStore({
  reducer: {
    location: locationReducer,
    prayer: prayerTimesReducer,
    musollah: musollahReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
