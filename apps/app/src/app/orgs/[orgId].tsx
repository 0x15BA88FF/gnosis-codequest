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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from '@rn-primitives/portal';
import { ArrowLeft, Brain, Plus, Settings, X, Crown } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { useOrg, useOrgMinds, useCreateMind, useCurrentSubscription } from '@/lib/hooks';

const SHEET_OFFSET = Dimensions.get('window').height;

export default function OrgDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { orgId } = useLocalSearchParams<{ orgId: string }>();

  const { data: org, isLoading: orgLoading } = useOrg(token, orgId ?? null);
  const { data: minds = [], isLoading: mindsLoading } = useOrgMinds(token, orgId ?? null);
  const { data: subData } = useCurrentSubscription(token);
  const createMindMutation = useCreateMind(token, orgId ?? null);

  const [createOpen, setCreateOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [createSlideAnim] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [createBackdropOpacity] = useState(() => new Animated.Value(0));
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const loading = orgLoading || mindsLoading;
  const roleLabel = org?.role || 'Member';
  const canCreateMindRole = roleLabel === 'OWNER' || roleLabel === 'ADMIN';

  const canCreateMindLimit = () => {
    if (!subData || !orgId) return true;
    const max = subData.usage?.mindsPerOrg?.[orgId]?.max;
    if (max === undefined || max === -1) return true;
    const count = subData.usage?.mindsPerOrg?.[orgId]?.count || 0;
    return count < max;
  };

  const canCreateMind = canCreateMindRole && canCreateMindLimit();

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
      Animated.timing(createSlideAnim, {
        toValue: createOpen ? 0 : SHEET_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(createBackdropOpacity, {
        toValue: createOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [createOpen, createSlideAnim, createBackdropOpacity]);

  const openCreate = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateError(null);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateName('');
    setCreateDescription('');
    setCreateError(null);
  };

  const handleCreateMind = async () => {
    setCreateError(null);
    if (!createName.trim()) {
      setCreateError('Mind name is required.');
      return;
    }
    try {
      const created = await createMindMutation.mutateAsync({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
      });
      closeCreate();
      router.push(`/minds/${created.id}`);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create mind.');
    }
  };

  if (loading) {
    return (
      <View style={cn('flex-1 bg-background items-center justify-center')}>
        <ActivityIndicator size="large" color="#e35d1e" />
      </View>
    );
  }

  if (!org) {
    return (
      <View style={cn('flex-1 bg-background items-center justify-center px-6')}>
        <Text style={cn('text-center text-muted-foreground')}>
          Organization not found
        </Text>
      </View>
    );
  }

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
          <Text
            style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}
            numberOfLines={1}
          >
            {org.name}
          </Text>
          <Text style={cn('text-2xs font-sans text-primary font-semibold uppercase tracking-wider')}>
            Organization
          </Text>
        </View>
        {canCreateMindRole && (
          <Pressable
            onPress={() => {
              if (canCreateMindLimit()) {
                openCreate();
              } else {
                setShowUpgradePrompt(true);
              }
            }}
            style={({ pressed }) =>
              cn('p-2 rounded-md ml-1', pressed && 'bg-primary/10')
            }
            accessibilityRole="button"
          >
            <Plus size={20} strokeWidth={2.4} color="#e35d1e" />
          </Pressable>
        )}
        <Pressable
          onPress={() => router.push(`/orgs/${orgId}/settings`)}
          style={({ pressed }) =>
            cn('p-2 rounded-md', pressed && 'bg-primary/10')
          }
          accessibilityRole="button"
        >
          <Settings size={20} strokeWidth={2} color="#e35d1e" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          cn('px-6 py-6 gap-6'),
          { paddingBottom: insets.bottom + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Minds Section */}
        <View style={cn('gap-4')}>
          {minds.length === 0 ? (
            <View style={cn('bg-card border border-border p-8 rounded-xl items-center justify-center border-dashed border-2')}>
              <View style={cn('w-16 h-16 rounded-xl items-center justify-center bg-primary/10 mb-4')}>
                <Brain size={28} strokeWidth={2} color="#e35d1e" />
              </View>
              <Text style={cn('text-base font-sans font-semibold text-muted-foreground text-center mb-1')}>
                No minds yet
              </Text>
              <Text style={cn('text-xs font-sans text-muted-foreground/80 text-center mb-4')}>
                Create a mind to start organizing your knowledge.
              </Text>
              <Pressable
                onPress={() => {
                  if (canCreateMindLimit()) {
                    openCreate();
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
                  Create Mind
                </Text>
              </Pressable>
            </View>
          ) : (
            minds.map((mind) => (
              <Pressable
                key={mind.id}
                onPress={() => router.push(`/minds/${mind.id}`)}
                style={cn(
                  'bg-card border border-border rounded-xl p-5 flex-row items-center gap-4'
                )}
              >
                <View
                  style={[
                    cn('w-12 h-12 rounded-xl items-center justify-center'),
                    { backgroundColor: '#e35d1e1a' },
                  ]}
                >
                  <Brain size={24} strokeWidth={2} color="#e35d1e" />
                </View>
                <View style={cn('flex-1')}>
                  <Text style={cn('text-base font-sans font-bold text-foreground')}>
                    {mind.name}
                  </Text>
                  {mind.description && (
                    <Text style={cn('text-sm font-sans text-muted-foreground mt-1')}>
                      {mind.description}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Mind Bottom Drawer */}
      {createOpen && (
        <Portal name="create-mind">
          <View style={[cn('absolute inset-0'), { pointerEvents: createOpen ? 'auto' : 'none' }]}>
            <Animated.View style={[cn('absolute inset-0 bg-black/40'), { opacity: createBackdropOpacity }]}>
              <Pressable style={cn('flex-1')} onPress={closeCreate} />
            </Animated.View>
            <Animated.View
              style={[
                cn('absolute left-0 right-0 bottom-0 bg-card border-t border-border p-6 shadow-2xl'),
                {
                  transform: [{ translateY: createSlideAnim }],
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                },
              ]}
            >
              <View style={cn('flex-row justify-between items-center mb-6')}>
                <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
                  New Mind
                </Text>
                <Pressable
                  onPress={closeCreate}
                  style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-muted')}
                >
                  <X size={20} strokeWidth={2.4} color="#686868" />
                </Pressable>
              </View>

              <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2')}>
                Mind name
              </Text>
              <TextInput
                style={cn(
                  'w-full bg-muted border border-border font-sans text-foreground px-4 py-3.5 rounded-md text-base'
                )}
                placeholder="e.g. Product Knowledge"
                placeholderTextColor="#9ca3af"
                value={createName}
                onChangeText={setCreateName}
                onSubmitEditing={handleCreateMind}
              />

              <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2 mt-4')}>
                Description
              </Text>
              <TextInput
                style={cn(
                  'w-full bg-muted border border-border font-sans text-foreground px-4 py-3.5 rounded-md text-base'
                )}
                placeholder="What is this mind about?"
                placeholderTextColor="#9ca3af"
                value={createDescription}
                onChangeText={setCreateDescription}
                multiline
                numberOfLines={3}
              />
              {createError && (
                <Text style={cn('text-destructive font-sans text-sm mt-3')}>
                  {createError}
                </Text>
              )}

              <View style={[cn('mt-6'), { marginBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
                <Pressable
                  onPress={handleCreateMind}
                  disabled={createMindMutation.isPending}
                  style={({ pressed }) =>
                    cn(
                      'w-full bg-primary py-4 rounded-md items-center justify-center shadow-lg shadow-primary/20',
                      (pressed || createMindMutation.isPending) && 'opacity-90'
                    )
                  }
                >
                  {createMindMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={cn('text-primary-foreground font-sans font-semibold text-base')}>
                      Create Mind
                    </Text>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Portal>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <Portal name="upgrade-prompt-mind">
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
                  Mind Limit Reached
                </Text>
                <Text style={cn('text-sm font-sans text-muted-foreground text-center mt-2')}>
                  You've reached the mind limit for this organization on your {subData?.plan?.name || 'Free'} plan. Upgrade to create more minds.
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
