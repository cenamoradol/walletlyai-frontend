import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store'; // si no lo instalaste, cambia por AsyncStorage
import { login as loginApi, register as registerApi } from '../services/auth';
import { api, setAuthToken, setOnUnauthorized } from '../api/client';
import { saveAuthTokenToAppGroup } from '../auth/saveToken';

type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'walletlyai_token';

async function saveToken(t: string | null) {
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function loadToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOnUnauthorized(async () => {
      await logout();
      Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión.');
    });

    (async () => {
      try {
        const stored = await loadToken();
        if (stored) {
          setToken(stored);
          setAuthToken(stored);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => setOnUnauthorized(null);
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token } = await loginApi({ email, password });
    setToken(access_token);
    setAuthToken(access_token);
    await saveToken(access_token);
    await saveAuthTokenToAppGroup(access_token);
  };

  const register = async (name: string, email: string, password: string) => {
    await registerApi({ name, email, password });
    Alert.alert('Listo', 'Cuenta creada. Ahora inicia sesión.');
  };

  const logout = async () => {
    setToken(null);
    setAuthToken(null);
    await saveToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
