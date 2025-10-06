// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppStack from './src/navigation/AppStack';
import AuthStack from './src/navigation/AuthStack';
import GlobalKeyboardDismiss from './src/components/GlobalKeyboardDismiss';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DataCacheProvider } from './src/context/DataCacheContext';

import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTransactionFromText } from './src/services/ai';

// misma clave que usa DetectionScreen
const DL_ENABLED_KEY = 'txn_detection_deeplink_enabled';

function RootNavigator() {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Cuando hay token, AppStack; si no, AuthStack
  return token ? <AppStack /> : <AuthStack />;
}

// Config de linking simple (asegúrate de tener "scheme": "walletlyai" en app.json)
const linking = {
  prefixes: [Linking.createURL('/'), 'walletlyai://'],
};

export default function App() {
  // Manejo de deep links para /ingest?text=...
  useEffect(() => {
    let isMounted = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !isMounted) return;

      // Checar si la ingesta vía deeplink está habilitada
      const raw = await AsyncStorage.getItem(DL_ENABLED_KEY);
      const deeplinkEnabled = raw == null ? true : raw === 'true';
      if (!deeplinkEnabled) return;

      const { path, queryParams } = Linking.parse(url);
      if (path === 'ingest' && typeof queryParams?.text === 'string') {
        try {
          // ⚠️ Importante: sólo intenta enviar si hay sesión (token)
          // De lo contrario, podría fallar con 401 al abrir “en frío”.
          // Usamos un pequeño truco: consultamos el token con un micro-hook en línea.
          // Si no quieres este patrón, puedes mover el listener dentro de un componente ya logueado.
          const useAuthSnapshot = require('./src/context/AuthContext') as typeof import('./src/context/AuthContext');
          const token = useAuthSnapshot?.getCurrentToken?.(); // añade un getter estático opcional en AuthContext si lo deseas
          if (!token) return; // o guarda en una cola local y lo reintentas tras login

          await saveTransactionFromText(queryParams.text);
          // Opcional: Alert con feedback
          // Alert.alert('AI', 'Texto enviado a /ai/save-transaction');
        } catch (e: any) {
          console.error('Ingest error', e?.message || e);
          // Alert opcional: Alert.alert('Error', e?.message ?? 'No se pudo enviar el texto');
        }
      }
    };

    // Evento cuando la app ya está abierta
    const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));

    // URL inicial si la app se abre “en frío”
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      await handleUrl(initialUrl);
    })();

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {/* DataCacheProvider debe envolver la navegación para que todas las screens puedan usar useDataCache */}
        <DataCacheProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="auto" />
            <GlobalKeyboardDismiss>
              <RootNavigator />
            </GlobalKeyboardDismiss>
          </NavigationContainer>
        </DataCacheProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
