import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, ESTADO_COLORS, ESTADO_EMOJI } from '../../constants/theme';

function getEstadoColor(estado) {
  if (!estado) return COLORS.muted;
  const key = Object.keys(ESTADO_COLORS).find((k) => k.toLowerCase() === estado.toLowerCase());
  return key ? ESTADO_COLORS[key] : COLORS.muted;
}

function getEstadoEmoji(estado) {
  if (!estado) return '';
  const key = Object.keys(ESTADO_EMOJI).find((k) => k.toLowerCase() === estado.toLowerCase());
  return key ? ESTADO_EMOJI[key] : '';
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

export default function EquipoDetailScreen() {
  const { codigo } = useLocalSearchParams();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchEquipo = async () => {
    try {
      setError(null);
      const res = await api.getEquipo(codigo);
      setEquipo(res.data || res.equipo || res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEquipo();
  }, [codigo]);

  function onRefresh() {
    setRefreshing(true);
    fetchEquipo();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchEquipo}>
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const estadoColor = getEstadoColor(equipo?.estado);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Ficha del Equipo</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.estadoCard}>
        <View style={[styles.estadoDot, { backgroundColor: estadoColor }]} />
        <Text style={styles.estadoEmoji}>{getEstadoEmoji(equipo?.estado)}</Text>
        <Text style={[styles.estadoText, { color: estadoColor }]}>{equipo?.estado || 'Sin estado'}</Text>
      </View>

      <Text style={styles.codigo}>{equipo?.codigo || codigo}</Text>
      <Text style={styles.nombre}>{equipo?.nombre || equipo?.descripcion || 'Sin nombre'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informacion General</Text>
        <InfoRow icon="category" label="Tipo" value={equipo?.tipo} />
        <InfoRow icon="devices" label="Marca" value={equipo?.marca} />
        <InfoRow icon="developer-board" label="Modelo" value={equipo?.modelo} />
        <InfoRow icon="memory" label="Serie" value={equipo?.serie || equipo?.numero_serie} />
        <InfoRow icon="tag" label="Etiqueta" value={equipo?.etiqueta || equipo?.asset_tag} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Especificaciones</Text>
        <InfoRow icon="speed" label="Procesador" value={equipo?.procesador || equipo?.cpu} />
        <InfoRow icon="storage" label="RAM" value={equipo?.ram} />
        <InfoRow icon="disc" label="Almacenamiento" value={equipo?.almacenamiento || equipo?.disco} />
        <InfoRow icon="monitor" label="Pantalla" value={equipo?.pantalla || equipo?.monitor} />
        <InfoRow icon="keyboard" label="Teclado" value={equipo?.teclado} />
        <InfoRow icon="mouse" label="Mouse" value={equipo?.mouse} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ubicacion y Asignacion</Text>
        <InfoRow icon="location-on" label="Sede" value={equipo?.sede} />
        <InfoRow icon="business" label="Departamento" value={equipo?.departamento || equipo?.area} />
        <InfoRow icon="person" label="Responsable" value={equipo?.responsable || equipo?.asignado_a} />
        <InfoRow icon="calendar-today" label="Fecha ingreso" value={equipo?.fecha_ingreso || equipo?.createdAt} />
      </View>

      {(equipo?.observaciones || equipo?.notas) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Observaciones</Text>
          <Text style={styles.observations}>{equipo?.observaciones || equipo?.notas}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: SPACING.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxxl + 20,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  estadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  estadoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  estadoEmoji: {
    fontSize: 18,
  },
  estadoText: {
    fontSize: 16,
    fontWeight: '700',
  },
  codigo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    marginBottom: 2,
  },
  nombre: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  observations: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
