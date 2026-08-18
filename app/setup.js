import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { setApiUrl } from '../services/api';

const PRESETS = [
  { label: 'Servidor Principal', url: 'http://192.168.100.182:3001/api' },
  { label: 'Servidor Secundario', url: 'http://192.168.100.198:3001/api' },
];

export default function SetupScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(PRESETS[0].url);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const url = custom.trim() || selected;
    if (!url) {
      Alert.alert('Error', 'Selecciona o ingresa una URL');
      return;
    }
    setSaving(true);
    try {
      await setApiUrl(url);
      await AsyncStorage.setItem('equipmaster_api_url', url);
      router.replace('/(auth)/login');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la configuracion');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="settings" size={48} color={COLORS.primary} />
        <Text style={styles.title}>Configurar Servidor</Text>
        <Text style={styles.subtitle}>Selecciona el servidor de EquipMaster</Text>
      </View>

      <View style={styles.presetsContainer}>
        {PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.url}
            style={[styles.presetCard, selected === preset.url && styles.presetActive]}
            onPress={() => { setSelected(preset.url); setCustom(''); }}
          >
            <MaterialIcons
              name={selected === preset.url ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={22}
              color={COLORS.primary}
            />
            <View style={styles.presetInfo}>
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <Text style={styles.presetUrl}>{preset.url}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
            <Text style={styles.saveBtnText}>Guardar y Continuar</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl * 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  presetsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl * 2,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  presetActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  presetInfo: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  presetUrl: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
