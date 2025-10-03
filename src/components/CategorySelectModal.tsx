import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, TextInput, FlatList, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { Category } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];          // categorías ya filtradas por tipo
  onSelect: (c: Category) => void; // devuelve la categoría elegida
};

export default function CategorySelectModal({ visible, onClose, categories, onSelect }: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Selecciona categoría</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: 'white', fontWeight: '700' }}>Cerrar</Text>
            </Pressable>
          </View>

          <TextInput
            placeholder="Buscar..."
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { Keyboard.dismiss(); onSelect(item); onClose(); }}
                style={styles.item}
              >
                <Text style={styles.itemText}>{item.name}</Text>
                <Text style={styles.itemType}>{item.type === 'ingreso' ? 'Ingreso' : 'Gasto'}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ color: '#94a3b8' }}>Sin resultados</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 12 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetWrap: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 16, maxHeight: '100%', borderWidth: 1, borderColor: '#1f2937',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { color: 'white', fontSize: 16, fontWeight: '800' },
  closeBtn: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  search: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, color: 'white', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  item: {
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#1f2937', backgroundColor: '#0b1220', marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  itemText: { color: 'white', fontWeight: '700' },
  itemType: { color: '#94a3b8', fontSize: 12 },
  empty: { paddingVertical: 20, alignItems: 'center' },
});
