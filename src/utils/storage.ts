import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

async function secureAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export const storage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web' || !(await secureAvailable())) {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string) {
    if (Platform.OS === 'web' || !(await secureAvailable())) {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async deleteItem(key: string) {
    if (Platform.OS === 'web' || !(await secureAvailable())) {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
