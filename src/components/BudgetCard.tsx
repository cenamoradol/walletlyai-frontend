// src/components/BudgetCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BudgetDTO } from '../services/budgets';
import { useMoney } from '../utils/money';

interface Props {
  budget: BudgetDTO;
}

export default function BudgetCard({ budget }: Props) {
  const money = useMoney();

  const title = budget.name?.trim()
    ? budget.name
    : budget.scope === 'CATEGORY' && budget.category
      ? budget.category.name
      : budget.scope === 'TYPE' && budget.type
        ? (budget.type === 'EXPENSE' ? 'Gastos' : 'Ingresos')
        : 'Presupuesto';

  const allocated = budget.amount ?? 0;
  const spent = budget.spent ?? 0;
  const remaining = budget.remaining ?? Math.max(0, allocated - spent);
  const percent = Number.isFinite(budget.percent) ? budget.percent : (
    allocated > 0 ? Math.round((spent / allocated) * 100) : 0
  );

  const pctWidth = Math.max(0, Math.min(percent, 200)); // cap visual a 200%
  const over = spent > allocated;

  return (
    <View style={[styles.card, over && styles.over]}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.badge, over ? styles.badgeOver : styles.badgeOk]}>
          {over ? 'Sobrepasado' : 'En curso'}
        </Text>
      </View>

      <Text style={styles.subtitle}>
        {fmtDate(budget.period.start)} – {fmtDate(budget.period.end)}
      </Text>

      {budget.scope === 'CATEGORY' && budget.category && (
        <Text style={styles.metaSmall}>
          Categoría: {budget.category.name} ({budget.category.type === 'gasto' ? 'Gasto' : 'Ingreso'})
        </Text>
      )}

      <View style={styles.rowBetween}>
        <Text style={styles.amount}>Asignado: {money.format(allocated)}</Text>
        <Text style={styles.amount}>Gastado: {money.format(spent)}</Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pctWidth}%` }, over && styles.progressOver]} />
        </View>
        <Text style={styles.percentLabel}>{percent}%</Text>
      </View>

      <Text style={[styles.remaining, over && styles.remainingOver]}>
        Restante: {money.format(Math.max(0, remaining))}
      </Text>

      <Text style={styles.meta}>ID: {budget.id} · {budget.scope}{budget.type ? ` · ${budget.type}` : ''}</Text>
    </View>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  over: { borderColor: '#fca5a5', backgroundColor: '#fffafa' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 2, color: '#6b7280' },
  metaSmall: { marginTop: 4, color: '#6b7280', fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, overflow: 'hidden' },
  badgeOk: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  badgeOver: { backgroundColor: '#fee2e2', color: '#991b1b' },
  amount: { marginTop: 8, fontWeight: '600', color: '#374151' },
  progressWrap: { marginTop: 10 },
  progressBg: { height: 10, backgroundColor: '#f3f4f6', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: '#111827' },
  progressOver: { backgroundColor: '#b91c1c' },
  percentLabel: { marginTop: 6, color: '#6b7280', fontSize: 12 },
  remaining: { marginTop: 4, fontWeight: '700', color: '#065f46' },
  remainingOver: { color: '#991b1b' },
  meta: { marginTop: 8, fontSize: 12, color: '#9ca3af' },
});
