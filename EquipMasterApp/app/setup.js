import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const PRESETS = [
  { label: 'Principal', url: 'http://192.168.100.198:3001/api' },
  { label: 'Secundario', url: 'http://192.168.100.182:3001/api' },
];

export default function SetupScreen() {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { setServerUrl } = useAuth();

  useEffect(() => {
    loadSavedUrl();
  }, []);

  async function loadSavedUrl() {
    const saved = await AsyncStorage.getItem('api_url');
    if (saved) setUrl(saved);
  }

  async function handleSave() {
    if (!url.trim()) {
      Alert.alert('Error', 'Ingresa la URL del servidor');
      return;
    }
    setSaving(true);
    try {
      await setServerUrl(url.trim());
      router.replace('/(auth)/login');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la configuracion');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="dns" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>EquipMaster</Text>
          <Text style={styles.subtitle}>Configura la conexion al servidor</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>URL del Servidor API</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.100.198:3001/api"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.sectionTitle}>Conexiones rapidas</Text>
          {PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.url}
              style={[styles.presetBtn, url === preset.url && styles.presetActive]}
              onPress={() => setUrl(preset.url)}
            >
              <MaterialIcons
                name={url === preset.url ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={18}
                color={url === preset.url ? COLORS.primary : COLORS.muted}
              />
              <View style={styles.presetInfo}>
                <Text style={[styles.presetLabel, url === preset.url && styles.presetLabelActive]}>
                  {preset.label}
                </Text>
                <Text style={styles.presetUrl}>{preset.url}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
            <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Conectar'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  presetActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  presetInfo: {
    marginLeft: SPACING.md,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  presetLabelActive: {
    color: COLORS.primary,
  },
  presetUrl: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
