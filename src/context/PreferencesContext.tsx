// src/context/PreferencesContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PreferencesService, type UserPreferences, type CurrencyCode } from '../services/preferences';

type Ctx = {
  prefs: UserPreferences | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setCurrency: (code: CurrencyCode) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
};

const PreferencesContext = createContext<Ctx>({
  prefs: null,
  loading: true,
  refresh: async () => {},
  setCurrency: async () => {},
  setNotificationsEnabled: async () => {},
});

export const PreferencesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const p = await PreferencesService.getMyPreferences();
      setPrefs(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setCurrency = async (code: CurrencyCode) => {
    const updated = await PreferencesService.updateMyPreferences({ currency: code });
    setPrefs(updated);
  };

  const setNotificationsEnabled = async (enabled: boolean) => {
    const updated = await PreferencesService.updateMyPreferences({ notificationsEnabled: enabled });
    setPrefs(updated);
  };

  const value = useMemo<Ctx>(() => ({
    prefs, loading, refresh: load, setCurrency, setNotificationsEnabled
  }), [prefs, loading]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
