import axios from 'axios';
import { Platform } from 'react-native';

let AUTH_TOKEN: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  AUTH_TOKEN = token;
};

export const setOnUnauthorized = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

// URL por plataforma
const BASE_URL = Platform.select({
  web: 'https://walletlyai-backend.onrender.com',     // Expo Web
  ios: 'https://walletlyai-backend.onrender.com',     // iOS simulador
  android: 'https://walletlyai-backend.onrender.com',  // Android emulador                               
  default: 'https://walletlyai-backend.onrender.com',
}) as string;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 35000,
});

api.interceptors.request.use((config) => {
  if (AUTH_TOKEN) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
  
    if (status === 401 && typeof onUnauthorized === 'function') {
      try {
        onUnauthorized();
      } catch {
        // noop
      }
    }
    return Promise.reject(error);
  }
);
