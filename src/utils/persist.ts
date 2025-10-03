import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const persist = {
  async get<T = any>(key: string): Promise<T | null> {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async set<T = any>(key: string, value: T): Promise<void> {
    const raw = JSON.stringify(value);
    if (Platform.OS === 'web') {
      localStorage.setItem(key, raw);
      return;
    }
    await AsyncStorage.setItem(key, raw);
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};
