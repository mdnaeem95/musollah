import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes, onAuthStateChanged } from '@react-native-firebase/auth';
import { authService } from '../api/client/firebase';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(authService, (authUser) => {
      setUser(authUser ?? null);
    });
  }, []);


  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
