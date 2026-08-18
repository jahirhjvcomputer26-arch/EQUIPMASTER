import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING } from '../../constants/theme';
import SearchBar from '../../components/SearchBar';
import EquipoCard from '../../components/EquipoCard';
import * as api from '../../services/api';

export default function InventarioScreen() {
  const router = useRouter();
  const [equipos, setEquipos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const data = await api.getInventario();
      setEquipos(data.equipos || data.data || data || []);
    } catch {}
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const filtered = equipos.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.codigo && e.codigo.toLowerCase().includes(q)) ||
      (e.marca && e.marca.toLowerCase().includes(q)) ||
      (e.modelo && e.modelo.toLowerCase().includes(q)) ||
      (e.serie && e.serie.toLowerCase().includes(q)) ||
      (e.tecnico && e.tecnico.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por codigo, marca, modelo..." />
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => item.codigo || item._id || String(i)}
        renderItem={({ item }) => (
          <EquipoCard
            equipo={item}
            onPress={() => router.push(`/equipo/${item.codigo}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No se encontraron equipos</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  list: {
    paddingBottom: SPACING.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
