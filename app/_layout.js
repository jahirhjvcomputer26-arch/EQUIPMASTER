import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useSegments, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [apiConfigured, setApiConfigured] = useState(null);

  useEffect(() => {
    checkApiConfig();
  }, []);

  async function checkApiConfig() {
    try {
      const url = await AsyncStorage.getItem('equipmaster_api_url');
      setApiConfigured(!!url);
    } catch {
      setApiConfigured(false);
    }
  }

  useEffect(() => {
    if (loading || apiConfigured === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
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
      router.replace('/(tabs)');
      return;
    }
  }, [user, loading, apiConfigured, segments]);

  if (loading || apiConfigured === null) {
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
