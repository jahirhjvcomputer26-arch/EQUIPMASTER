import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import * as api from '../../services/api';

const ESTADO_EMOJIS = {
  'Disponible': '🟢',
  'En uso': '🔵',
  'Vendido': '🟠',
  'En reparacion': '🟡',
  'Dañado': '🔴',
  'Retirado': '⚫',
};

const ESTADO_COLORS = {
  'Disponible': COLORS.success,
  'En uso': COLORS.primary,
  'Vendido': COLORS.warning,
  'En reparacion': COLORS.danger,
  'Dañado': COLORS.danger,
  'Retirado': '#6B7280',
};

const FIELDS = [
  { key: 'codigo', label: 'Codigo', icon: 'qr-code' },
  { key: 'marca', label: 'Marca', icon: 'business' },
  { key: 'modelo', label: 'Modelo', icon: 'devices' },
  { key: 'serie', label: 'No. Serie', icon: 'tag' },
  { key: 'procesador', label: 'Procesador', icon: 'memory' },
  { key: 'ram', label: 'RAM', icon: 'developer-board' },
  { key: 'almacenamiento', label: 'Almacenamiento', icon: 'storage' },
  { key: 'estado', label: 'Estado', icon: 'flag' },
  { key: 'tecnico', label: 'Tecnico Asignado', icon: 'person' },
  { key: 'area', label: 'Area', icon: 'apartment' },
  { key: 'ubicacion', label: 'Ubicacion', icon: 'location-on' },
  { key: 'fechaIngreso', label: 'Fecha de Ingreso', icon: 'calendar-today' },
  { key: 'observaciones', label: 'Observaciones', icon: 'notes' },
];

export default function EquipoDetailScreen() {
  const { codigo } = useLocalSearchParams();
  const router = useRouter();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEquipo();
  }, [codigo]);

  async function loadEquipo() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEquipo(codigo);
      setEquipo(data.equipo || data);
    } catch (e) {
      setError(e.message || 'Error al cargar equipo');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !equipo) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>{error || 'Equipo no encontrado'}</Text>
      </View>
    );
  }

  const estadoColor = ESTADO_COLORS[equipo.estado] || COLORS.textSecondary;
  const emoji = ESTADO_EMOJIS[equipo.estado] || '⚪';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusBanner, { backgroundColor: estadoColor }]}>
        <Text style={styles.statusText}>{emoji} {equipo.estado}</Text>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.codigo}>{equipo.codigo}</Text>
        <Text style={styles.marca}>{equipo.marca} {equipo.modelo}</Text>
      </View>

      <View style={styles.card}>
        {FIELDS.map((field, i) => {
          const value = equipo[field.key];
          if (!value && value !== 0) return null;

          let displayValue = value;
          if (field.key === 'fechaIngreso') {
            try {
              displayValue = new Date(value).toLocaleDateString('es-ES');
            } catch {
              displayValue = value;
            }
          }

          return (
            <React.Fragment key={field.key}>
              <View style={styles.fieldRow}>
                <MaterialIcons name={field.icon} size={18} color={COLORS.textSecondary} />
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={styles.fieldValue}>{String(displayValue)}</Text>
                </View>
              </View>
              {i < FIELDS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
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
    paddingBottom: SPACING.xxl * 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: SPACING.md,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.danger,
    textAlign: 'center',
  },
  statusBanner: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  titleSection: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  codigo: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  marca: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
