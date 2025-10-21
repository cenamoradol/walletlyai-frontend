// src/services/preferences.ts
import { api } from '../api/client'; // tu axios preconfigurado con baseURL y auth
import { Platform } from 'react-native';

export type CurrencyCode =
  | 'HNL' | 'USD' | 'MXN' | 'CRC' | 'ARS' | 'CLP' | 'COP' | 'PEN' | 'EUR' | 'BRL';

export interface UserPreferences {
  currency: CurrencyCode;
  notificationsEnabled: boolean;
}

export const PreferencesService = {
  async getMyPreferences() {
    const { data } = await api.get<UserPreferences>('/me/preferences');
    return data;
  },

  async updateMyPreferences(prefs: Partial<UserPreferences>) {
    const { data } = await api.patch<UserPreferences>('/me/preferences', prefs);
    return data;
  },

  async registerPushToken(token: string) {
    await api.post('/me/push-token', {
      token,
      platform: Platform.OS,
    });
  },

  async unregisterPushToken(token: string) {
    await api.delete('/me/push-token', { data: { token } });
  },
};
