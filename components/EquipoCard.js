import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const ESTADO_COLORS = {
  'Disponible': COLORS.success,
  'En uso': COLORS.primary,
  'Vendido': COLORS.warning,
  'En reparacion': COLORS.danger,
  'Dañado': COLORS.danger,
  'Retirado': '#6B7280',
};

const ESTADO_EMOJIS = {
  'Disponible': '🟢',
  'En uso': '🔵',
  'Vendido': '🟠',
  'En reparacion': '🟡',
  'Dañado': '🔴',
  'Retirado': '⚫',
};

export default function EquipoCard({ equipo, onPress }) {
  const estadoColor = ESTADO_COLORS[equipo.estado] || COLORS.textSecondary;
  const emoji = ESTADO_EMOJIS[equipo.estado] || '⚪';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.statusBar, { backgroundColor: estadoColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.codigo}>{equipo.codigo}</Text>
          <Text style={styles.estado}>{emoji} {equipo.estado}</Text>
        </View>
        <Text style={styles.marca}>{equipo.marca} {equipo.modelo}</Text>
        <View style={styles.specs}>
          {equipo.procesador ? (
            <Text style={styles.spec}>
              <MaterialIcons name="memory" size={12} /> {equipo.procesador}
            </Text>
          ) : null}
          {equipo.ram ? (
            <Text style={styles.spec}>
              <MaterialIcons name="developer-board" size={12} /> {equipo.ram} RAM
            </Text>
          ) : null}
          {equipo.almacenamiento ? (
            <Text style={styles.spec}>
              <MaterialIcons name="storage" size={12} /> {equipo.almacenamiento}
            </Text>
          ) : null}
        </View>
        {equipo.serie ? (
          <Text style={styles.serie}>S/N: {equipo.serie}</Text>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  statusBar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  codigo: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  estado: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  marca: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  spec: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  serie: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
