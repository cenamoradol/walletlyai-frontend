import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, Pressable } from 'react-native';
import DismissibleScrollView from '../components/DismissibleScrollView';
import { useDataCache } from '../context/DataCacheContext';
import TransactionItem from '../components/TransactionItem';
import { Ionicons } from '@expo/vector-icons';

function formatDateISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TransactionsScreen({ navigation }: any) {
  const { ready, getRecent, refresh } = useDataCache();
  const [loading, setLoading] = useState(false);

  const end = formatDateISO(new Date());
  const startObj = new Date();
  startObj.setDate(startObj.getDate() - 29);
  const start = formatDateISO(startObj);

  const list = useMemo(() => ready ? getRecent(start, end, 1000) : [], [ready, start, end, getRecent]);

  const onPull = async () => {
    setLoading(true);
    try { await refresh({ silent: true }); }
    finally { setLoading(false); }
  };

  return (
    <DismissibleScrollView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onPull} tintColor="#fff" />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Transacciones</Text>
        <Pressable
          onPress={() => navigation.navigate('AddTransaction')}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Agregar</Text>
        </Pressable>
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No hay transacciones en los últimos 30 días.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {list.map((t) => (
            <TransactionItem key={t.id} tx={t} />
          ))}
        </View>
      )}
    </DismissibleScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: 'white', fontSize: 18, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },

  emptyBox: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  emptyText: { color: '#94a3b8' },
});
