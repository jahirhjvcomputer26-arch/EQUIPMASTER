import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useSegments, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading } = useAuth();

  const checkApiConfig = useCallback(async () => {
    try {
      const url = await AsyncStorage.getItem('equipmaster_api_url');
      return !!url;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    async function run() {
      const apiConfigured = await checkApiConfig();
      if (cancelled) return;

      const inAuthGroup = segments[0] === '(auth)';
      const isSetup = segments[0] === 'setup';

      if (!apiConfigured && !isSetup) {
        router.replace('/setup');
        return;
      }

      if (apiConfigured && !user && !inAuthGroup && !isSetup) {
        router.replace('/(auth)/login');
        return;
      }

      if (user && inAuthGroup) {
        router.replace('/(tabs)/dashboard');
        return;
      }
    }

    run();

    return () => { cancelled = true; };
  }, [user, loading, segments, checkApiConfig]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
