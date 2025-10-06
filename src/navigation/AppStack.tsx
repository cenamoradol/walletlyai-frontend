import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RootDrawer from './RootDrawer';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import CategoryCreateScreen from '../screens/CategoryCreateScreen';

export type AppStackParamList = {
  Root: undefined;
  AddTransaction: undefined;
  CategoryCreate: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="Root"
        component={RootDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
          title: 'Nueva transacción',
        }}
      />
    
      <Stack.Screen 
        name="CategoryCreate" 
        component={CategoryCreateScreen} 
        options={{ title: 'Crear categoría' }} 
      />

    </Stack.Navigator>
  );
}
