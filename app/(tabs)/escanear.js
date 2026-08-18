import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function EscanearScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    router.push(`/equipo/${data.toUpperCase()}`);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="hourglass-empty" size={48} color={COLORS.primary} />
        <Text style={styles.infoText}>Cargando permisos...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="camera-alt" size={64} color={COLORS.primary} />
        <Text style={styles.infoText}>Se necesita acceso a la camara</Text>
        <Text style={styles.subText}>Para escanear codigos QR y de barras</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <TouchableOpacity style={styles.manualBtn} onPress={() => setScanned(true)}>
            <MaterialIcons name="keyboard" size={20} color={COLORS.primary} />
            <Text style={styles.manualBtnText}>Ingreso manual</Text>
          </TouchableOpacity>
        </View>
      </View>
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
});
