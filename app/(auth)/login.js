import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!usuario.trim() || !password.trim()) {
      Alert.alert('Error', 'Ingresa usuario y contrasena');
      return;
    }
    setLoading(true);
    try {
      await login(usuario.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      Alert.alert('Error de acceso', e.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <MaterialIcons name="computer" size={64} color={COLORS.primary} />
          <Text style={styles.title}>EquipMaster</Text>
          <Text style={styles.subtitle}>Inventario de Equipos</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor={COLORS.textSecondary}
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Contrasena"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <MaterialIcons name={showPass ? 'visibility' : 'visibility-off'} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name="login" size={20} color={COLORS.white} />
                <Text style={styles.loginBtnText}>Iniciar Sesion</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: {
    gap: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
