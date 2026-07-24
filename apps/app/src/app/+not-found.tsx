import React from 'react';
import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Home } from 'lucide-react-native';
import { cn } from '@/lib/utils';

export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(false);

  const handleGoBack = () => {
    setLoading(true);
    router.back();
    setTimeout(() => setLoading(false), 500);
  };

  const handleGoHome = () => {
    setLoading(true);
    router.replace('/(tabs)/home');
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <View style={cn('flex-1 bg-background items-center justify-center px-6')}>
      <View style={cn('items-center gap-6')}>
        <Text style={cn('text-6xl font-sans font-bold text-muted-foreground/20')}>
          404
        </Text>
        <Text style={cn('text-xl font-sans font-semibold text-foreground tracking-tight')}>
          Page Not Found
        </Text>
        <Text style={cn('text-sm font-sans text-muted-foreground text-center')}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#e35d1e" />
        ) : (
          <View style={cn('flex-row gap-4 mt-8')}>
            <Pressable
              onPress={handleGoBack}
              style={({ pressed }) =>
                cn(
                  'bg-card border border-border px-6 py-3.5 rounded-xl flex-row items-center gap-2 shadow-sm',
                  pressed && 'opacity-70'
                )
              }
            >
              <ArrowLeft size={18} strokeWidth={2} color="#000000" />
              <Text style={cn('text-sm font-sans font-semibold text-foreground')}>
                Go Back
              </Text>
            </Pressable>
            <Pressable
              onPress={handleGoHome}
              style={({ pressed }) =>
                cn(
                  'bg-primary px-6 py-3.5 rounded-xl flex-row items-center gap-2 shadow-lg shadow-primary/20',
                  pressed && 'opacity-90'
                )
              }
            >
              <Home size={18} strokeWidth={2} color="#ffffff" />
              <Text style={cn('text-primary-foreground font-sans font-semibold text-sm')}>
                Home
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}