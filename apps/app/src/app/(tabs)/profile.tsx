import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, Mail, ShieldCheck, Bell, Users, Settings, CreditCard, Crown } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { cn } from '@/lib/utils';
import { useCurrentSubscription } from '@/lib/hooks';

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280',
  starter: '#e35d1e',
  pro: '#8b5cf6',
  enterprise: '#059669',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const { data: subData, isLoading: subLoading } = useCurrentSubscription(token);

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={cn('flex-1 bg-background')}>
      <View
        style={[
          cn('border-b border-border px-6 py-4 bg-card shadow-sm'),
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
          Profile
        </Text>
        <Text style={cn('text-2xs font-sans text-primary font-semibold uppercase tracking-wider')}>
          Account
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          cn('px-6 py-6 gap-6'),
          { paddingBottom: insets.bottom + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Card */}
        <View style={cn('flex-row items-center gap-4')}>
          <View style={cn('w-16 h-16 rounded-full bg-primary items-center justify-center')}>
            <Text style={cn('text-primary-foreground font-sans font-bold text-2xl')}>
              {(user?.displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={cn('flex-1')}>
            <Text style={cn('text-lg font-sans font-bold text-foreground tracking-tight')}>
              {user?.displayName || 'User'}
            </Text>
            <View style={cn('flex-row items-center gap-1.5 mt-1')}>
              <Mail size={14} strokeWidth={2} color="#686868" />
              <Text style={cn('text-xs font-sans text-muted-foreground')}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription Card */}
        <Pressable
          onPress={() => router.push('/subscription')}
          style={({ pressed }) => cn(
            'bg-card border border-border rounded-xl p-4 shadow-sm flex-row items-center gap-3',
            pressed && 'bg-muted'
          )}
        >
          <View
            style={cn('w-10 h-10 rounded-lg items-center justify-center')}
          >
            <Crown size={18} strokeWidth={2} color={PLAN_COLORS[subData?.plan?.code || 'free'] || '#6b7280'} />
          </View>
          <View style={cn('flex-1')}>
            <Text style={cn('text-sm font-sans font-semibold text-foreground')}>
              {subLoading ? 'Loading...' : subData?.plan?.name || 'Free'} Plan
            </Text>
            <Text style={cn('text-xs font-sans text-muted-foreground mt-0.5')}>
              {subData?.usage
                ? `${subData.usage.orgCount} of ${subData.usage.maxOrgs === -1 ? '∞' : subData.usage.maxOrgs} organizations`
                : '1 organization'}
            </Text>
          </View>
          <CreditCard size={16} strokeWidth={2} color="#9ca3af" />
        </Pressable>

        {/* Settings List */}
        <View style={cn('bg-card border border-border rounded-xl shadow-sm overflow-hidden')}>
          {[
            { icon: Users, label: 'Organizations', route: '/(tabs)/orgs' as const },
            { icon: Bell, label: 'Notifications', route: '/(tabs)/notifications' as const },
            { icon: ShieldCheck, label: 'Privacy & Security' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={idx}
                style={({ pressed }) =>
                  cn(
                    'flex-row items-center gap-3 px-5 py-4 bg-card',
                    idx !== 0 && 'border-t border-border',
                    pressed && 'bg-muted'
                  )
                }
                onPress={() => {
                  if ('route' in item) router.push(item.route as never);
                }}
              >
                <Icon size={18} strokeWidth={2} color="#686868" />
                <Text style={cn('flex-1 text-sm font-sans text-foreground font-medium')}>
                  {item.label}
                </Text>
                <Text style={cn('text-3xs font-sans text-muted-foreground')}>›</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Log Out */}
        <Pressable
          style={({ pressed }) =>
            cn(
              'bg-destructive/10 border border-destructive/20 px-5 py-4 rounded-md flex-row items-center justify-center gap-2',
              pressed && 'bg-destructive/20'
            )
          }
          onPress={handleLogout}
        >
          <LogOut size={18} strokeWidth={2} color="#d44c34" />
          <Text style={cn('text-destructive font-sans font-bold text-base')}>
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
