import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, Alert, FlatList, Switch, Platform, KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTransactionFromText } from '../services/ai';

type Pattern = {
  id: string;
  enabled: boolean;
  sender?: string;        // contains (simple), puedes migrar a regex si quieres
  messageRegex?: string;  // regex sin delimitadores, flags 'i' por defecto
};

const STORE_KEY = 'txn_detection_patterns_v1';
const DL_ENABLED_KEY = 'txn_detection_deeplink_enabled';

function testPattern(p: Pattern, sender: string, body: string) {
  if (!p.enabled) return false;

  if (p.sender && p.sender.trim().length > 0) {
    const needle = p.sender.trim().toLowerCase();
    const hay = (sender || '').toLowerCase();
    if (!hay.includes(needle)) return false;
  }

  if (p.messageRegex && p.messageRegex.trim().length > 0) {
    try {
      const re = new RegExp(p.messageRegex, 'i');
      if (!re.test(body || '')) return false;
    } catch {
      return false;
    }
  }

  return true;
}

export default function DetectionScreen() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [dlEnabled, setDlEnabled] = useState(true);

  const [sender, setSender] = useState('');
  const [body, setBody] = useState('');

  const [newSender, setNewSender] = useState('');
  const [newRegex, setNewRegex] = useState('');

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      const rawDl = await AsyncStorage.getItem(DL_ENABLED_KEY);
      if (raw) setPatterns(JSON.parse(raw));
      if (rawDl != null) setDlEnabled(rawDl === 'true');
    })();
  }, []);

  const saveAll = async (next: Pattern[]) => {
    setPatterns(next);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next));
  };

  const saveDl = async (v: boolean) => {
    setDlEnabled(v);
    await AsyncStorage.setItem(DL_ENABLED_KEY, v ? 'true' : 'false');
  };

  const addPattern = () => {
    if (!newSender && !newRegex) {
      Alert.alert('Patrón', 'Ingresa al menos remitente o regex del mensaje');
      return;
    }
    const p: Pattern = {
      id: String(Date.now()),
      enabled: true,
      sender: newSender.trim(),
      messageRegex: newRegex.trim(),
    };
    const next = [p, ...patterns];
    saveAll(next);
    setNewSender('');
    setNewRegex('');
  };

  const removePattern = (id: string) => {
    saveAll(patterns.filter(p => p.id !== id));
  };

  const togglePattern = (id: string) => {
    const next = patterns.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
    saveAll(next);
  };

  const matches = useMemo(() => {
    if (!sender && !body) return [];
    return patterns.filter(p => testPattern(p, sender, body));
  }, [patterns, sender, body]);

  const onSend = async () => {
    if (!body.trim()) {
      Alert.alert('Detección', 'Pega un SMS en el campo “Mensaje”');
      return;
    }
    try {
      await saveTransactionFromText(body.trim());
      Alert.alert('Listo', 'Texto enviado a /ai/save-transaction');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'No se pudo enviar');
    }
  };

  const deeplinkExample = `walletlyai://ingest?text=${encodeURIComponent(
    'FICO: Transaccion TC xxxx***7043 por HNL 100.00 en ESTACION DE SERV, si no la reconoce llame al 2280-1000'
  )}`;

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={patterns}
        keyExtractor={i => i.id}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Text style={styles.title}>Detección de transacciones</Text>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Ingesta por Deep Link</Text>
                <Switch value={dlEnabled} onValueChange={saveDl} />
              </View>
              <Text style={styles.tip}>
                Actívalo para permitir que Atajos (iOS) o Tasker/MacroDroid (Android) envíen texto a la app:
              </Text>
              <Text style={styles.code}>{deeplinkExample}</Text>
              <Text style={styles.tip}>
                Al abrir ese enlace, la app mandará el contenido a <Text style={{ fontWeight: '800' }}>/ai/save-transaction</Text>.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Configurar patrones</Text>

              <View style={{ gap: 8, marginTop: 8 }}>
                <TextInput
                  placeholder="Remitente (p.ej. FICO, Banpais)..."
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                  value={newSender}
                  onChangeText={setNewSender}
                />
                <TextInput
                  placeholder="Regex del mensaje (p.ej. HNL\\s*([0-9,.]+))"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                  value={newRegex}
                  onChangeText={setNewRegex}
                />
                <Pressable onPress={addPattern} style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>Agregar patrón</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Probar detección</Text>
              <TextInput
                placeholder="Remitente (opcional)"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={sender}
                onChangeText={setSender}
              />
              <TextInput
                placeholder="Pega aquí el SMS del banco"
                placeholderTextColor="#6b7280"
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                value={body}
                onChangeText={setBody}
                multiline
              />

              <Text style={styles.tip}>Patrones coincidentes: {matches.length}</Text>

              <Pressable onPress={onSend} style={[styles.btnPrimary, { marginTop: 8 }]}>
                <Text style={styles.btnPrimaryText}>Enviar a /ai/save-transaction</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cómo conectarlo</Text>
              <Text style={styles.subtitle}>iOS (Atajos)</Text>
              <Text style={styles.tip}>
                1) Crea un Atajo que reciba el contenido del SMS.{'\n'}
                2) Usa “Abrir URL” con: <Text style={styles.codeInline}>walletlyai://ingest?text=[Contenido]</Text>{'\n'}
                3) Alternativa: HTTP POST directo a tu backend (POST /ai/save-transaction).
              </Text>

              <Text style={[styles.subtitle, { marginTop: 8 }]}>Android (Tasker/MacroDroid)</Text>
              <Text style={styles.tip}>
                1) Regla que detecte la notificación/SMS del banco.{'\n'}
                2) Acción “Abrir URL”: <Text style={styles.codeInline}>walletlyai://ingest?text=%sms_body%</Text>{'\n'}
                3) Alternativa: HTTP POST directo al backend.
              </Text>

              <Text style={[styles.tip, { marginTop: 6 }]}>
                ⚠️ La lectura directa de SMS/notificaciones no funciona en Expo Go. Para hacerlo dentro de la app necesitarás un build nativo con EAS y permisos.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Patrones guardados</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.patternItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.patternTitle}>{item.sender || '(cualquier remitente)'}</Text>
              <Text style={styles.patternRegex}>{item.messageRegex || '(sin regex)'}</Text>
            </View>
            <Switch value={item.enabled} onValueChange={() => togglePattern(item.id)} />
            <Pressable onPress={() => removePattern(item.id)} style={styles.deleteBtn}>
              <Text style={{ color: '#fff' }}>Borrar</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#94a3b8', paddingHorizontal: 16 }}>
            Aún no hay patrones.
          </Text>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { color: 'white', fontSize: 18, fontWeight: '900' },
  sectionTitle: { color: 'white', fontWeight: '800', fontSize: 16, marginTop: 8 },

  card: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 12, padding: 12, gap: 8,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: '800' },
  subtitle: { color: '#cbd5e1', fontWeight: '800' },
  tip: { color: '#94a3b8' },
  code: { color: '#93c5fd', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
  codeInline: { color: '#93c5fd', fontWeight: '800' },

  input: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 10, color: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 10,
  },
  btnPrimary: { backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: 'white', fontWeight: '800' },

  patternItem: {
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 10, padding: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  patternTitle: { color: 'white', fontWeight: '800' },
  patternRegex: { color: '#94a3b8', fontSize: 12 },
  deleteBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});
