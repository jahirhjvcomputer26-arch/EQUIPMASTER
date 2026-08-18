import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function EscanearScreen() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');

  const handleBuscar = () => {
    if (codigo.trim()) {
      router.push(`/equipo/${codigo.trim().toUpperCase()}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="qr-code-scanner" size={64} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Buscar Equipo</Text>
      <Text style={styles.subtitle}>Ingresa el código del equipo para ver su ficha técnica.</Text>
      <View style={styles.inputContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.input}
          value={codigo}
          onChangeText={setCodigo}
          placeholder="INV-001, INV-002..."
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
          autoFocus
          onSubmitEditing={handleBuscar}
          returnKeyType="search"
        />
      </View>
      <TouchableOpacity
        style={[styles.button, !codigo.trim() && styles.buttonDisabled]}
        onPress={handleBuscar}
        disabled={!codigo.trim()}
      >
        <MaterialIcons name="search" size={20} color={COLORS.white} />
        <Text style={styles.buttonText}>Buscar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(tabs)/inventario')}>
        <Text style={styles.linkText}>O busca en la lista de inventario</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.xl, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm, width: '100%', marginBottom: SPACING.lg },
  input: { flex: 1, fontSize: 18, color: COLORS.text, padding: 0, fontFamily: 'monospace' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, gap: SPACING.sm, width: '100%' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  linkButton: { marginTop: SPACING.lg },
  linkText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
