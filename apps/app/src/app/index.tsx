import { ActivityIndicator, Image, ImageBackground, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const splashBg = require('../../assets/images/splash-bg.png');
const appLogoImg = require('../../assets/images/icon.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, isLoading } = useAuth();

  if (isLoading || token) {
    return (
      <View style={cn('flex-1 bg-black justify-center items-center')}>
        <ActivityIndicator size="large" color="#e35d1e" />
      </View>
    );
  }

  return (
    <ImageBackground source={splashBg} style={cn('flex-1')} resizeMode="cover">
      <View style={cn('absolute inset-0 bg-black/25')} />
      <View style={cn('flex-1 justify-between')}>
        <View style={[cn('px-6 flex-row'), { paddingTop: insets.top + 16 }]} />
        <View
          style={[
            cn('bg-card border-t border-neutral-200/20 px-8 pt-4 pb-8 items-stretch shadow-2xl'),
            {
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
        >
          <View style={cn('items-start my-5')}>
            <Image source={appLogoImg} style={cn('w-16 h-16 rounded-md mb-3 shadow-md')} />
            <Text style={cn('text-3xl font-sans font-bold text-foreground tracking-tight')}>
              Gnosis
            </Text>
            <Text style={cn('text-sm font-sans text-muted-foreground font-medium uppercase tracking-wider mt-0.5')}>
              Knowledge Platform
            </Text>
          </View>

          <Text style={cn('text-base font-sans text-muted-foreground leading-6 mb-8 text-left')}>
            Gnosis is a full-stack knowledge management platform. Users organize knowledge into{' '}
            <Text style={cn('font-semibold text-primary')}>Minds</Text> (shared workspaces), upload multi-modal documents that are ingested, chunked, and vector-embedded, then query across them using a RAG pipeline powered by{' '}
            <Text style={cn('font-semibold text-primary')}>Google Gemini</Text>.
          </Text>

          <View style={cn('w-full gap-3')}>
            <Pressable
              style={({ pressed }) =>
                cn(
                  'w-full bg-primary py-4 rounded-md items-center justify-center',
                  pressed && 'opacity-90',
                )
              }
              accessibilityRole="button"
              onPress={() => router.push('/register' as never)}
            >
              <Text style={cn('text-primary-foreground font-sans font-semibold text-lg')}>
                Create Account
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) =>
                cn(
                  'w-full py-4 rounded-md items-center justify-center border border-neutral-200 bg-neutral-50/50',
                  pressed && 'bg-neutral-100/80',
                )
              }
              accessibilityRole="button"
              onPress={() => router.push('/login' as never)}
            >
              <Text style={cn('text-muted-foreground font-sans font-semibold text-lg')}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}
