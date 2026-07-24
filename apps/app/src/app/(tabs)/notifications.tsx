import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Check, X, Users, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { usePendingInvites, useAcceptInvite, useDeclineInvite } from '@/lib/hooks';
import { cn } from '@/lib/utils';

function formatExpiry(expiresAt: string): string {
  const expires = new Date(expiresAt).getTime();
  const diff = expires - Date.now();
  if (diff <= 0) return 'expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `expires in ${days}d`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `expires in ${hours}h`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const { data: invites = [], isLoading } = usePendingInvites(token);
  const acceptMutation = useAcceptInvite(token);
  const declineMutation = useDeclineInvite(token);

  const handleAccept = async (invite: typeof invites[number]) => {
    try {
      await acceptMutation.mutateAsync(invite.token);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to accept invite');
    }
  };

  const handleDecline = async (invite: typeof invites[number]) => {
    try {
      await declineMutation.mutateAsync(invite.token);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to decline invite');
    }
  };

  const isProcessing = acceptMutation.isPending || declineMutation.isPending;

  return (
    <View style={cn('flex-1 bg-background')}>
      <View
        style={[
          cn('border-b border-border px-6 py-4 bg-card shadow-sm flex-row items-center gap-3'),
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => cn('p-1.5 rounded-md', pressed && 'bg-muted')}
        >
          <ArrowLeft size={22} strokeWidth={2.4} color="#000000" />
        </Pressable>
        <View style={cn('flex-1')}>
          <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
            Notifications
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          cn('px-6 py-6 gap-4'),
          { paddingBottom: insets.bottom + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={cn('items-center justify-center py-20')}>
            <ActivityIndicator color="#e35d1e" />
          </View>
        ) : invites.length === 0 ? (
          <View style={cn('items-center justify-center py-20 gap-3')}>
            <View style={cn('w-16 h-16 rounded-full bg-muted items-center justify-center')}>
              <Bell size={28} color="#686868" />
            </View>
            <Text style={cn('text-base font-sans font-semibold text-foreground')}>
              You&apos;re all caught up
            </Text>
            <Text style={cn('text-sm font-sans text-muted-foreground text-center')}>
              No pending invitations right now.
            </Text>
          </View>
        ) : (
          invites.map((invite) => (
            <View
              key={invite.id}
              style={cn('bg-card border border-border p-5 rounded-xl shadow-sm')}
            >
              <View style={cn('flex-row items-start gap-3')}>
                <View style={cn('w-10 h-10 rounded-full bg-primary/10 items-center justify-center')}>
                  <Users size={20} color="#e35d1e" />
                </View>
                <View style={cn('flex-1')}>
                  <Text style={cn('text-base font-sans font-bold text-foreground')}>
                    {invite.orgName}
                  </Text>
                  <Text style={cn('text-sm font-sans text-muted-foreground mt-0.5')}>
                    You&apos;ve been invited as{' '}
                    <Text style={cn('font-semibold text-foreground capitalize')}>
                      {invite.role.toLowerCase()}
                    </Text>
                  </Text>
                  <Text style={cn('text-3xs font-sans text-muted-foreground mt-1')}>
                    {formatExpiry(invite.expiresAt)}
                  </Text>
                </View>
              </View>

              <View style={cn('flex-row gap-3 mt-4')}>
                <Pressable
                  disabled={isProcessing}
                  onPress={() => handleAccept(invite)}
                  style={({ pressed }) =>
                    cn(
                      'flex-1 flex-row items-center justify-center gap-2 bg-primary px-4 py-2.5 rounded-md',
                      pressed && 'opacity-80',
                      isProcessing && 'opacity-50'
                    )
                  }
                >
                  <Check size={16} color="#ffffff" />
                  <Text style={cn('text-white font-sans font-bold text-sm')}>
                    Accept
                  </Text>
                </Pressable>
                <Pressable
                  disabled={isProcessing}
                  onPress={() => handleDecline(invite)}
                  style={({ pressed }) =>
                    cn(
                      'flex-1 flex-row items-center justify-center gap-2 bg-destructive/10 border border-destructive/20 px-4 py-2.5 rounded-md',
                      pressed && 'opacity-80',
                      isProcessing && 'opacity-50'
                    )
                  }
                >
                  <X size={16} color="#ef4444" />
                  <Text style={cn('text-destructive font-sans font-bold text-sm')}>
                    Decline
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
