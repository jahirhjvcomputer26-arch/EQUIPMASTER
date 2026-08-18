import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

function NavigationGuard() {
  const { isAuthenticated, serverConfigured, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inSetup = segments[0] === 'setup';

    if (!serverConfigured && !inSetup) {
      router.replace('/setup');
    } else if (serverConfigured && !isAuthenticated && !inAuthGroup && !inSetup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuthGroup || inSetup)) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, serverConfigured, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="setup" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="equipo/[codigo]" />
      </Stack>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
});
