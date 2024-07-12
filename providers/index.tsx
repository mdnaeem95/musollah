// Providers.tsx
import React, { ReactNode } from 'react';
import { LocationProvider } from './LocationProvider';
import { LocationDataProvider } from './LocationDataProvider';
import { QuranDataProvider } from './QuranDataProvider';
import { PrayerTimesProvider } from './PrayerTimesProvider';

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <LocationProvider>
      <LocationDataProvider>
        <QuranDataProvider>
          <PrayerTimesProvider>
          {children}
          </PrayerTimesProvider>
        </QuranDataProvider>
      </LocationDataProvider>
    </LocationProvider>
  );
};

export { Providers };
