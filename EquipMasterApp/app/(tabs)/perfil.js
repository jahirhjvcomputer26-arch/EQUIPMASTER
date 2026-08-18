import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

export default function PerfilScreen() {
  const { user, logout, setServerUrl } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    Alert.alert('Cerrar Sesion', 'Estas seguro que deseas cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function handleChangeServer() {
    router.push('/setup');
  }

  const menuItems = [
    {
      icon: 'dns',
      label: 'Cambiar servidor',
      subtitle: 'Configurar URL de la API',
      onPress: handleChangeServer,
    },
    {
      icon: 'info-outline',
      label: 'Acerca de',
      subtitle: 'EquipMaster v1.0.0',
      onPress: () => Alert.alert('EquipMaster', 'Sistema de Inventario de Equipos\nVersion 1.0.0'),
    },
    {
      icon: 'logout',
      label: 'Cerrar Sesion',
      subtitle: 'Salir de la aplicacion',
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <MaterialIcons name="person" size={48} color={COLORS.white} />
        </View>
        <Text style={styles.name}>{user?.nombre || user?.usuario || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email || user?.correo || ''}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.rol || 'user'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <MaterialIcons name="person-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Usuario</Text>
          <Text style={styles.infoValue}>{user?.usuario || '-'}</Text>
        </View>
        {user?.sede && (
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>Sede</Text>
            <Text style={styles.infoValue}>{user.sede}</Text>
          </View>
        )}
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuBorder]}
            onPress={item.onPress}
          >
            <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
              <MaterialIcons name={item.icon} size={20} color={item.danger ? COLORS.danger : COLORS.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl + 20,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  menuCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIconDanger: {
    backgroundColor: COLORS.danger + '12',
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuLabelDanger: {
    color: COLORS.danger,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
