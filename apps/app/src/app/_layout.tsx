import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans';
import { Lora_400Regular } from '@expo-google-fonts/lora';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  const [loaded] = useFonts({
    'Plus Jakarta Sans': PlusJakartaSans_400Regular,
    Lora: Lora_400Regular,
    'IBM Plex Mono': IBMPlexMono_400Regular,
  });

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
          <PortalHost />
        </View>
      </AuthProvider>
    </QueryClientProvider>
  );
}

