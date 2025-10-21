// src/screens/BudgetsScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetsService, BudgetDTO } from '../services/budgets';
import BudgetCard from '../components/BudgetCard';
import { useNavigation } from '@react-navigation/native';

export default function BudgetsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<BudgetDTO[]>([]);
  const navigation = useNavigation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const budgets = await BudgetsService.getList();
      // Orden opcional: por updatedAt desc
      budgets.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setItems(budgets);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    load();
    return unsubscribe;
  }, [navigation, load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Cargando presupuestos…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => <BudgetCard budget={item} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin presupuestos</Text>
            <Text style={styles.emptyText}>
              Crea tu primer presupuesto para comenzar a controlar tus gastos.
            </Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Botón flotante agregar → navega a CreateBudgetScreen */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('CreateBudget' as never)}
      >
        <Text style={styles.fabTxt}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { marginTop: 6, color: '#6b7280', textAlign: 'center', paddingHorizontal: 16 },
  fab: {
    position: 'absolute', right: 20, bottom: 30,
    backgroundColor: '#111827', width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  fabTxt: { color: '#fff', fontSize: 28, lineHeight: 28, marginTop: -2 },
});
