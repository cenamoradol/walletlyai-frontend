// src/navigation/AppStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';

// Screens
import DetectionScreen from '../screens/DetectionScreen';
import CategoriesManageScreen from '../screens/CategoriesManageScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import CreateBudgetScreen from '../screens/CreateBudgetScreen';

// Modales
import AddTransactionScreen from '../screens/AddTransactionScreen';
import CategoryCreateScreen from '../screens/CategoryCreateScreen';

export type AppStackParamList = {
  MainTabs: undefined;

  Detection: undefined;
  CategoriesManage: undefined;

  AddTransaction: undefined;
  CategoryCreate: undefined;
  TransactionDetail: { id: number };
  CreateBudget: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Detection" component={DetectionScreen} options={{ title: 'Detección (AI)' }} />
      <Stack.Screen name="CategoriesManage" component={CategoriesManageScreen} options={{ title: 'Categorías' }} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: 'modal', title: 'Nueva transacción' }} />
      <Stack.Screen name="CategoryCreate" component={CategoryCreateScreen} options={{ presentation: 'modal', title: 'Nueva categoría' }} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
       <Stack.Screen
        name="CreateBudget"
        component={CreateBudgetScreen}
        options={{ title: 'Nuevo presupuesto', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
