// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

type Nav = ReturnType<typeof useNavigation>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();

  const onGoDetection = () => navigation.navigate('Detection' as never);
  const onGoCategories = () => navigation.navigate('CategoriesManage' as never);
  const onGoSettings = () => navigation.navigate('Settings' as never);

  const onLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={64} />
        <Text style={styles.title}>
          {user?.name || user?.email || 'Mi perfil'}
        </Text>
        {!!user?.email && <Text style={styles.subtitle}>{user.email}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>

        <Item
          icon="scan-outline"
          title="Detección (AI)"
          subtitle="Ingesta de texto/recibos con IA"
          onPress={onGoDetection}
        />

        <Item
          icon="pricetags-outline"
          title="Categorías"
          subtitle="Gestiona tus categorías"
          onPress={onGoCategories}
        />

        <Item
          icon="settings-outline"
          title="Ajustes"
          subtitle="Preferencias de la app"
          onPress={onGoSettings}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  header: { alignItems: 'center', gap: 4, marginTop: 8, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666' },

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

  footer: { marginTop: 'auto', alignItems: 'center' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#ffecec',
  },
  logoutText: { fontSize: 14, color: '#b00020', fontWeight: '600' },
});
