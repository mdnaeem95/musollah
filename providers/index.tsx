// Providers.tsx
import React, { ReactNode } from 'react';
import { LocationProvider } from './LocationProvider';
import { LocationDataProvider } from './LocationDataProvider';
import { QuranDataProvider } from './QuranDataProvider'

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <LocationProvider>
      <LocationDataProvider>
        <QuranDataProvider>
          {children}
        </QuranDataProvider>
      </LocationDataProvider>
    </LocationProvider>
  );
};

export { Providers };
