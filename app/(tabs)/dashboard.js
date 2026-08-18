import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import StatCard from '../../components/StatCard';
import * as api from '../../services/api';

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, disponibles: 0, vendidos: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const data = await api.dashboard();
      setStats({
        total: data.total || data.equipos?.length || 0,
        disponibles: data.disponibles || data.stock || 0,
        vendidos: data.vendidos || 0,
      });
    } catch {}
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      <Text style={styles.greeting}>EquipMaster</Text>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statsRow}>
        <StatCard icon="inventory" label="Total Equipos" value={stats.total} color={COLORS.primary} />
        <StatCard icon="check-circle" label="En Stock" value={stats.disponibles} color={COLORS.success} />
        <StatCard icon="sell" label="Vendidos" value={stats.vendidos} color={COLORS.accent} />
      </View>

      <Text style={styles.sectionTitle}>Accesos Rapidos</Text>

      <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(tabs)/inventario')}>
        <MaterialIcons name="inventory" size={24} color={COLORS.primary} />
        <View style={styles.quickLinkInfo}>
          <Text style={styles.quickLinkTitle}>Ver Inventario</Text>
          <Text style={styles.quickLinkSub}>Explorar todos los equipos</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(tabs)/escanear')}>
        <MaterialIcons name="qr-code-scanner" size={24} color={COLORS.accent} />
        <View style={styles.quickLinkInfo}>
          <Text style={styles.quickLinkTitle}>Escanear QR</Text>
          <Text style={styles.quickLinkSub}>Buscar equipo por codigo</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(tabs)/perfil')}>
        <MaterialIcons name="person" size={24} color={COLORS.success} />
        <View style={styles.quickLinkInfo}>
          <Text style={styles.quickLinkTitle}>Mi Perfil</Text>
          <Text style={styles.quickLinkSub}>Configuracion y datos</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
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
    padding: SPACING.lg,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  quickLinkInfo: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickLinkSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
