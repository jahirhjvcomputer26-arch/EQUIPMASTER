import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function EscanearScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  function handleBarCodeScanned({ data }) {
    if (scanned) return;
    setScanned(true);
    const codigo = data.trim();
    if (codigo) {
      router.push(`/equipo/${encodeURIComponent(codigo)}`);
    }
    setTimeout(() => setScanned(false), 2000);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Solicitando permisos de camara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="camera-alt" size={64} color={COLORS.textSecondary} />
        <Text style={styles.title}>Permiso de Camara</Text>
        <Text style={styles.text}>Se necesita acceso a la camara para escanear codigos QR</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Escanear QR</Text>
      </View>
      <View style={styles.scannerContainer}>
        <CameraView
          ref={scannerRef}
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.hint}>Apunta la camara hacia un codigo QR</Text>
        {scanned && (
          <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
            <MaterialIcons name="refresh" size={18} color={COLORS.primary} />
            <Text style={styles.rescanText}>Escanear de nuevo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  scannerContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 30,
    height: 30,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: COLORS.white,
  },
  cornerTopRight: {
    position: 'absolute',
    top: '30%',
    right: '20%',
    width: 30,
    height: 30,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: COLORS.white,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: '30%',
    left: '20%',
    width: 30,
    height: 30,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: COLORS.white,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: '30%',
    right: '20%',
    width: 30,
    height: 30,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: COLORS.white,
  },
  bottom: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
  },
  hint: {
    color: COLORS.white,
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  text: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  permissionBtnText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
  },
  rescanText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
