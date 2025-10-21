// src/screens/SettingsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Switch, Modal, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreferencesService, type CurrencyCode, type UserPreferences } from '../services/preferences';
import { getExpoPushToken } from '../utils/notifications';
import { ENV } from '../config/env';

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'HNL', label: 'Lempira (HNL)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'MXN', label: 'Peso Mexicano (MXN)' },
  { code: 'CRC', label: 'Colón (CRC)' },
  { code: 'ARS', label: 'Peso Argentino (ARS)' },
  { code: 'CLP', label: 'Peso Chileno (CLP)' },
  { code: 'COP', label: 'Peso Colombiano (COP)' },
  { code: 'PEN', label: 'Sol Peruano (PEN)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'BRL', label: 'Real (BRL)' },
];

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const projectId = ENV.EXPO_PROJECT_ID; // asegúrate de tenerlo en env/app.json

  useEffect(() => {
    (async () => {
      try {
        const p = await PreferencesService.getMyPreferences();
        setPrefs(p);
      } catch (e: any) {
        console.warn('getMyPreferences error', e?.response?.data || e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentCurrency = useMemo(
    () => CURRENCIES.find(c => c.code === prefs?.currency)?.label || 'Seleccionar…',
    [prefs?.currency]
  );

  const toggleNotifications = async (next: boolean) => {
    try {
      const updated = await PreferencesService.updateMyPreferences({ notificationsEnabled: next });
      setPrefs(updated);

      if (next) {
        const token = await getExpoPushToken(projectId);
        if (token) {
          await PreferencesService.registerPushToken(token);
        } else {
          Alert.alert(
            'Permiso requerido',
            'No fue posible obtener el token de notificaciones. Revisa los permisos del sistema.'
          );
          const reverted = await PreferencesService.updateMyPreferences({ notificationsEnabled: false });
          setPrefs(reverted);
        }
      } else {
        // Opcional: también podrías borrar tokens en backend si guardas el token local.
      }
    } catch (e: any) {
      console.warn('toggleNotifications error', e?.response?.data || e?.message);
      Alert.alert('Error', 'No se pudieron actualizar las notificaciones.');
    }
  };

  const onPickCurrency = async (code: CurrencyCode) => {
    try {
      const updated = await PreferencesService.updateMyPreferences({ currency: code });
      setPrefs(updated);
      setCurrencyOpen(false);
    } catch (e: any) {
      console.warn('update currency error', e?.response?.data || e?.message);
      Alert.alert('Error', 'No se pudo actualizar la moneda.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Configuraciones</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>

        <Item
          icon="cash-outline"
          title="Moneda"
          subtitle={loading ? 'Cargando…' : currentCurrency}
          onPress={() => setCurrencyOpen(true)}
        />

        <RowSwitch
          icon="notifications-outline"
          title="Notificaciones"
          value={!!prefs?.notificationsEnabled}
          disabled={loading}
          onValueChange={toggleNotifications}
        />
      </View>

      {/* Modal selector de moneda */}
      <Modal visible={currencyOpen} transparent animationType="slide" onRequestClose={() => setCurrencyOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona tu moneda</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => onPickCurrency(item.code)}>
                  <Text style={styles.itemTitle}>{item.label}</Text>
                  {prefs?.currency === item.code && <Ionicons name="checkmark" size={18} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
            <TouchableOpacity style={[styles.btnGhost, { alignSelf: 'flex-end', marginTop: 12 }]} onPress={() => setCurrencyOpen(false)}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Item({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={22} />
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.itemSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} />
    </TouchableOpacity>
  );
}

function RowSwitch({
  icon,
  title,
  value,
  onValueChange,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.item}>
      <Ionicons name={icon} size={22} />
      <Text style={[styles.itemTitle, { flex: 1 }]}>{title}</Text>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700' },

  section: { gap: 8, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemSub: { fontSize: 12, color: '#777' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f7f7f7',
  },

  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
});
