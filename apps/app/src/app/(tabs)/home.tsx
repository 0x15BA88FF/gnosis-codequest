import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Brain,
  Building2,
  ChevronRight,
  FileText,
  Search,
  Plus,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useOrgList, useAllMinds, usePendingInvites } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();

  const { data: orgs = [], isLoading: orgsLoading } = useOrgList(token);
  const { data: minds = [], isLoading: mindsLoading } = useAllMinds(token);
  const { data: pending = [], isLoading: pendingLoading } = usePendingInvites(token);

  const loading = orgsLoading || mindsLoading || pendingLoading;

  return (
    <View style={cn('flex-1 bg-background')}>
      {/* Header */}
      <View
        style={[
          cn('border-b border-border px-6 py-4 flex-row justify-between items-center bg-card shadow-sm'),
          { paddingTop: insets.top + 8 },
        ]}
      >
        <View>
          <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
            Gnosis
          </Text>
          <Text style={cn('text-2xs font-sans text-primary font-semibold uppercase tracking-wider')}>
            Workspace
          </Text>
        </View>
        <View style={cn('flex-row items-center gap-3')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/(tabs)/notifications')}
            style={({ pressed }) =>
              cn(
                'w-9 h-9 rounded-full bg-primary/10 items-center justify-center relative',
                pressed && 'bg-primary/20'
              )
            }
          >
            <Bell size={18} color="#e35d1e" />
            {pending.length > 0 && (
              <View
                style={cn(
                  'absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive items-center justify-center'
                )}
              >
                <Text style={cn('text-3xs font-sans font-bold text-destructive-foreground')}>
                  {pending.length > 9 ? '9+' : pending.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          cn('px-6 py-8 gap-6'),
          { paddingBottom: insets.bottom + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <View style={cn('bg-accent border border-accent p-6 rounded-xl shadow-sm')}>
          <Text style={cn('text-2xl font-sans font-bold text-accent-foreground tracking-tight')}>
            Welcome back, {user?.displayName || 'User'}!
          </Text>
          <Text style={cn('text-sm font-sans text-muted-foreground mt-1.5')}>
            Logged in as <Text style={cn('font-semibold text-foreground')}>{user?.email}</Text>
          </Text>
        </View>

        {loading ? (
          <View style={cn('py-16 items-center')}>
            <Text style={cn('text-sm font-sans text-muted-foreground')}>
              Loading workspace...
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Row */}
            <View style={cn('flex-row gap-4')}>
              <Pressable
                onPress={() => router.push('/(tabs)/orgs')}
                style={({ pressed }) =>
                  cn(
                    'flex-1 bg-card border border-border p-5 rounded-xl shadow-sm',
                    pressed && 'opacity-80'
                  )
                }
              >
                <View style={cn('flex-row items-center justify-between mb-1')}>
                  <Text style={cn('text-2xs font-sans text-muted-foreground font-semibold uppercase tracking-wider')}>
                    Orgs
                  </Text>
                  <Building2 size={14} color="#9ca3af" />
                </View>
                <Text style={cn('text-2xl font-sans font-bold text-foreground')}>
                  {orgs.length}
                </Text>
                <Text style={cn('text-3xs font-sans text-muted-foreground mt-1')}>
                  Organizations
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(tabs)/search')}
                style={({ pressed }) =>
                  cn(
                    'flex-1 bg-card border border-border p-5 rounded-xl shadow-sm',
                    pressed && 'opacity-80'
                  )
                }
              >
                <View style={cn('flex-row items-center justify-between mb-1')}>
                  <Text style={cn('text-2xs font-sans text-muted-foreground font-semibold uppercase tracking-wider')}>
                    Minds
                  </Text>
                  <Brain size={14} color="#9ca3af" />
                </View>
                <Text style={cn('text-2xl font-sans font-bold text-foreground')}>
                  {minds.length}
                </Text>
                <Text style={cn('text-3xs font-sans text-muted-foreground mt-1')}>
                  Knowledge bases
                </Text>
              </Pressable>
            </View>

            {/* Quick Actions */}
            <View style={cn('flex-row gap-3')}>
              <Pressable
                onPress={() => router.push('/(tabs)/search')}
                style={({ pressed }) =>
                  cn(
                    'flex-1 flex-row items-center justify-center gap-2 bg-primary py-3.5 rounded-xl shadow-lg shadow-primary/20',
                    pressed && 'opacity-90'
                  )
                }
              >
                <Search size={16} color="#ffffff" />
                <Text style={cn('text-primary-foreground font-sans font-semibold text-sm')}>
                  Search
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/orgs')}
                style={({ pressed }) =>
                  cn(
                    'flex-row items-center justify-center gap-2 bg-muted border border-border px-5 py-3.5 rounded-xl',
                    pressed && 'opacity-80'
                  )
                }
              >
                <Plus size={16} color="#686868" />
                <Text style={cn('text-foreground font-sans font-semibold text-sm')}>
                  New Org
                </Text>
              </Pressable>
            </View>

            {/* My Orgs */}
            {orgs.length > 0 && (
              <View style={cn('bg-card border border-border rounded-xl shadow-sm')}>
                <View style={cn('flex-row justify-between items-center px-5 pt-5 pb-3')}>
                  <Text style={cn('text-xs font-sans text-muted-foreground font-semibold uppercase tracking-wider')}>
                    Your Organizations
                  </Text>
                  <Pressable onPress={() => router.push('/(tabs)/orgs')}>
                    <Text style={cn('text-xs font-sans text-primary font-semibold')}>
                      View all
                    </Text>
                  </Pressable>
                </View>
                <View style={cn('gap-0')}>
                  {orgs.slice(0, 4).map((org, idx) => (
                    <Pressable
                      key={org.id}
                      onPress={() => router.push(`/orgs/${org.id}`)}
                      style={({ pressed }) =>
                        cn(
                          'flex-row items-center gap-3 px-5 py-3.5',
                          pressed && 'bg-muted/50',
                          idx < Math.min(orgs.length, 4) - 1 && 'border-b border-border'
                        )
                      }
                    >
                      <View
                        style={cn('w-10 h-10 rounded-lg items-center justify-center bg-primary/10')}
                      >
                        <Building2 size={18} color="#e35d1e" />
                      </View>
                      <View style={cn('flex-1')}>
                        <Text style={cn('text-sm font-sans font-bold text-foreground')}>
                          {org.name}
                        </Text>
                        <Text style={cn('text-3xs font-sans text-muted-foreground mt-0.5')}>
                          {org.memberCount} members · {org.mindCount} minds
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#9ca3af" />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Recent Minds */}
            {minds.length > 0 && (
              <View style={cn('bg-card border border-border rounded-xl')}>
                <View style={cn('flex-row justify-between items-center px-5 pt-5 pb-3')}>
                  <Text style={cn('text-xs font-sans text-muted-foreground font-semibold uppercase tracking-wider')}>
                    Recent Minds
                  </Text>
                  <Pressable onPress={() => router.push('/(tabs)/orgs')}>
                    <Text style={cn('text-xs font-sans text-primary font-semibold')}>
                      Browse all
                    </Text>
                  </Pressable>
                </View>
                <View style={cn('gap-0')}>
                  {minds.slice(0, 5).map((mind, idx) => (
                    <Pressable
                      key={mind.id}
                      onPress={() => router.push(`/minds/${mind.id}`)}
                      style={({ pressed }) =>
                        cn(
                          'flex-row items-center gap-3 px-5 py-3.5',
                          pressed && 'bg-muted/50',
                          idx < Math.min(minds.length, 5) - 1 && 'border-b border-border'
                        )
                      }
                    >
                      <View
                        style={cn('w-10 h-10 rounded-lg items-center justify-center bg-purple-500/10')}
                      >
                        <Brain size={18} color="#8b5cf6" />
                      </View>
                      <View style={cn('flex-1')}>
                        <Text style={cn('text-sm font-sans font-bold text-foreground')}>
                          {mind.name}
                        </Text>
                        {mind.description ? (
                          <Text
                            style={cn('text-3xs font-sans text-muted-foreground mt-0.5')}
                            numberOfLines={1}
                          >
                            {mind.description}
                          </Text>
                        ) : null}
                      </View>
                      <FileText size={14} color="#9ca3af" />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Empty state */}
            {orgs.length === 0 && minds.length === 0 && (
              <View style={cn('bg-card border border-border p-8 rounded-xl items-center justify-center border-dashed border-2')}>
                <Text style={cn('text-base font-sans font-semibold text-muted-foreground text-center mb-1')}>
                  Your workspace is empty
                </Text>
                <Text style={cn('text-xs font-sans text-muted-foreground/80 text-center mb-4')}>
                  Create an organization to start adding minds and documents.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/orgs')}
                  style={({ pressed }) =>
                    cn(
                      'bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-md',
                      pressed && 'bg-primary/20'
                    )
                  }
                >
                  <Text style={cn('text-primary font-sans font-bold text-sm')}>
                    + Create Organization
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Pending Invites Banner */}
            {pending.length > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/notifications')}
                style={({ pressed }) =>
                  cn(
                    'bg-primary/10 border border-primary/20 p-5 rounded-xl flex-row items-center gap-3',
                    pressed && 'bg-primary/15'
                  )
                }
              >
                <Bell size={18} color="#e35d1e" />
                <View style={cn('flex-1')}>
                  <Text style={cn('text-sm font-sans font-bold text-foreground')}>
                    {pending.length} pending invitation{pending.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={cn('text-3xs font-sans text-muted-foreground mt-0.5')}>
                    You have organization invites waiting
                  </Text>
                </View>
                <ChevronRight size={16} color="#e35d1e" />
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
