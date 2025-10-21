// src/screens/CreateBudgetScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BudgetsService, CreateBudgetBody } from '../services/budgets';
import { getCategories } from '../services/categories';
import { Category } from '../types';
import { useNavigation } from '@react-navigation/native';

type Mode = 'TYPE' | 'CATEGORY';
type CatKind = 'gasto' | 'ingreso'; // coincide con tu backend

export default function CreateBudgetScreen() {
  const navigation = useNavigation();

  // Tabs: Por tipo / Por categoría
  const [mode, setMode] = useState<Mode>('TYPE');

  // Por tipo (global)
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE'); // Gastos por default

  // Por categoría
  const [catKind, setCatKind] = useState<CatKind>('gasto');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  // Campos comunes
  const [amount, setAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Mostrar inline los pickers (al ser pantalla normal, ya no hay problemas de modal)
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  // Cargar categorías cuando se use modo CATEGORY
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (mode !== 'CATEGORY') return;
      try {
        setLoadingCats(true);
        const data = await getCategories(); // retorna todas
        if (!mounted) return;
        setCategories(data);
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'No se pudieron cargar categorías');
      } finally {
        setLoadingCats(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [mode]);

  // Si cambias el filtro (gasto/ingreso) y la categoría seleccionada ya no coincide, deselecciona
  useEffect(() => {
    if (mode !== 'CATEGORY' || !categoryId) return;
    const found = categories.find((c) => c.id === categoryId);
    if (found && found.type !== catKind) {
      setCategoryId(undefined);
    }
  }, [catKind, categories, categoryId, mode]);

  const filteredCategories = useMemo(
    () => (mode === 'CATEGORY' ? categories.filter((c) => c.type === catKind) : []),
    [categories, catKind, mode]
  );

  const canSubmit = useMemo(() => {
    const amt = Number(amount);
    if (!amt || isNaN(amt) || amt <= 0) return false;
    if (startDate > endDate) return false;
    if (mode === 'TYPE' && !type) return false;
    if (mode === 'CATEGORY' && !categoryId) return false;
    return true;
  }, [amount, startDate, endDate, mode, type, categoryId]);

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (!canSubmit) {
      Alert.alert('Validación', 'Completa los campos correctamente.');
      return;
    }
    const body: CreateBudgetBody = {
      amount: amt,
      periodStart: toStartOfDayUTC(startDate),
      periodEnd: toEndOfDayUTC(endDate),
      ...(mode === 'TYPE' ? { type } : {}),
      ...(mode === 'CATEGORY' ? { categoryId } : {}),
    };

    // Asegurar exclusividad por si acaso
    if (mode === 'TYPE') delete (body as any).categoryId;
    if (mode === 'CATEGORY') delete (body as any).type;

    try {
      await BudgetsService.create(body);
      Alert.alert('Listo', 'Presupuesto creado.');
      // Regresar a la lista
      navigation.goBack();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'No se pudo crear el presupuesto';
      Alert.alert('Error', msg);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header simple */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <Text style={styles.title}>Nuevo presupuesto</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Tabs de modo */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setMode('TYPE')}
            style={[styles.tabItem, mode === 'TYPE' && styles.tabItemActive]}
          >
            <Text style={[styles.tabTxt, mode === 'TYPE' && styles.tabTxtActive]}>Por tipo</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('CATEGORY')}
            style={[styles.tabItem, mode === 'CATEGORY' && styles.tabItemActive]}
          >
            <Text style={[styles.tabTxt, mode === 'CATEGORY' && styles.tabTxtActive]}>Por categoría</Text>
          </Pressable>
        </View>

        {/* CONTENIDO: Por TIPO */}
        {mode === 'TYPE' && (
          <>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => setType('EXPENSE')}
                style={[styles.chip, type === 'EXPENSE' && styles.chipActive]}
              >
                <Text style={[styles.chipTxt, type === 'EXPENSE' && styles.chipTxtActive]}>
                  Gastos
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType('INCOME')}
                style={[styles.chip, type === 'INCOME' && styles.chipActive]}
              >
                <Text style={[styles.chipTxt, type === 'INCOME' && styles.chipTxtActive]}>
                  Ingresos
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* CONTENIDO: Por CATEGORÍA */}
        {mode === 'CATEGORY' && (
          <>
            <Text style={styles.label}>Tipo de categoría</Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => setCatKind('gasto')}
                style={[styles.chip, catKind === 'gasto' && styles.chipActive]}
              >
                <Text style={[styles.chipTxt, catKind === 'gasto' && styles.chipTxtActive]}>
                  Gastos
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCatKind('ingreso')}
                style={[styles.chip, catKind === 'ingreso' && styles.chipActive]}
              >
                <Text style={[styles.chipTxt, catKind === 'ingreso' && styles.chipTxtActive]}>
                  Ingresos
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { marginTop: 8 }]}>Categoría</Text>
            {loadingCats ? (
              <View style={{ paddingVertical: 10 }}>
                <ActivityIndicator />
              </View>
            ) : (
              <View style={styles.selectBox}>
                <ScrollView style={{ maxHeight: 220 }}>
                  {filteredCategories.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={[styles.option, categoryId === c.id && styles.optionActive]}
                    >
                      <Text style={styles.optionName}>{c.name}</Text>
                      <Text style={styles.optionType}>
                        {c.type === 'gasto' ? 'Gasto' : 'Ingreso'}
                      </Text>
                    </Pressable>
                  ))}
                  {filteredCategories.length === 0 && (
                    <View style={{ padding: 10 }}>
                      <Text style={{ color: '#6b7280' }}>
                        No hay categorías de {catKind === 'gasto' ? 'gasto' : 'ingreso'}.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* Monto */}
        <Text style={styles.label}>Monto asignado</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        {/* Fecha inicio */}
        <Text style={styles.label}>Inicio del período</Text>
        <Pressable onPress={() => setShowStart((v) => !v)} style={styles.selector}>
          <Text>{toYMD(startDate)} (00:00 UTC)</Text>
        </Pressable>
        {showStart && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => { if (d) setStartDate(d); }}
          />
        )}

        {/* Fecha fin */}
        <Text style={[styles.label, { marginTop: 10 }]}>Fin del período</Text>
        <Pressable onPress={() => setShowEnd((v) => !v)} style={styles.selector}>
          <Text>{toYMD(endDate)} (23:59:59 UTC)</Text>
        </Pressable>
        {showEnd && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => { if (d) setEndDate(d); }}
          />
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.saveBtn, (!canSubmit) && { opacity: 0.6 }]}
        >
          <Text style={styles.saveTxt}>Crear presupuesto</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function toStartOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)).toISOString();
}
function toEndOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 0)).toISOString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { padding: 6 }, backTxt: { fontSize: 22 },
  title: { fontSize: 16, fontWeight: '700' },

  tabs: {
    flexDirection: 'row',
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, overflow: 'hidden', marginBottom: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#fff' },
  tabItemActive: { backgroundColor: '#111827' },
  tabTxt: { color: '#111827', fontWeight: '600' },
  tabTxtActive: { color: '#fff', fontWeight: '700' },

  label: { fontSize: 14, color: '#555', marginTop: 10, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 10 },

  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipTxt: { color: '#111827' },
  chipTxtActive: { color: '#fff', fontWeight: '700' },

  selectBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 6 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10,
  },
  optionActive: { backgroundColor: '#f3f4f6' },
  optionName: { fontWeight: '600', color: '#111827' },
  optionType: { color: '#6b7280' },

  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16,
  },
  selector: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  saveBtn: {
    marginTop: 16, marginBottom: 24, backgroundColor: '#111827',
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  saveTxt: { color: 'white', fontSize: 16, fontWeight: '700' },
});
