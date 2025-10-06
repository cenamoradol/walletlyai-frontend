// src/screens/CategoryCreateScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { createCategory } from '../services/categories';
// Si usas DataCache para refrescar listas, descomenta:
// import { useDataCache } from '../context/DataCacheContext';
import { useNavigation } from '@react-navigation/native';

export default function CategoryCreateScreen() {
  const nav = useNavigation();
  // const { refresh } = useDataCache();
  const [name, setName] = useState('');
  const [type, setType] = useState<'gasto' | 'ingreso'>('gasto');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validación', 'Ingresa un nombre para la categoría.');
      return;
    }
    setLoading(true);
    try {
      await createCategory({ name: trimmed, type });
      // await refresh(); // si quieres refrescar tu cache global
      Alert.alert('Éxito', 'Categoría creada.');
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo crear la categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nueva categoría</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        placeholder="Comida, Transporte, etc."
        placeholderTextColor="#64748b"
        value={name}
        onChangeText={setName}
        style={styles.input}
        editable={!loading}
      />

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.segment}>
        <Pressable
          onPress={() => setType('gasto')}
          style={[styles.segBtn, type === 'gasto' && styles.segBtnActive]}
          disabled={loading}
        >
          <Text style={[styles.segText, type === 'gasto' && styles.segTextActive]}>Gasto</Text>
        </Pressable>
        <Pressable
          onPress={() => setType('ingreso')}
          style={[styles.segBtn, type === 'ingreso' && styles.segBtnActive]}
          disabled={loading}
        >
          <Text style={[styles.segText, type === 'ingreso' && styles.segTextActive]}>Ingreso</Text>
        </Pressable>
      </View>

      <Pressable onPress={onSubmit} style={[styles.saveBtn, loading && { opacity: 0.6 }]} disabled={loading}>
        <Text style={styles.saveText}>{loading ? 'Guardando...' : 'Guardar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { color: '#94a3b8', fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, color: 'white', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  segment: {
    flexDirection: 'row', backgroundColor: '#0b1220', borderRadius: 10,
    borderWidth: 1, borderColor: '#1f2937', marginBottom: 20,
  },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segBtnActive: { backgroundColor: '#1f2937' },
  segText: { color: '#94a3b8', fontWeight: '700' },
  segTextActive: { color: 'white' },
  saveBtn: {
    backgroundColor: '#22c55e', paddingVertical: 12, alignItems: 'center', borderRadius: 10,
  },
  saveText: { color: '#052e16', fontWeight: '800' },
});
