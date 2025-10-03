// src/navigation/linking.ts
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/'); // walletlyai://
export const linking = {
  prefixes: [prefix, 'walletlyai://'],
  config: {
    screens: {
      Root: {
        screens: {
          // mapea tus pantallas si quieres navegación directa
          Ingest: 'ingest', // no es una pantalla, lo procesaremos manualmente
        },
      },
      // fallback
    },
  },
};
