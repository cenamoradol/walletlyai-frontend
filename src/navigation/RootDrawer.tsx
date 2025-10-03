import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import MainTabs from './MainTabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DetectionScreen from '../screens/DetectionScreen';

const Drawer = createDrawerNavigator();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: '#94a3b8', marginTop: 6 }}>Pantalla temporal — pronto agregamos contenido</Text>
    </View>
  );
}

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ backgroundColor: '#0f172a', flex: 1 }}
    >
      {/* Encabezado */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#1f2937' }}>
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>WalletlyAI</Text>
        <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>Menú</Text>
      </View>

      {/* Inicio */}
      <DrawerItem
        label="Inicio"
        labelStyle={{ color: '#e5e7eb' }}
        icon={({ size }) => <Ionicons name="home" size={size} color="#e5e7eb" />}
        onPress={() => props.navigation.navigate('Main')}
        style={{ borderBottomWidth: 1, borderBottomColor: '#1f2937' }}
      />

      {/* Detección de transacciones */}
      <DrawerItem
        label="Detección de transacciones"
        labelStyle={{ color: '#e5e7eb' }}
        icon={({ size }) => <Ionicons name="notifications" size={size} color="#e5e7eb" />}
        onPress={() => props.navigation.navigate('Detection')}
        style={{ borderBottomWidth: 1, borderBottomColor: '#1f2937' }}
      />

      {/* Configuración */}
      <DrawerItem
        label="Configuración"
        labelStyle={{ color: '#e5e7eb' }}
        icon={({ size }) => <Ionicons name="settings" size={size} color="#e5e7eb" />}
        onPress={() => props.navigation.navigate('Settings')}
        style={{ borderBottomWidth: 1, borderBottomColor: '#1f2937' }}
      />
    </DrawerContentScrollView>
  );
}

export default function RootDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Main"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#0b1220' },
      }}
    >
      <Drawer.Screen name="Main" component={MainTabs} />
      <Drawer.Screen name="Detection" component={DetectionScreen} />
      <Drawer.Screen
        name="Settings"
        children={() => <PlaceholderScreen title="Configuración" />}
      />
    </Drawer.Navigator>
  );
}
