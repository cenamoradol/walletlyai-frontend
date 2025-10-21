import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useMoney } from '../utils/money';
import type { Transaction as TxType } from '../types';

type Props = {
  tx: TxType & {
    // Compatibilidad flexible con tu shape actual
    hasTime?: boolean;
    category?: string | { name?: string };
  };
  onPress?: () => void;
};

// YYYY-MM-DD  o  YYYY-MM-DD · HH:mm (según hasTime)
function formatDateLine(iso: string, hasTime?: boolean) {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (hasTime) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day} · ${hh}:${mm}`;
    }
    return `${y}-${m}-${day}`;
  } catch {
    return iso;
  }
}

function getCategoryName(cat: Props['tx']['category']) {
  if (!cat) return 'Sin categoría';
  if (typeof cat === 'string') return cat || 'Sin categoría';
  return cat.name || 'Sin categoría';
}

export default function TransactionItem({ tx, onPress }: Props) {
  const { format } = useMoney();
  const isIncome = tx.type === 'ingreso';
  const color = isIncome ? '#10b981' : '#ef4444';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      {/* Línea 1: categoría/fecha-hora a la izquierda, monto a la derecha */}
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={[styles.dot, { backgroundColor: isIncome ? '#065f46' : '#7f1d1d' }]} />
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.category} numberOfLines={1}>
              {getCategoryName(tx.category)}
            </Text>
            <Text style={styles.date}>{formatDateLine(tx.date, tx.hasTime)}</Text>
          </View>
        </View>

        <Text style={[styles.amount, { color }]}>{format(tx.amount)}</Text>
      </View>

      {/* Línea 2: paymentMethod */}
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Pago:</Text>
        <Text style={styles.metaValue} numberOfLines={1}>
          {tx.paymentMethod || '—'}
        </Text>
      </View>

      {/* Línea 3: note (si existe) */}
      {!!tx.note && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Nota:</Text>
          <Text style={styles.metaValue} numberOfLines={2}>
            {tx.note}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  category: { color: 'white', fontWeight: '700', maxWidth: 220 },
  date: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '800', fontSize: 16 },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  metaLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 1 },
  metaValue: { color: '#e5e7eb', flexShrink: 1, flexGrow: 1 },
});
