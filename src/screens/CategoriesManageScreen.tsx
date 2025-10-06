// src/screens/CategoriesManageScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ActivityIndicator, Alert, FlatList
} from 'react-native';
import { Category } from '../types';
import { getCategories, updateCategory, deleteCategory } from '../services/categories';

type EditableRow = {
  id: number;
  name: string;
  editing: boolean;
  saving: boolean;
};

export default function CategoriesManageScreen() {
  const [type, setType] = useState<'gasto' | 'ingreso'>('gasto');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Record<number, EditableRow>>({}); // estado local para edición

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setItems(data);
      // reinicia edición
      setRows({});
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudieron cargar las categorías';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(c => c.type === type)
      .filter(c => (q ? c.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, type, query]);

  const startEdit = (c: Category) => {
    setRows(prev => ({
      ...prev,
      [c.id]: { id: c.id, name: c.name, editing: true, saving: false }
    }));
  };

  const cancelEdit = (id: number) => {
    setRows(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const commitEdit = async (id: number) => {
    const row = rows[id];
    if (!row) return;
    const name = row.name.trim();
    if (!name) {
      Alert.alert('Validación', 'El nombre no puede estar vacío.');
      return;
    }

    setRows(prev => ({ ...prev, [id]: { ...row, saving: true } }));
    try {
      const updated = await updateCategory(id, { name });
      // actualiza en items
      setItems(prev => prev.map(c => (c.id === id ? { ...c, name: updated.name } : c)));
      // cierra edición
      cancelEdit(id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo actualizar la categoría';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
      setRows(prev => ({ ...prev, [id]: { ...row, saving: false } }));
    }
  };

  const confirmDelete = (c: Category) => {
    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${c.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => doDelete(c.id) },
      ],
    );
  };

  const doDelete = async (id: number) => {
    // marca guardando si está en edición
    if (rows[id]) setRows(prev => ({ ...prev, [id]: { ...prev[id], saving: true } }));
    try {
      await deleteCategory(id);
      setItems(prev => prev.filter(c => c.id !== id));
      cancelEdit(id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo eliminar la categoría';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
      if (rows[id]) setRows(prev => ({ ...prev, [id]: { ...prev[id], saving: false } }));
    }
  };

  const renderItem = ({ item }: { item: Category }) => {
    const row = rows[item.id];

    return (
      <View style={styles.row}>
        {row?.editing ? (
          <TextInput
            value={row.name}
            onChangeText={(t) => setRows(prev => ({ ...prev, [item.id]: { ...row, name: t } }))}
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            editable={!row.saving}
            autoFocus
          />
        ) : (
          <Text style={[styles.name, { flex: 1 }]}>{item.name}</Text>
        )}

        {row?.editing ? (
          <>
            <Pressable
              onPress={() => commitEdit(item.id)}
              style={[styles.btn, styles.btnSave, row?.saving && { opacity: 0.6 }]}
              disabled={row?.saving}
            >
              <Text style={styles.btnSaveText}>{row?.saving ? '...' : 'Guardar'}</Text>
            </Pressable>
            <Pressable onPress={() => cancelEdit(item.id)} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => startEdit(item)} style={[styles.btn, styles.btnEdit]}>
              <Text style={styles.btnEditText}>Editar</Text>
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} style={[styles.btn, styles.btnDanger]}>
              <Text style={styles.btnDangerText}>Eliminar</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Toggle tipo */}
      <View style={styles.typeRow}>
        <Pressable
          onPress={() => setType('gasto')}
          style={[styles.typeChip, type === 'gasto' && styles.typeActiveOut]}
        >
          <Text style={[styles.typeText, type === 'gasto' && styles.typeTextActive]}>Gasto</Text>
        </Pressable>
        <Pressable
          onPress={() => setType('ingreso')}
          style={[styles.typeChip, type === 'ingreso' && styles.typeActiveIn]}
        >
          <Text style={[styles.typeText, type === 'ingreso' && styles.typeTextActive]}>Ingreso</Text>
        </Pressable>
      </View>

      {/* Buscar */}
      <TextInput
        placeholder="Buscar categoría..."
        placeholderTextColor="#64748b"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      {/* Lista */}
      {loading ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator />
          <Text style={{ color: '#94a3b8', marginTop: 6 }}>Cargando…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8' }}>No hay categorías</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#1f2937' },
  typeActiveIn: { backgroundColor: '#065f46' },
  typeActiveOut: { backgroundColor: '#7f1d1d' },
  typeText: { color: '#cbd5e1', fontWeight: '700' },
  typeTextActive: { color: '#fff' },

  search: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, color: 'white', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },

  row: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center',
  },
  name: { color: 'white', fontWeight: '700' },

  input: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#334155',
    borderRadius: 10, color: 'white', paddingHorizontal: 10, paddingVertical: 8,
  },

  btn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, marginLeft: 6 },
  btnEdit: { backgroundColor: '#1e3a8a' },
  btnEditText: { color: 'white', fontWeight: '800' },
  btnDanger: { backgroundColor: '#991b1b' },
  btnDangerText: { color: 'white', fontWeight: '800' },
  btnGhost: { backgroundColor: '#1f2937' },
  btnGhostText: { color: '#cbd5e1', fontWeight: '800' },
  btnSave: { backgroundColor: '#22c55e' },
  btnSaveText: { color: '#052e16', fontWeight: '800' },
});
