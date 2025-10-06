// src/config/env.ts
import { Platform } from 'react-native';

export const ENV = {
 
  BASE_URL: Platform.select({
    web: 'https://walletlyai-backend.onrender.com',      // Expo Web
    ios: 'https://walletlyai-backend.onrender.com',      // iOS simulador
    android: 'https://walletlyai-backend.onrender.com',   // Android emulador
    default: 'https://walletlyai-backend.onrender.com',
  }) as string,
};
