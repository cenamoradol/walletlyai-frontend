import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

function HeaderMenuButton() {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={{ paddingHorizontal: 12 }}
    >
      <Ionicons name="menu" size={22} color="#fff" />
    </Pressable>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1f2937' },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#94a3b8',
        headerLeft: () => <HeaderMenuButton />,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color} />,
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
          title: 'Transacciones',
        }}
      />
    </Tab.Navigator>
  );
}
