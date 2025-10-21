import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Alert, Modal, FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TransactionsService } from '../services/transactions';
import { getCategories } from '../services/categories';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMoney } from '../utils/money';
import { useDataCache } from '../context/DataCacheContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Category } from '../types';

type RouteParams = { id: number };

function formatYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function toIsoLocal(dateYmd: string, timeHM: string) {
  const [y, m, d] = dateYmd.split('-').map(n => +n);
  const [H, MM] = timeHM.split(':').map(n => +n);
  const local = new Date(y, (m - 1), d, H, MM, 0, 0);
  return local.toISOString();
}

export default function TransactionDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { refresh } = useDataCache();
  const { format } = useMoney();

  const id: number = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
  const [amount, setAmount] = useState<string>('0');
  const [dateYMD, setDateYMD] = useState<string>(formatYMD(new Date()));
  const [hasTime, setHasTime] = useState<boolean>(false);
  const [timeHM, setTimeHM] = useState<string>('12:00'); // por defecto
  const [categoryId, setCategoryId] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Categorías
  const [cats, setCats] = useState<Category[]>([]);
  const [catModal, setCatModal] = useState(false);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  // Carga categorías una vez
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getCategories();
        if (!mounted) return;
        setCats(list || []);
      } catch (e) {
        // noop: si falla, el selector se mostrará vacío
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Cargar transacción
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tx = await TransactionsService.getById(id);
        if (!mounted) return;
        setType(tx.type);
        setAmount(String(tx.amount));
        const d = new Date(tx.date);
        setDateYMD(formatYMD(d));
        setHasTime(!!tx.hasTime);
        setTimeHM(
          d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        );
        setCategoryId(tx.categoryId);
        setPaymentMethod(tx.paymentMethod || '');
        setNote(tx.note || '');
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'No se pudo cargar la transacción');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Filtradas por tipo seleccionado
  const filteredCats = useMemo(
    () => cats.filter(c => c.type === type),
    [cats, type]
  );

  // Nombre de categoría actual
  const currentCatName = useMemo(() => {
    const found = cats.find(c => c.id === categoryId);
    return found?.name || 'Sin categoría';
  }, [cats, categoryId]);

  // Si cambias el tipo y la categoría actual no coincide, autoajusta
  useEffect(() => {
    const current = cats.find(c => c.id === categoryId);
    if (current && current.type === type) return; // ok
    // auto-seleccionar primera del tipo
    const first = filteredCats[0];
    if (first) setCategoryId(first.id);
    else setCategoryId(0);
  }, [type, cats]); // eslint-disable-line

  const onPickDate = (_: any, d?: Date) => {
    setShowDatePicker(false);
    if (d) setDateYMD(formatYMD(d));
  };

  const onPickTime = (_: any, d?: Date) => {
    setShowTimePicker(false);
    if (d) {
      const HH = String(d.getHours()).padStart(2, '0');
      const MM = String(d.getMinutes()).padStart(2, '0');
      setTimeHM(`${HH}:${MM}`);
    }
  };

  const save = async () => {
    try {
      const payload: any = {
        type,
        amount: Number(amount),
        categoryId: categoryId || undefined, // evita 0 inválido
        paymentMethod,
        note,
        date: hasTime ? toIsoLocal(dateYMD, timeHM) : dateYMD,
      };

      await TransactionsService.update(id, payload);
      await refresh({ silent: true });
      Alert.alert('Listo', 'Transacción actualizada');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? e?.message ?? 'No se pudo actualizar');
    }
  };

  const remove = async () => {
    Alert.alert('Eliminar', '¿Seguro que deseas eliminar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await TransactionsService.remove(id);
            await refresh({ silent: true });
            Alert.alert('Eliminada', 'La transacción fue eliminada');
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? e?.message ?? 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <View style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white' }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Header custom */}
      <View style={styles.headerBar}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backGlyph}>{'\u2039'}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle de transacción
        </Text>
        <Pressable onPress={remove} style={styles.deleteBtn}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Eliminar</Text>
        </Pressable>
      </View>

      <View style={styles.page}>
        {/* Tipo */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {(['ingreso', 'gasto'] as const).map((v) => (
              <Pressable
                key={v}
                onPress={() => setType(v)}
                style={[styles.chip, type === v && styles.chipActive]}
              >
                <Text style={[styles.chipText, type === v && styles.chipTextActive]}>{v}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Monto */}
        <View style={styles.field}>
          <Text style={styles.label}>Monto</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#64748b"
            style={styles.input}
          />
          <Text style={styles.help}>Vista previa: {format(Number(amount) || 0)}</Text>
        </View>

        {/* Fecha y hora */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>{dateYMD}</Text>
            </Pressable>

            <Pressable
              onPress={() => setHasTime((v) => !v)}
              style={[styles.smallBtn, hasTime && styles.smallBtnActive]}
            >
              <Text style={styles.smallBtnText}>{hasTime ? 'Con hora' : 'Sin hora'}</Text>
            </Pressable>

            {hasTime && (
              <Pressable onPress={() => setShowTimePicker(true)} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>{timeHM}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Categoría - Selector por tipo */}
        <View style={styles.field}>
          <Text style={styles.label}>Categoría</Text>
          <Pressable
            style={[styles.input, { justifyContent: 'center' }]}
            onPress={() => setCatModal(true)}
          >
            <Text style={{ color: '#e5e7eb' }}>
              {currentCatName}{filteredCats.length === 0 ? ' (no hay categorías)' : ''}
            </Text>
          </Pressable>
          <Text style={styles.help}>
            Mostrando categorías de <Text style={{ fontWeight: '800' }}>{type}</Text>
          </Text>
        </View>

        {/* Método de pago */}
        <View style={styles.field}>
          <Text style={styles.label}>Método de pago</Text>
          <TextInput
            value={paymentMethod}
            onChangeText={setPaymentMethod}
            placeholder="Efectivo, Tarjeta..."
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        </View>

        {/* Nota */}
        <View style={styles.field}>
          <Text style={styles.label}>Nota</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="opcional"
            placeholderTextColor="#64748b"
            style={[styles.input, { height: 80 }]}
            multiline
          />
        </View>

        <Pressable onPress={save} style={styles.saveBtn}>
          <Text style={{ color: 'white', fontWeight: '800' }}>Guardar cambios</Text>
        </Pressable>
      </View>

      {/* Pickers nativos */}
      {showDatePicker && (
        <DateTimePicker value={new Date(dateYMD)} mode="date" onChange={onPickDate} />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={new Date(`1970-01-01T${timeHM}:00`)}
          mode="time"
          is24Hour
          onChange={onPickTime}
        />
      )}

      {/* Modal de categorías */}
      <Modal visible={catModal} transparent animationType="fade" onRequestClose={() => setCatModal(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona categoría ({type})</Text>

            {filteredCats.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No hay categorías de {type}</Text>
              </View>
            ) : (
              <FlatList
                data={filteredCats}
                keyExtractor={(item) => String(item.id)}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { setCategoryId(item.id); setCatModal(false); }}
                    style={[
                      styles.catRow,
                      item.id === categoryId && { borderColor: '#2563eb' },
                    ]}
                  >
                    <Text style={styles.catName}>{item.name}</Text>
                  </Pressable>
                )}
              />
            )}

            <Pressable onPress={() => setCatModal(false)} style={styles.modalClose}>
              <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
    backgroundColor: '#0f172a',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  backGlyph: { color: '#fff', fontSize: 24, lineHeight: 24, marginTop: -1 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '800', fontSize: 16 },
  deleteBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },

  // Body
  page: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  field: { marginBottom: 14 },
  label: { color: '#94a3b8', fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#0b1220',
    borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    color: 'white',
  },
  help: { color: '#94a3b8', fontSize: 12, marginTop: 4 },

  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1f2937' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { color: '#cbd5e1', fontWeight: '600' },
  chipTextActive: { color: 'white' },

  smallBtn: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#334155',
  },
  smallBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  smallBtnText: { color: '#e5e7eb', fontWeight: '700' },

  saveBtn: {
    marginTop: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },

  // Modal categorías
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#0b1220',
    borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 14,
    padding: 14,
    maxHeight: '75%',
  },
  modalTitle: { color: '#e5e7eb', fontWeight: '800', fontSize: 16, marginBottom: 10 },
  catRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0f172a',
  },
  catName: { color: 'white', fontWeight: '700' },
  modalClose: {
    marginTop: 12,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
  },

  emptyBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 10, padding: 12,
    alignItems: 'center',
  },
  emptyText: { color: '#94a3b8' },
});
