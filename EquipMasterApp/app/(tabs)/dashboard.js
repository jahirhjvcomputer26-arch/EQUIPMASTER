import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatCard from '../../components/StatCard';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await api.dashboard();
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchData();
  }

  const stats = data?.stats || data?.estadisticas || {};
  const total = stats.total || stats.totalEquipos || 0;
  const disponibles = stats.disponibles || stats.ok || 0;
  const enUso = stats.enUso || stats.prestados || 0;
  const mantenimiento = stats.mantenimiento || stats.reparacion || stats.revision || 0;
  const tickets = stats.tickets || stats.ticketsAbiertos || 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.nombre || user?.usuario || 'Usuario'}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={28} color={COLORS.white} />
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={18} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <StatCard icon="inventory" label="Total" value={total} color={COLORS.primary} />
        <StatCard icon="check-circle" label="Disponibles" value={disponibles} color={COLORS.success} />
      </View>
      <View style={styles.statsRow}>
        <StatCard icon="people" label="En Uso" value={enUso} color={COLORS.warning} />
        <StatCard icon="build" label="Mantenimiento" value={mantenimiento} color={COLORS.accent} />
      </View>
      <View style={styles.statsRow}>
        <StatCard icon="confirmation-number" label="Tickets" value={tickets} color={COLORS.danger} />
      </View>

      <Text style={styles.sectionTitle}>Accesos rapidos</Text>

      <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(tabs)/inventario')}>
        <View style={[styles.quickIcon, { backgroundColor: COLORS.primary + '15' }]}>
          <MaterialIcons name="inventory-2" size={22} color={COLORS.primary} />
        </View>
        <Text style={styles.quickLabel}>Ver Inventario</Text>
        <MaterialIcons name="chevron-right" size={22} color={COLORS.muted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(tabs)/escanear')}>
        <View style={[styles.quickIcon, { backgroundColor: COLORS.accent + '15' }]}>
          <MaterialIcons name="qr-code-scanner" size={22} color={COLORS.accent} />
        </View>
        <Text style={styles.quickLabel}>Escanear Equipo</Text>
        <MaterialIcons name="chevron-right" size={22} color={COLORS.muted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(tabs)/perfil')}>
        <View style={[styles.quickIcon, { backgroundColor: COLORS.success + '15' }]}>
          <MaterialIcons name="person" size={22} color={COLORS.success} />
        </View>
        <Text style={styles.quickLabel}>Mi Perfil</Text>
        <MaterialIcons name="chevron-right" size={22} color={COLORS.muted} />
      </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl + 20,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  date: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '12',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg - SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  quickLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});
