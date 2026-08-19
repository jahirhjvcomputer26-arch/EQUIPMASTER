import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

let CameraView = null;
let useCameraPermissions = null;

try {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch (e) {
  CameraView = null;
  useCameraPermissions = null;
}

export default function EscanearScreen() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [scanned, setScanned] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(!!CameraView);

  let permission = null;
  let requestPermission = null;

  if (useCameraPermissions) {
    [permission, requestPermission] = useCameraPermissions();
  }

  const navigateToEquipo = (code) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/equipo/${trimmed}`);
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned || !data || !data.trim()) return;
    setScanned(true);
    try {
      navigateToEquipo(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir el equipo escaneado');
      setScanned(false);
    }
  };

  const handleManualSearch = () => {
    if (codigo.trim()) {
      navigateToEquipo(codigo);
    }
  };

  if (cameraAvailable && permission && !permission.granted) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="camera-alt" size={64} color={COLORS.primary} />
        <Text style={styles.infoText}>Se necesita acceso a la camara</Text>
        <Text style={styles.subText}>Para escanear codigos QR y de barras</Text>
        {requestPermission && (
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Conceder Permiso</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.permissionBtn, { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }]} onPress={() => setCameraAvailable(false)}>
          <Text style={[styles.permissionBtnText, { color: COLORS.text }]}>Usar busqueda manual</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cameraAvailable && permission && permission.granted) {
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Text style={styles.topBarText}>Escanea el codigo del equipo</Text>
          </View>
          <View style={styles.scanAreaContainer}>
            <View style={styles.scanArea} />
          </View>
          <View style={styles.bottomBar}>
            {scanned ? (
              <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                <MaterialIcons name="refresh" size={20} color={COLORS.white} />
                <Text style={styles.rescanBtnText}>Escanear de nuevo</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.hint}>Apunta al codigo QR o de barras</Text>
            )}
            <TouchableOpacity style={styles.manualBtn} onPress={() => setCameraAvailable(false)}>
              <MaterialIcons name="keyboard" size={20} color={COLORS.primary} />
              <Text style={styles.manualBtnText}>Ingreso manual</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fallbackContainer}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="qr-code-scanner" size={64} color={COLORS.primary} />
      </View>
      <Text style={styles.infoText}>Buscar Equipo</Text>
      <Text style={styles.subText}>Ingresa el codigo del equipo para ver su ficha tecnica.</Text>
      <View style={styles.inputContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textMuted || COLORS.textSecondary} />
        <TextInput
          style={styles.input}
          value={codigo}
          onChangeText={setCodigo}
          placeholder="INV-001, INV-002..."
          placeholderTextColor={COLORS.textMuted || COLORS.textSecondary}
          autoCapitalize="characters"
          autoFocus
          onSubmitEditing={handleManualSearch}
          returnKeyType="search"
        />
      </View>
      <TouchableOpacity
        style={[styles.searchBtn, !codigo.trim() && styles.searchBtnDisabled]}
        onPress={handleManualSearch}
        disabled={!codigo.trim()}
      >
        <MaterialIcons name="search" size={20} color={COLORS.white} />
        <Text style={styles.searchBtnText}>Buscar</Text>
      </TouchableOpacity>
      {cameraAvailable !== false && (
        <TouchableOpacity style={styles.manualBtn} onPress={() => setCameraAvailable(true)}>
          <MaterialIcons name="camera-alt" size={20} color={COLORS.primary} />
          <Text style={styles.manualBtnText}>Intentar con camara</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, padding: SPACING.xl, gap: SPACING.md },
  infoText: { fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  permissionBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, paddingHorizontal: 24, marginTop: SPACING.md },
  permissionBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: SPACING.lg, alignItems: 'center', paddingTop: 50 },
  topBarText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  scanAreaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, backgroundColor: 'transparent' },
  bottomBar: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: SPACING.xl, alignItems: 'center', gap: SPACING.md, paddingBottom: 30 },
  hint: { color: '#ccc', fontSize: 14 },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 12, paddingHorizontal: 20 },
  rescanBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  manualBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  manualBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  fallbackContainer: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.xl, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm, width: '100%', marginBottom: SPACING.lg },
  input: { flex: 1, fontSize: 18, color: COLORS.text, padding: 0, fontFamily: 'monospace' },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, gap: SPACING.sm, width: '100%' },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
