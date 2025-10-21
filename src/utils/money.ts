// src/utils/money.ts
import { useMemo } from 'react';
import { usePreferences } from '../context/PreferencesContext';

const localeByCurrency: Record<string, string> = {
  HNL: 'es-HN',
  USD: 'en-US',
  MXN: 'es-MX',
  CRC: 'es-CR',
  ARS: 'es-AR',
  CLP: 'es-CL',
  COP: 'es-CO',
  PEN: 'es-PE',
  EUR: 'es-ES',
  BRL: 'pt-BR',
};

export function useMoney() {
  const { prefs } = usePreferences();
  const currency = prefs?.currency || 'HNL';
  const locale = localeByCurrency[currency] ?? 'es-HN';

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        // minimumFractionDigits: 2, maximumFractionDigits: 2, // descomenta si lo quieres fijo
      }),
    [locale, currency]
  );

  return {
    currency,
    format: (value: number) => formatter.format(value ?? 0),
  };
}
