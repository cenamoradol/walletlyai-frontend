import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { login as loginApi, register as registerApi } from '../services/auth';
import { setAuthToken, setOnUnauthorized } from '../api/client';
import { storage } from '../utils/storage';

type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'walletlyai_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggingOutRef = useRef(false);
  const showedExpireAlertRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          setAuthToken(stored);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Manejo global 401 → logout
    setOnUnauthorized(async () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      if (!showedExpireAlertRef.current) {
        showedExpireAlertRef.current = true;
        Alert.alert('Sesión expirada', 'Por seguridad, vuelve a iniciar sesión.');
      }

      await storage.deleteItem(TOKEN_KEY);
      setToken(null);
      setAuthToken(null);

      // Permite nuevas alertas tras un tiempo
      setTimeout(() => {
        isLoggingOutRef.current = false;
        showedExpireAlertRef.current = false;
      }, 500);
    });

    return () => setOnUnauthorized(null);
  }, []);

  const login = async (email: string, password: string) => {
    
    const { access_token } = await loginApi({ email, password });
    console.log(access_token)
    await storage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    setAuthToken(access_token);
  };

  const register = async (name: string, email: string, password: string) => {
    const { access_token } = await registerApi({ name, email, password });
    await storage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    setAuthToken(access_token);
  };

  const logout = async () => {
    await storage.deleteItem(TOKEN_KEY);
    setToken(null);
    setAuthToken(null);
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
