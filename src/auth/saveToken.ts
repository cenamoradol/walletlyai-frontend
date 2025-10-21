// src/auth/saveToken.ts
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.walletlyai'; // <-- DEBE coincidir con entitlements

export async function saveAuthTokenToAppGroup(token: string | null) {
  try {
    const payload = { token: token ?? '' };
    await SharedGroupPreferences.setItem('auth', payload, APP_GROUP);
  } catch (e) {
    console.warn('No se pudo guardar token en App Group:', e);
  }
}
