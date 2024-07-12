// Providers.tsx
import React, { ReactNode } from 'react';
import { LocationProvider } from './LocationProvider';
import { LocationDataProvider } from './LocationDataProvider';
import { QuranDataProvider } from './QuranDataProvider';
import { PrayerTimesProvider } from './PrayerTimesProvider';
import { LoadingProvider } from './LoadingProvider' 

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <LocationProvider>
      <LocationDataProvider>
        <QuranDataProvider>
          <PrayerTimesProvider>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </PrayerTimesProvider>
        </QuranDataProvider>
      </LocationDataProvider>
    </LocationProvider>
  );
};

export { Providers };
