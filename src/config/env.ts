// src/config/env.ts
import { Platform } from 'react-native';

export const ENV = {
 
  BASE_URL: Platform.select({
    web: 'https://walletlyai-backend.onrender.com:10000',      // Expo Web
    ios: 'https://walletlyai-backend.onrender.com:10000',      // iOS simulador
    android: 'https://walletlyai-backend.onrender.com:10000',   // Android emulador
    default: 'https://walletlyai-backend.onrender.com:10000',
  }) as string,
};
