import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Alert } from 'react-native';
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

  return token ? <AppStack /> : <AuthStack />;
}

// Config de linking simple (no mapea pantallas específicas)
const linking = {
  prefixes: [Linking.createURL('/'), 'walletlyai://'],
};

export default function App() {
  useEffect(() => {
    // Maneja URL -> si path === 'ingest' y viene ?text=..., lo envía al endpoint AI
    const handleUrl = async (url: string | null) => {
      if (!url) return;

      // Checar si la ingesta vía deeplink está habilitada
      const raw = await AsyncStorage.getItem(DL_ENABLED_KEY);
      const deeplinkEnabled = raw == null ? true : raw === 'true';
      if (!deeplinkEnabled) return;

      const { path, queryParams } = Linking.parse(url);
      // Aceptamos walletlyai://ingest?text=...
      if (path === 'ingest' && typeof queryParams?.text === 'string') {
        const text = queryParams.text;
        try {
          await saveTransactionFromText(text);
          // Si quieres feedback:
          // Alert.alert('AI', 'Texto enviado a /ai/save-transaction');
        } catch (e: any) {
          console.error('Ingest error', e?.message || e);
          // Alert opcional:
          // Alert.alert('Error', e?.message ?? 'No se pudo enviar el texto');
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

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
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
