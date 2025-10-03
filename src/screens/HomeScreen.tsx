import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataCacheContext';
import DismissibleScrollView from '../components/DismissibleScrollView';
import TransactionItem from '../components/TransactionItem';

// ------- helpers de fechas y formato -------
type RangeKey = '7d' | '30d' | 'month' | 'custom';

function formatDateISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function monthStartEnd(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = now;
  return { start: formatDateISO(start), end: formatDateISO(end) };
}
function getChipRange(range: Exclude<RangeKey, 'custom'>): { start: string; end: string } {
  const now = new Date();
  const end = formatDateISO(now);
  if (range === '7d') {
    const s = new Date(now); s.setDate(s.getDate() - 6);
    return { start: formatDateISO(s), end };
  }
  if (range === '30d') {
    const s = new Date(now); s.setDate(s.getDate() - 29);
    return { start: formatDateISO(s), end };
  }
  return monthStartEnd();
}
function money(n: number) {
  try {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', maximumFractionDigits: 2 }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
// -----------------------------------------

export default function HomeScreen({ navigation }: any) {
  const { logout } = useAuth();
  const { ready, getDashboard, getRecentAll, refresh } = useDataCache();

  const [range, setRange] = useState<RangeKey>('month');
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fallback = getChipRange('month');
  const start = range === 'custom' ? (customStart ?? fallback.start) : getChipRange(range as Exclude<RangeKey,'custom'>).start;
  const end   = range === 'custom' ? (customEnd   ?? fallback.end  ) : getChipRange(range as Exclude<RangeKey,'custom'>).end;

  const summary = useMemo(() => (ready ? getDashboard(start, end) : null), [ready, start, end, getDashboard]);
  const recent  = useMemo(() => (ready ? getRecentAll(10) : []), [ready, getRecentAll]); // << aquí ignora rango

  const onPull = async () => {
    setLoading(true);
    try { await refresh({ silent: true }); }
    finally { setLoading(false); }
  };

  const onSelectChip = (key: Exclude<RangeKey, 'custom'>) => {
    setRange(key);
    setCustomStart(null);
    setCustomEnd(null);
  };

  const openCustom = () => {
    setRange('custom');
    if (Platform.OS === 'web') {
      // @ts-ignore
      const s = typeof prompt !== 'undefined' ? prompt('Inicio (YYYY-MM-DD):', customStart ?? start) : null;
      // @ts-ignore
      const e = typeof prompt !== 'undefined' ? prompt('Fin (YYYY-MM-DD):', customEnd ?? end) : null;
      if (s) setCustomStart(s);
      if (e) setCustomEnd(e);
    } else {
      setShowStartPicker(true);
    }
  };

  const onChangeStart = (_e: DateTimePickerEvent, d?: Date) => {
    setShowStartPicker(false);
    if (d) {
      const s = formatDateISO(d);
      setCustomStart(s);
      setShowEndPicker(true);
    }
  };

  const onChangeEnd = (_e: DateTimePickerEvent, d?: Date) => {
    setShowEndPicker(false);
    if (d) {
      const e = formatDateISO(d);
      setCustomEnd(e);
    }
  };

  return (
    <DismissibleScrollView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onPull} tintColor="#fff" />}
    >
      {/* Header actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <Pressable
          onPress={() => navigation.navigate('AddTransaction')}
          style={{ backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>+ Agregar</Text>
        </Pressable>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Salir</Text>
        </Pressable>
      </View>

      {/* Chips de rango */}
      <View style={styles.chipsRow}>
        {(['7d', '30d', 'month'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => onSelectChip(key)}
            style={[styles.chip, range === key && styles.chipActive]}
          >
            <Text style={[styles.chipText, range === key && styles.chipTextActive]}>
              {key === '7d' ? '7 días' : key === '30d' ? '30 días' : 'Este mes'}
            </Text>
          </Pressable>
        ))}

        {/* Botón “Personalizado” */}
        <Pressable
          onPress={openCustom}
          style={[styles.chip, range === 'custom' && styles.chipActiveAlt]}
        >
          <Text style={[styles.chipText, range === 'custom' && styles.chipTextActive]}>Personalizado</Text>
        </Pressable>
      </View>

      {range === 'custom' && Platform.OS !== 'web' && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <Pressable onPress={() => setShowStartPicker(true)} style={[styles.smallBtn]}>
            <Text style={styles.smallBtnText}>Inicio: {customStart ?? start}</Text>
          </Pressable>
          <Pressable onPress={() => setShowEndPicker(true)} style={[styles.smallBtn]}>
            <Text style={styles.smallBtnText}>Fin: {customEnd ?? end}</Text>
          </Pressable>
        </View>
      )}

      {/* Pickers nativos */}
      {showStartPicker && (
        <DateTimePicker
          value={new Date(customStart ?? start)}
          mode="date"
          onChange={onChangeStart}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={new Date(customEnd ?? end)}
          mode="date"
          onChange={onChangeEnd}
        />
      )}

      {/* Tarjeta principal de balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceValue}>{money(summary?.balance ?? 0)}</Text>
        <View style={styles.row}>
          <View style={[styles.kpi, { backgroundColor: '#052e1a' }]}>
            <Text style={[styles.kpiLabel, { color: '#10b981' }]}>Ingresos</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>{money(summary?.income ?? 0)}</Text>
          </View>
          <View style={[styles.kpi, { backgroundColor: '#3a0a0a' }]}>
            <Text style={[styles.kpiLabel, { color: '#ef4444' }]}>Gastos</Text>
            <Text style={[styles.kpiValue, { color: '#ef4444' }]}>{money(summary?.expense ?? 0)}</Text>
          </View>
        </View>
        <Text style={styles.rangeText}>{start} → {end}</Text>
      </View>

      {/* Lista por categoría */}
      <Text style={styles.sectionTitle}>Por categoría</Text>
      {!summary || summary.byCategory.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Sin datos para este rango</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {summary.byCategory.map((c) => (
            <View key={c.category} style={styles.catItem}>
              <View style={styles.catLeft}>
                <View style={styles.dot} />
                <Text style={styles.catName}>{c.category}</Text>
              </View>
              <View style={styles.catRight}>
                <Text style={styles.catCount}>{c.count} mov.</Text>
                <Text style={styles.catTotal}>{money(c.total)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Transacciones recientes */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Transacciones recientes</Text>
      {(!recent || recent.length === 0) ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No hay transacciones</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {recent.map((t) => (
            <TransactionItem key={t.id} tx={t} />
          ))}
        </View>
      )}
    </DismissibleScrollView>
  );
}

const styles = StyleSheet.create({
  logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1f2937' },
  chipActive: { backgroundColor: '#2563eb' },
  chipActiveAlt: { backgroundColor: '#7c3aed' },
  chipText: { color: '#cbd5e1', fontWeight: '600' },
  chipTextActive: { color: 'white' },

  smallBtn: { backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  smallBtnText: { color: '#e5e7eb', fontWeight: '700' },

  balanceCard: {
    backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#1f2937',
  },
  balanceLabel: { color: '#94a3b8', fontWeight: '600' },
  balanceValue: { color: 'white', fontSize: 34, fontWeight: '800', marginVertical: 6 },
  row: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 10 },
  kpi: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  kpiLabel: { fontSize: 12, fontWeight: '700' },
  kpiValue: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  rangeText: { color: '#64748b', fontSize: 12 },

  sectionTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginBottom: 10, marginTop: 4 },

  emptyBox: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  emptyText: { color: '#94a3b8' },

  catItem: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#38bdf8' },
  catName: { color: 'white', fontWeight: '700' },
  catRight: { alignItems: 'flex-end' },
  catCount: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  catTotal: { color: 'white', fontWeight: '800' },
});
