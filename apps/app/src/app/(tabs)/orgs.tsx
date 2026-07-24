import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from '@rn-primitives/portal';
import { Building2, ChevronRight, Plus, X, Users, Brain, Crown } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useOrgList, useCreateOrg, useCurrentSubscription } from '@/lib/hooks';
import { cn } from '@/lib/utils';

const SHEET_OFFSET = Dimensions.get('window').height;

export default function OrgsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const { data: orgs = [], isLoading } = useOrgList(token);
  const { data: subData } = useCurrentSubscription(token);
  const createOrgMutation = useCreateOrg(token);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [slideAnim] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onShow = (e: { endCoordinates: { height: number } }) =>
      setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: drawerOpen ? 0 : SHEET_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: drawerOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerOpen, slideAnim, backdropOpacity]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setName('');
    setCreateError(null);
  };

  const canCreateOrg = () => {
    if (!subData) return true;
    const max = subData.usage?.maxOrgs;
    if (max === -1) return true;
    return (subData.usage?.orgCount || 0) < max;
  };

  const handleCreate = async () => {
    setCreateError(null);
    if (!name.trim()) {
      setCreateError('Organization name is required.');
      return;
    }
    try {
      await createOrgMutation.mutateAsync({ name: name.trim() });
      closeDrawer();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Cannot connect to server. Please check if the backend is running.');
    }
  };

  return (
    <View style={cn('flex-1 bg-background')}>
      {/* Header */}
      <View
        style={[
          cn('border-b border-border px-6 py-4 bg-card shadow-sm flex-row justify-between items-center'),
          { paddingTop: insets.top + 8 },
        ]}
      >
        <View>
          <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
            Organizations
          </Text>
          <Text style={cn('text-2xs font-sans text-primary font-semibold uppercase tracking-wider')}>
            Your Minds
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (canCreateOrg()) {
              setDrawerOpen(true);
            } else {
              setShowUpgradePrompt(true);
            }
          }}
          style={({ pressed }) =>
            cn(
              'w-10 h-10 rounded-full bg-primary/10 items-center justify-center',
              pressed && 'bg-primary/20'
            )
          }
          accessibilityRole="button"
        >
          <Plus size={22} strokeWidth={2.4} color="#e35d1e" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          cn('px-6 py-6 gap-4'),
          { paddingBottom: insets.bottom + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={cn('py-20 items-center')}>
            <ActivityIndicator size="small" color="#e35d1e" />
          </View>
        ) : orgs.length === 0 ? (
          <View style={cn('bg-card border border-border p-8 rounded-xl items-center justify-center border-dashed border-2')}>
            <Text style={cn('text-base font-sans font-semibold text-muted-foreground text-center mb-1')}>
              No organizations yet
            </Text>
            <Text style={cn('text-xs font-sans text-muted-foreground/80 text-center mb-4')}>
              Create one to start organizing your minds and team.
            </Text>
            <Pressable
              onPress={() => {
                if (canCreateOrg()) {
                  setDrawerOpen(true);
                } else {
                  setShowUpgradePrompt(true);
                }
              }}
              style={({ pressed }) =>
                cn('bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-md flex-row items-center gap-2', pressed && 'bg-primary/20')
              }
            >
              <Plus size={14} strokeWidth={2.5} color="#e35d1e" />
              <Text style={cn('text-primary font-sans font-bold text-sm')}>
                Create Organization
              </Text>
            </Pressable>
          </View>
        ) : (
          orgs.map((org) => {
            const isOwner = org.ownerId === user?.id;
            return (
              <View
                key={org.id}
                style={cn('bg-card border border-border rounded-xl p-5 shadow-sm')}
              >
                <Pressable
                  onPress={() => router.push(`/orgs/${org.id}`)}
                  style={({ pressed }) =>
                    cn('flex-row items-center gap-4', pressed && 'opacity-70')
                  }
                >
                  <View
                    style={[
                      cn('w-12 h-12 rounded-xl items-center justify-center'),
                      { backgroundColor: '#e35d1e1a' },
                    ]}
                  >
                    <Building2 size={24} strokeWidth={2} color="#e35d1e" />
                  </View>
                  <View style={cn('flex-1')}>
                    <View style={cn('flex-row items-center gap-2')}>
                      <Text style={cn('text-base font-sans font-bold text-foreground tracking-tight')}>
                        {org.name}
                      </Text>
                      <View
                        style={cn(
                          'px-2 py-0.5 rounded-full',
                          isOwner ? 'bg-primary/10' : 'bg-muted'
                        )}
                      >
                        <Text
                          style={cn(
                            'text-3xs font-sans font-semibold uppercase tracking-wider',
                            isOwner ? 'text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {isOwner ? 'Owner' : 'Member'}
                        </Text>
                      </View>
                    </View>
                    <View style={cn('flex-row items-center gap-3 mt-2')}>
                      <View style={cn('flex-row items-center gap-1 text-3xs font-sans text-muted-foreground')}>
                        <Users size={10} strokeWidth={2} />
                        <Text>{org.memberCount} members</Text>
                      </View>
                      <View style={cn('flex-row items-center gap-1 text-3xs font-sans text-muted-foreground')}>
                        <Brain size={10} strokeWidth={2} />
                        <Text>{org.mindCount} minds</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} strokeWidth={2} color="#9ca3af" />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Organization Drawer */}
      <Portal name="create-org">
        <View style={[cn('absolute inset-0'), { pointerEvents: drawerOpen ? 'auto' : 'none' }]}>
          <Animated.View style={[cn('absolute inset-0 bg-black/40'), { opacity: backdropOpacity }]}>
            <Pressable style={cn('flex-1')} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View
            style={[
              cn('absolute left-0 right-0 bottom-0 bg-card border-t border-border p-6 shadow-2xl'),
              {
                transform: [{ translateY: slideAnim }],
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
              },
            ]}
          >
            <View style={cn('flex-row justify-between items-center mb-6')}>
              <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
                New Organization
              </Text>
              <Pressable
                onPress={closeDrawer}
                style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-muted')}
              >
                <X size={20} strokeWidth={2.4} color="#686868" />
              </Pressable>
            </View>

            <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2')}>
              Organization name
            </Text>
            <TextInput
              style={cn(
                'w-full bg-muted border border-border font-sans text-foreground px-4 py-3.5 rounded-md text-base'
              )}
              placeholder="e.g. Engineering Mind"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              onSubmitEditing={handleCreate}
            />
            {createError && (
              <Text style={cn('text-destructive font-sans text-sm mt-2')}>
                {createError}
              </Text>
            )}

            <View style={[cn('mt-6'), { marginBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
              <Pressable
                onPress={handleCreate}
                disabled={createOrgMutation.isPending}
                style={({ pressed }) =>
                  cn(
                    'w-full bg-primary py-4 rounded-md items-center justify-center shadow-lg shadow-primary/20',
                    (pressed || createOrgMutation.isPending) && 'opacity-90'
                  )
                }
              >
                {createOrgMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={cn('text-primary-foreground font-sans font-semibold text-base')}>
                    Create Organization
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Portal>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <Portal name="upgrade-prompt">
          <View style={[cn('absolute inset-0'), { pointerEvents: showUpgradePrompt ? 'auto' : 'none' }]}>
            <View style={cn('absolute inset-0 bg-black/40')} />
            <View
              style={[
                cn('absolute left-0 right-0 bottom-0 bg-card border-t border-border p-6 shadow-2xl'),
                { borderTopLeftRadius: 40, borderTopRightRadius: 40 },
              ]}
            >
              <View style={cn('items-center mb-6')}>
                <View style={cn('w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4')}>
                  <Crown size={28} strokeWidth={2} color="#e35d1e" />
                </View>
                <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight text-center')}>
                  Upgrade Your Plan
                </Text>
                <Text style={cn('text-sm font-sans text-muted-foreground text-center mt-2')}>
                  You've reached the limit of your {subData?.plan?.name || 'Free'} plan. Upgrade to create more organizations.
                </Text>
              </View>
              <View style={cn('gap-3')}>
                <Pressable
                  onPress={() => {
                    setShowUpgradePrompt(false);
                    router.push('/subscription');
                  }}
                  style={({ pressed }) =>
                    cn(
                      'w-full bg-primary py-4 rounded-md items-center justify-center',
                      pressed && 'opacity-90'
                    )
                  }
                >
                  <Text style={cn('text-primary-foreground font-sans font-semibold text-base')}>
                    View Plans
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowUpgradePrompt(false)}
                  style={({ pressed }) =>
                    cn(
                      'w-full bg-muted py-4 rounded-md items-center justify-center',
                      pressed && 'opacity-90'
                    )
                  }
                >
                  <Text style={cn('text-foreground font-sans font-semibold text-base')}>
                    Maybe Later
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Portal>
      )}
    </View>
  );
}
