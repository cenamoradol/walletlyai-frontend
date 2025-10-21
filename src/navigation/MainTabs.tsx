// src/navigation/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type MainTabsParamList = {
  Home: undefined;
  Transactions: undefined;
  Budgets: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: ({ focused, size }) => {
          let icon: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'Home':
              icon = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              icon = focused ? 'list' : 'list-outline';
              break;
            case 'Budgets':
              icon = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            case 'Profile':
              icon = focused ? 'person' : 'person-outline';
              break;
            case 'Settings':
              icon = focused ? 'settings' : 'settings-outline';
              break;
            default:
              icon = 'ellipse';
          }
          return <Ionicons name={icon} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transacciones' }} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} options={{ title: 'Presupuestos' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
}
