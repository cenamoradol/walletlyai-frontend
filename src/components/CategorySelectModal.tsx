// src/components/CategorySelectModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, TextInput, FlatList, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Alert
} from 'react-native';
import { Category } from '../types';
import { createCategory } from '../services/categories';

type Props = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];          // categorías ya filtradas por tipo
  onSelect: (c: Category) => void; // devuelve la categoría elegida
  categoryType: 'gasto' | 'ingreso'; // 👈 nuevo: tipo actual
  onCreated?: (c: Category) => void; // opcional: para refrescos externos
};

export default function CategorySelectModal({
  visible,
  onClose,
  categories,
  onSelect,
  categoryType,
  onCreated,
}: Props) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setAdding(false);
      setNewName('');
      setSaving(false);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const handleAddPress = () => {
    setAdding(true);
    setNewName(query.trim()); // autollenar con búsqueda actual (útil)
  };

  const handleSave = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Validación', 'Ingresa un nombre para la categoría.');
      return;
    }
    setSaving(true);
    try {
      const created = await createCategory({ name, type: categoryType });
      onCreated?.(created);   // notificar al padre si quiere refrescar listas
      onSelect(created);      // seleccionar inmediatamente la nueva
      onClose();              // cerrar el modal
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo crear la categoría.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Selecciona categoría</Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Botón Agregar categoría */}
              <Pressable onPress={handleAddPress} style={[styles.headerBtn, { backgroundColor: '#22c55e' }]}>
                <Text style={{ color: '#052e16', fontWeight: '800' }}>Agregar categoría</Text>
              </Pressable>

              {/* Botón Cerrar */}
              <Pressable onPress={onClose} style={styles.headerBtn}>
                <Text style={{ color: 'white', fontWeight: '700' }}>Cerrar</Text>
              </Pressable>
            </View>
          </View>

          {/* Zona “agregar” inline */}
          {adding && (
            <View style={styles.addRow}>
              <TextInput
                placeholder={`Nueva categoría de ${categoryType}`}
                placeholderTextColor="#64748b"
                value={newName}
                onChangeText={setNewName}
                style={[styles.search, { flex: 1, marginBottom: 0 }]}
                editable={!saving}
              />
              <Pressable
                onPress={handleSave}
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                disabled={saving}
              >
                <Text style={styles.saveText}>{saving ? '...' : 'Guardar'}</Text>
              </Pressable>
              <Pressable onPress={() => { setAdding(false); setNewName(''); }} style={styles.cancelBtn} disabled={saving}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
          )}

          {/* Buscador */}
          <TextInput
            placeholder="Buscar..."
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          />

          {/* Listado */}
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
  headerBtn: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  saveBtn: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#052e16', fontWeight: '800' },
  cancelBtn: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
  cancelText: { color: '#94a3b8', fontWeight: '700' },

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
