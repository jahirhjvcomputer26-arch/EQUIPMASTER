import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import EquipoCard from '../../components/EquipoCard';
import SearchBar from '../../components/SearchBar';
import { COLORS, SPACING } from '../../constants/theme';

export default function InventarioScreen() {
  const [equipos, setEquipos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getInventario();
      const items = res.data || res.equipos || res || [];
      setEquipos(Array.isArray(items) ? items : []);
      setFiltered(Array.isArray(items) ? items : []);
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

  function handleSearch(text) {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(equipos);
      return;
    }
    const q = text.toLowerCase();
    const result = equipos.filter(
      (e) =>
        (e.codigo && e.codigo.toLowerCase().includes(q)) ||
        (e.nombre && e.nombre.toLowerCase().includes(q)) ||
        (e.descripcion && e.descripcion.toLowerCase().includes(q)) ||
        (e.modelo && e.modelo.toLowerCase().includes(q)) ||
        (e.tipo && e.tipo.toLowerCase().includes(q))
    );
    setFiltered(result);
  }

  function handlePress(equipo) {
    router.push(`/equipo/${encodeURIComponent(equipo.codigo)}`);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
        <Text style={styles.count}>{filtered.length} equipos</Text>
      </View>

      <SearchBar value={search} onChangeText={handleSearch} placeholder="Buscar por codigo, nombre, modelo..." />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchData}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item, index) => item.codigo || item.id?.toString() || index.toString()}
        renderItem={({ item }) => <EquipoCard equipo={item} onPress={handlePress} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  count: {
    fontSize: 13,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  list: {
    paddingBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.danger + '12',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 10,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
