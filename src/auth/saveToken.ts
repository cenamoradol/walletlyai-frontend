// src/auth/saveToken.ts
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.walletlyai';

export async function saveAuthTokenToAppGroup(token: string | null) {
  try {
    await SharedGroupPreferences.setItem('auth', { token: token ?? '' }, APP_GROUP);
  } catch (e) {
    console.warn('No se pudo guardar token en App Group:', e);
  }
}

