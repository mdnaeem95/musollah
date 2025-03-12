import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../redux/store/store';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { AuthProvider } from '../context/AuthContext'; // 🔹 Import AuthProvider

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReduxProvider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <AuthProvider> {/* 🔹 Wrap everything inside AuthProvider */}
          <ActionSheetProvider>
            <ThemeProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </ThemeProvider>
          </ActionSheetProvider>
        </AuthProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

export default AppProviders;
