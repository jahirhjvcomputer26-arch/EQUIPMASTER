import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, ESTADO_COLORS, ESTADO_EMOJI } from '../constants/theme';

function getEstadoColor(estado) {
  if (!estado) return COLORS.muted;
  const key = Object.keys(ESTADO_COLORS).find(
    (k) => k.toLowerCase() === estado.toLowerCase()
  );
  return key ? ESTADO_COLORS[key] : COLORS.muted;
}

function getEstadoEmoji(estado) {
  if (!estado) return '';
  const key = Object.keys(ESTADO_EMOJI).find(
    (k) => k.toLowerCase() === estado.toLowerCase()
  );
  return key ? ESTADO_EMOJI[key] : '';
}

export default function EquipoCard({ equipo, onPress }) {
  const estadoColor = getEstadoColor(equipo.estado);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(equipo)} activeOpacity={0.7}>
      <View style={[styles.estadoBar, { backgroundColor: estadoColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.codigo} numberOfLines={1}>{equipo.codigo}</Text>
          <View style={[styles.badge, { backgroundColor: estadoColor + '18' }]}>
            <Text style={[styles.badgeText, { color: estadoColor }]}>
              {getEstadoEmoji(equipo.estado)} {equipo.estado}
            </Text>
          </View>
        </View>
        <Text style={styles.nombre} numberOfLines={1}>{equipo.nombre || equipo.descripcion || 'Sin nombre'}</Text>
        <View style={styles.footer}>
          <Text style={styles.modelo} numberOfLines={1}>
            <MaterialIcons name="category" size={12} color={COLORS.textSecondary} />{' '}
            {equipo.modelo || equipo.tipo || '-'}
          </Text>
          {equipo.sede && (
            <Text style={styles.sede} numberOfLines={1}>
              <MaterialIcons name="location-on" size={12} color={COLORS.textSecondary} />{' '}
              {equipo.sede}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  estadoBar: {
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
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  nombre: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modelo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  sede: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
