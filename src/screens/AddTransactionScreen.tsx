// src/screens/AddTransactionScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, Alert, Platform,
  ActivityIndicator, Keyboard, TouchableWithoutFeedback, Switch
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { z } from 'zod';
import { TransactionsService } from '../services/transactions';
import { getCategories } from '../services/categories';
import { BackendTxType, Category, CreateTransactionDto, RecurrenceKind, Transaction } from '../types';
import CategorySelectModal from '../components/CategorySelectModal';
import DismissibleScrollView from '../components/DismissibleScrollView';
import { useDataCache } from '../context/DataCacheContext';

// ---------- VALIDACIÓN ----------
const schema = z.object({
  type: z.enum(['ingreso', 'gasto']),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  categoryId: z.coerce.number().int().positive('Selecciona una categoría'),
  paymentMethod: z.string().min(1, 'Método de pago requerido'),
  note: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  isRecurring: z.boolean(),
  // ahora opcionales:
  recurrence: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Fecha fin inválida (YYYY-MM-DD)').optional(),
}).superRefine((v, ctx) => {
  // Si es recurrente → ambos requeridos
  if (v.isRecurring) {
    if (!v.recurrence) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recurrence'], message: 'Selecciona la recurrencia' });
    }
    if (!v.endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Selecciona la fecha fin' });
    }
  }
});

// ---------- HELPERS DE FECHA/HORA ----------
function formatDateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function timeLabel(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
/** Combina "YYYY-MM-DD" + hora/min de un Date y retorna ISO (UTC) */
function toISOWithTime(dateYYYYMMDD: string, time: Date) {
  const [y, m, d] = dateYYYYMMDD.split('-').map(Number);
  const local = new Date(y, (m - 1), d, time.getHours(), time.getMinutes(), 0, 0);
  return local.toISOString();
}

export default function AddTransactionScreen({ navigation }: any) {
  const [type, setType] = useState<BackendTxType>('gasto');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [note, setNote] = useState('');

  // ----- FECHA/HORA: por defecto ahora -----
  const now = useMemo(() => new Date(), []);
  const [date, setDate] = useState(formatDateLocal(now)); // YYYY-MM-DD
  const [showPicker, setShowPicker] = useState(false);

  const [time, setTime] = useState<Date>(new Date(now));  // solo usamos HH:mm de aquí
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ----- RECURRENCIA -----
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceKind>(''); // '' por defecto (no recurrente)
  const defaultEnd = useMemo(() => {
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);
    return end;
  }, [now]);
  const [endDate, setEndDate] = useState(formatDateLocal(defaultEnd));
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [endTime, setEndTime] = useState<Date>(new Date(defaultEnd)); // hora fin
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // ----- CATEGORÍAS -----
  const [loadingCats, setLoadingCats] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const selectedCategoryName = useMemo(
    () => categories.find(c => c.id === selectedCategoryId)?.name ?? '',
    [categories, selectedCategoryId]
  );
  const [showCatModal, setShowCatModal] = useState(false);

  const { addLocalTx } = useDataCache();

  useEffect(() => {
    (async () => {
      try {
        setLoadingCats(true);
        const cats = await getCategories();
        setCategories(cats);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'No se pudieron cargar las categorías';
        Alert.alert('Categorías', Array.isArray(msg) ? msg.join(', ') : msg);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const filteredCategories = useMemo(() => categories.filter(c => c.type === type), [categories, type]);

  useEffect(() => {
    if (selectedCategoryId == null) return;
    const stillValid = filteredCategories.some(c => c.id === selectedCategoryId);
    if (!stillValid) setSelectedCategoryId(undefined);
  }, [type, filteredCategories, selectedCategoryId]);

  // ----- PICKERS FECHA/HORA -----
  const openDatePicker = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      const v = typeof prompt !== 'undefined' ? prompt('Fecha (YYYY-MM-DD):', date) : null;
      if (v) setDate(v);
    } else {
      setShowPicker(true);
    }
  };
  const onChangeDate = (_e: DateTimePickerEvent, d?: Date) => {
    setShowPicker(false);
    if (d) setDate(formatDateLocal(d));
  };

  const openTimePicker = () => setShowTimePicker(true);
  const onChangeTime = (_e: DateTimePickerEvent, d?: Date) => {
    setShowTimePicker(false);
    if (d) setTime(d);
  };

  const openEndPicker = () => setShowEndPicker(true);
  const onChangeEndDate = (_e: DateTimePickerEvent, d?: Date) => {
    setShowEndPicker(false);
    if (d) setEndDate(formatDateLocal(d));
  };

  const openEndTimePicker = () => setShowEndTimePicker(true);
  const onChangeEndTime = (_e: DateTimePickerEvent, d?: Date) => {
    setShowEndTimePicker(false);
    if (d) setEndTime(d);
  };

  const recurrenceOptions: { key: Exclude<RecurrenceKind, ''>; label: string }[] = [
    { key: 'daily', label: 'Diario' },
    { key: 'weekly', label: 'Semanal' },
    { key: 'biweekly', label: 'Quincenal' },
    { key: 'monthly', label: 'Mensual' },
  ];

  const onSubmit = async () => {
    try {
      // Validar: si no es recurrente no exigimos recurrence/endDate
      const parsed = schema.parse({
        type,
        amount,
        categoryId: selectedCategoryId,
        paymentMethod: paymentMethod.trim(),
        note: note?.trim() || undefined,
        date,
        isRecurring,
        recurrence: isRecurring ? (recurrence || undefined) : undefined,
        endDate: isRecurring ? endDate : undefined,
      });

      // Convertir a ISO con hora real
      const dateISO = toISOWithTime(parsed.date, time);
      // endDate solo si es recurrente; si no, la omitimos por completo
      const endDateISO = parsed.isRecurring
        ? toISOWithTime(parsed.endDate!, endTime)
        : undefined;

      // Construir payload sin campos extra cuando no es recurrente
      const payload: CreateTransactionDto = {
        type: parsed.type,
        amount: Number(parsed.amount),
        categoryId: parsed.categoryId,
        paymentMethod: parsed.paymentMethod,
        note: parsed.note,
        isRecurring: parsed.isRecurring,
        date: dateISO,
        ...(parsed.isRecurring ? { recurrence: parsed.recurrence!, endDate: endDateISO! } : {}),
      };

      const serverTx = await TransactionsService.create(payload);

      // Enriquecer con nombre de categoría (UI-friendly)
      const txForCache: Transaction = {
        ...serverTx,
        category: selectedCategoryName || 'Sin categoría',
      };

      await addLocalTx(txForCache);

      Alert.alert('Éxito', 'Transacción creada');
      navigation.goBack();
    } catch (e: any) {
      if (e?.issues) {
        const first = e.issues[0]?.message ?? 'Revisa los datos';
        Alert.alert('Validación', first);
      } else {
        const msg = e?.response?.data?.message || e?.message || 'No se pudo crear la transacción';
        Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
      }
    }
  };

  const RecurrenceChip = ({ rk, label }: { rk: Exclude<RecurrenceKind, ''>; label: string }) => (
    <Pressable
      onPress={() => setRecurrence(rk)}
      style={[styles.chip, recurrence === rk && styles.chipActive]}
    >
      <Text style={[styles.chipText, recurrence === rk && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <DismissibleScrollView
        style={{ flex: 1, backgroundColor: '#0f172a' }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        {/* Toggle tipo */}
        <View style={styles.typeRow}>
          <Pressable onPress={() => setType('ingreso')} style={[styles.typeChip, type === 'ingreso' && styles.typeActiveIn]}>
            <Text style={[styles.typeText, type === 'ingreso' && styles.typeTextActive]}>Ingreso</Text>
          </Pressable>
          <Pressable onPress={() => setType('gasto')} style={[styles.typeChip, type === 'gasto' && styles.typeActiveOut]}>
            <Text style={[styles.typeText, type === 'gasto' && styles.typeTextActive]}>Gasto</Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="Monto"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          returnKeyType="next"
        />

        {/* Categoría → Modal FlatList */}
        <View style={styles.selectorBox}>
          <Text style={styles.selectorLabel}>Categoría</Text>
          {loadingCats ? (
            <View style={styles.selectorLoading}>
              <ActivityIndicator />
              <Text style={{ color: '#94a3b8', marginTop: 6 }}>Cargando categorías…</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <Text style={{ color: '#94a3b8' }}>No hay categorías para este tipo</Text>
          ) : (
            <Pressable onPress={() => setShowCatModal(true)} style={styles.selectorBtn}>
              <Text style={{ color: 'white', fontWeight: '700' }}>
                {selectedCategoryId ? selectedCategoryName : 'Selecciona una categoría'}
              </Text>
            </Pressable>
          )}
        </View>

        <TextInput
          placeholder="Método de pago (p.ej. Tarjeta, Transferencia)"
          value={paymentMethod}
          onChangeText={setPaymentMethod}
          style={styles.input}
        />

        <TextInput
          placeholder="Nota (opcional)"
          value={note}
          onChangeText={setNote}
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          multiline
        />

        {/* Fecha + Hora */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={openDatePicker} style={[styles.dateBtn, { flex: 1 }]}>
            <Text style={styles.dateBtnText}>Fecha: {date}</Text>
          </Pressable>
          <Pressable onPress={openTimePicker} style={[styles.dateBtn, { flex: 1 }]}>
            <Text style={styles.dateBtnText}>Hora: {timeLabel(time)}</Text>
          </Pressable>
        </View>

        {showPicker && (
          <DateTimePicker value={new Date(date)} mode="date" onChange={onChangeDate} />
        )}
        {showTimePicker && (
          <DateTimePicker value={time} mode="time" onChange={onChangeTime} is24Hour />
        )}

        {/* Recurrencia */}
        <View style={styles.recurringRow}>
          <Text style={styles.recurringLabel}>¿Transacción recurrente?</Text>
          <Switch
            value={isRecurring}
            onValueChange={(v) => {
              setIsRecurring(v);
              if (!v) {
                setRecurrence('');
                setEndDate(date);
                setEndTime(time);
              } else {
                setRecurrence('monthly');
              }
            }}
          />
        </View>

        {isRecurring && (
          <View style={styles.recurringCard}>
            <Text style={styles.sectionTitle}>Recurrencia</Text>

            <View style={styles.chipsRow}>
              {recurrenceOptions.map(o => (
                <RecurrenceChip key={o.key} rk={o.key} label={o.label} />
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Pressable onPress={openEndPicker} style={[styles.dateBtn, { flex: 1 }]}>
                <Text style={styles.dateBtnText}>Fin: {endDate}</Text>
              </Pressable>
              <Pressable onPress={openEndTimePicker} style={[styles.dateBtn, { flex: 1 }]}>
                <Text style={styles.dateBtnText}>Hora fin: {timeLabel(endTime)}</Text>
              </Pressable>
            </View>

            {showEndPicker && (
              <DateTimePicker value={new Date(endDate)} mode="date" onChange={onChangeEndDate} />
            )}
            {showEndTimePicker && (
              <DateTimePicker value={endTime} mode="time" onChange={onChangeEndTime} is24Hour />
            )}
          </View>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={!selectedCategoryId || !amount || !paymentMethod}
          style={[
            styles.submitBtn,
            (!selectedCategoryId || !amount || !paymentMethod) && { opacity: 0.6 }
          ]}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Guardar</Text>
        </Pressable>

        {/* Modal categorías */}
        <CategorySelectModal
          visible={showCatModal}
          onClose={() => setShowCatModal(false)}
          categories={filteredCategories}
          onSelect={(cat) => { setSelectedCategoryId(cat.id); }}
          categoryType={type}
          onCreated={(newCat) => {
            setCategories(prev => [newCat, ...prev]);
            setSelectedCategoryId(newCat.id);
          }}
        />
      </DismissibleScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#1f2937' },
  typeActiveIn: { backgroundColor: '#065f46' },
  typeActiveOut: { backgroundColor: '#7f1d1d' },
  typeText: { color: '#cbd5e1', fontWeight: '700' },
  typeTextActive: { color: '#fff' },

  input: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, color: 'white', paddingHorizontal: 12, paddingVertical: 10,
  },

  selectorBox: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, padding: 8,
  },
  selectorLabel: { color: '#94a3b8', fontSize: 12, marginLeft: 6, marginBottom: 4, fontWeight: '700' },
  selectorLoading: { alignItems: 'center', paddingVertical: 16 },
  selectorBtn: {
    backgroundColor: '#1f2937', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#334155',
  },

  dateBtn: { backgroundColor: '#1f2937', padding: 12, borderRadius: 12, alignItems: 'center' },
  dateBtnText: { color: 'white', fontWeight: '700' },

  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  recurringLabel: { color: '#e2e8f0', fontWeight: '700' },
  recurringCard: {
    backgroundColor: '#0b1220', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2937',
  },
  sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: '800', marginBottom: 8 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1f2937' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { color: '#cbd5e1', fontWeight: '600' },
  chipTextActive: { color: 'white' },

  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
});
