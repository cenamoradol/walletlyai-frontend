// src/config/env.ts
import { Platform } from 'react-native';

export const ENV = {
 
  BASE_URL: Platform.select({
    web: 'http://localhost:3000',      // Expo Web
    ios: 'https://walletlyai-backend.onrender.com',      // iOS simulador
    android: 'http://192.168.1.9:3000',   // Android emulador
    default: 'https://walletlyai-backend.onrender.com',
  }) as string,
   EXPO_PROJECT_ID: 'cfffdbb4-e857-47c2-ba02-3d699f941d0a',
};
