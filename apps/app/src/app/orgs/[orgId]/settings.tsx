import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Animated,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from '@rn-primitives/portal';
import {
  ArrowLeft,
  Trash2,
  Settings,
  Pencil,
  X,
  UserMinus,
  Mail,
  UserPlus,
  XCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  useOrg,
  useOrgMembers,
  useOrgInvites,
  useUpdateOrg,
  useDeleteOrg,
  useLeaveOrg,
  useCreateInvite,
  useCancelInvite,
  useUpdateMember,
  useRemoveMember,
} from '@/lib/hooks';
import type { OrgMember } from '@/lib/api-types';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

const roleColors: Record<string, { bg: string; text: string }> = {
  OWNER: { bg: 'bg-primary/10', text: 'text-primary' },
  ADMIN: { bg: 'bg-orange-100', text: 'text-orange-700' },
  MEMBER: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ACCEPTED: { bg: 'bg-green-100', text: 'text-green-700' },
  EXPIRED: { bg: 'bg-muted', text: 'text-muted-foreground' },
  REVOKED: { bg: 'bg-destructive/10', text: 'text-destructive' },
};

const isPending = (invite: { status: string }) => invite.status === 'PENDING';

const SHEET_OFFSET = Dimensions.get('window').height;

export default function OrgSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { orgId } = useLocalSearchParams<{ orgId: string }>();

  const { data: org, isLoading } = useOrg(token, orgId ?? null);
  const { data: members = [] } = useOrgMembers(token, orgId ?? null);
  const { data: invites = [], refetch: refetchInvites, isFetching: invitesLoading } = useOrgInvites(token, orgId ?? null);

  const updateOrgMutation = useUpdateOrg(token, orgId ?? null);
  const deleteOrgMutation = useDeleteOrg(token, orgId ?? null);
  const leaveOrgMutation = useLeaveOrg(token, orgId ?? null);
  const createInviteMutation = useCreateInvite(token, orgId ?? null);
  const cancelInviteMutation = useCancelInvite(token, orgId ?? null);
  const updateMemberMutation = useUpdateMember(token, orgId ?? null);
  const removeMemberMutation = useRemoveMember(token, orgId ?? null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [manageOpen, setManageOpen] = useState(false);
  const [manageMember, setManageMember] = useState<OrgMember | null>(null);
  const [manageRole, setManageRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [manageError, setManageError] = useState<string | null>(null);

  // Drawer animations
  const [settingsSlideAnim] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [settingsBackdropOpacity] = useState(() => new Animated.Value(0));
  const [inviteSlideAnim] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [inviteBackdropOpacity] = useState(() => new Animated.Value(0));
  const [manageSlideAnim] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [manageBackdropOpacity] = useState(() => new Animated.Value(0));
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
      Animated.timing(settingsSlideAnim, {
        toValue: settingsOpen ? 0 : SHEET_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(settingsBackdropOpacity, {
        toValue: settingsOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [settingsOpen, settingsSlideAnim, settingsBackdropOpacity]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(inviteSlideAnim, {
        toValue: inviteOpen ? 0 : SHEET_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(inviteBackdropOpacity, {
        toValue: inviteOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [inviteOpen, inviteSlideAnim, inviteBackdropOpacity]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(manageSlideAnim, {
        toValue: manageOpen ? 0 : SHEET_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(manageBackdropOpacity, {
        toValue: manageOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [manageOpen, manageSlideAnim, manageBackdropOpacity]);

  const handleRename = async () => {
    setSaveError(null);
    if (!settingsName.trim()) {
      setSaveError('Organization name is required.');
      return;
    }
    try {
      await updateOrgMutation.mutateAsync({ name: settingsName.trim() });
      setSettingsOpen(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to rename organization.');
    }
  };

  const handleLeave = async () => {
    setLeaveError(null);
    try {
      await leaveOrgMutation.mutateAsync();
      router.replace('/(tabs)/orgs');
    } catch (e: unknown) {
      setLeaveError(e instanceof Error ? e.message : 'Cannot connect to server.');
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteOrgMutation.mutateAsync();
      router.replace('/(tabs)/orgs');
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Action failed. Please try again.');
    }
  };

  const handleInvite = async () => {
    setInviteError(null);
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }
    try {
      await createInviteMutation.mutateAsync({
        inviteeEmail: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteOpen(false);
      setInviteEmail('');
    } catch (e: unknown) {
      setInviteError(e instanceof Error ? e.message : 'Failed to send invite');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInviteMutation.mutateAsync(inviteId);
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel invite');
    }
  };

  const openSettings = () => {
    setSettingsName(org?.name || '');
    setSaveError(null);
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    setSettingsName('');
    setSaveError(null);
  };

  const openManageMember = (member: OrgMember) => {
    setManageMember(member);
    setManageRole(member.role === 'ADMIN' ? 'ADMIN' : 'MEMBER');
    setManageError(null);
    setManageOpen(true);
  };

  const closeManageMember = () => {
    setManageOpen(false);
    setManageMember(null);
    setManageRole('MEMBER');
    setManageError(null);
  };

  const handleUpdateMemberRole = async () => {
    if (!manageMember) return;
    setManageError(null);
    try {
      await updateMemberMutation.mutateAsync({
        userId: manageMember.userId,
        data: { role: manageRole },
      });
      closeManageMember();
    } catch (e: unknown) {
      setManageError(e instanceof Error ? e.message : 'Failed to update member.');
    }
  };

  const handleRemoveMember = async () => {
    if (!manageMember) return;
    setManageError(null);
    try {
      await removeMemberMutation.mutateAsync(manageMember.userId);
      closeManageMember();
    } catch (e: unknown) {
      setManageError(e instanceof Error ? e.message : 'Failed to remove member.');
    }
  };

  const openLeave = () => {
    setLeaveError(null);
    setLeaveOpen(true);
  };

  const openDelete = () => {
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const openInvite = () => {
    setInviteEmail('');
    setInviteRole('MEMBER');
    setInviteError(null);
    setInviteOpen(true);
    refetchInvites();
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('MEMBER');
    setInviteError(null);
  };

  const currentMember = members.find((m) => m.userId === user?.id);
  const isOwner = org?.ownerId === user?.id;
  const currentRole = currentMember?.role || (isOwner ? 'OWNER' : 'MEMBER');
  const isCurrentUserOwner = currentRole === 'OWNER';
  const isCurrentUserAdmin = currentRole === 'ADMIN';
  const canManageOrg = isCurrentUserOwner || isCurrentUserAdmin;
  const canDeleteOrg = isCurrentUserOwner;

  const canManage = canManageOrg;

  const roleLabel = currentRole;
  const roleStyle = roleColors[roleLabel] || roleColors.MEMBER;

  if (isLoading) {
    return (
      <View style={cn('flex-1 bg-background items-center justify-center')}>
        <ActivityIndicator size="large" color="#e35d1e" />
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
            {org?.name || 'Organization'}
          </Text>
          <Text style={cn('text-2xs font-sans text-primary font-semibold uppercase tracking-wider')}>
            Settings
          </Text>
        </View>
        {canManageOrg && (
          <Pressable
            onPress={openSettings}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-primary/10')}
          >
            <Pencil size={20} strokeWidth={2} color="#e35d1e" />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          cn('px-6 py-6 gap-6'),
          { paddingBottom: insets.bottom + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {canManage && members.length > 0 && (
          <View style={cn('gap-4')}>
            <View style={cn('flex-row items-center justify-between')}>
              <Text style={cn('text-sm font-sans font-semibold text-foreground uppercase tracking-wider')}>
                Members ({members.length})
              </Text>
            </View>
            {members.map((member) => {
              const memberRoleStyle = roleColors[member.role] || roleColors.MEMBER;
              const isCurrentUser = member.userId === user?.id;
              const canManageMember = canManage && member.role !== 'OWNER' && !isCurrentUser;

              return (
                <View
                  key={member.userId}
                  style={cn('bg-card border border-border rounded-xl p-4 shadow-sm')}
                >
                  <View style={cn('flex-row items-center justify-between gap-4')}>
                    <View style={cn('flex-row items-center gap-3 flex-1')}>
                      <View
                        style={[
                          cn('w-10 h-10 rounded-xl items-center justify-center'),
                          { backgroundColor: '#e35d1e1a' },
                        ]}
                      >
                        <Text style={cn('text-lg font-sans font-bold text-primary')}>
                          {member.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={cn('flex-1')}>
                        <View style={cn('flex-row items-center gap-2')}>
                          <Text style={cn('text-sm font-sans font-semibold text-foreground')}>
                            {member.displayName}
                          </Text>
                          {isCurrentUser && (
                            <View style={cn('px-2 py-0.5 rounded-full bg-primary/10')}>
                              <Text style={cn('text-3xs font-sans font-semibold text-primary uppercase tracking-wider')}>
                                You
                              </Text>
                            </View>
                          )}
                          <View
                            style={cn('px-2 py-0.5 rounded-full', memberRoleStyle.bg)}
                          >
                            <Text
                              style={cn(
                                'text-3xs font-sans font-semibold uppercase tracking-wider',
                                memberRoleStyle.text
                              )}
                            >
                              {member.role}
                            </Text>
                          </View>
                        </View>
                        <View style={cn('flex-row items-center gap-2 mt-1')}>
                          <Text style={cn('text-3xs font-sans text-muted-foreground')}>
                            Joined {formatDate(member.joinedAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {canManageMember && (
                      <Pressable
                        onPress={() => openManageMember(member)}
                        style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-muted')}
                      >
                        <Settings size={20} strokeWidth={2} color="#686868" />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Pending Invites (Owner/Admin only) */}
        {canManage && (
          <View style={cn('gap-4')}>
            <View style={cn('flex-row items-center justify-between')}>
              <Text style={cn('text-sm font-sans font-semibold text-foreground uppercase tracking-wider')}>
                Pending Invites
              </Text>
              <View style={cn('flex-row items-center gap-2')}>
                <Pressable onPress={() => refetchInvites()} disabled={invitesLoading} style={cn('p-2 rounded-md')}>
                  <RefreshCw size={20} strokeWidth={2} color="#e35d1e" />
                </Pressable>
                <Pressable onPress={openInvite} style={cn('p-2 rounded-md')}>
                  <UserPlus size={20} strokeWidth={2} color="#e35d1e" />
                </Pressable>
              </View>
            </View>
            {invitesLoading ? (
              <View style={cn('bg-card border border-border rounded-xl p-8 items-center')}>
                <ActivityIndicator size="small" color="#e35d1e" />
              </View>
            ) : invites.length > 0 ? (
              invites.map((invite) => (
                <View
                  key={invite.id}
                  style={cn('bg-card border border-border rounded-xl p-4 shadow-sm')}
                >
                  <View style={cn('flex-row items-center justify-between gap-4')}>
                    <View style={cn('flex-row items-center gap-3 flex-1')}>
                      <View
                        style={cn('w-10 h-10 rounded-xl items-center justify-center bg-muted')}
                      >
                        <Mail size={18} strokeWidth={2} color="#686868" />
                      </View>
                      <View>
                        <Text style={cn('text-sm font-sans font-semibold text-foreground')}>
                          {invite.inviteeEmail}
                        </Text>
                        <Text style={cn('text-3xs font-sans text-muted-foreground')}>
                          Invited as {invite.role}
                        </Text>
                      </View>
                    </View>
                    <View style={cn('flex-row items-center gap-2')}>
                      <View
                        style={cn('px-2 py-0.5 rounded-full', statusColors[invite.status]?.bg || statusColors.EXPIRED.bg)}
                      >
                        <Text
                          style={cn(
                            'text-3xs font-sans font-semibold uppercase tracking-wider',
                            statusColors[invite.status]?.text || statusColors.EXPIRED.text
                          )}
                        >
                          {invite.status}
                        </Text>
                      </View>
                      {isPending(invite) && (
                        <Pressable
                          onPress={() => handleCancelInvite(invite.id)}
                          style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-destructive/10')}
                        >
                          <XCircle size={18} strokeWidth={2} color="#d44c34" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={cn('bg-card border border-border p-6 rounded-xl items-center border-dashed border-2')}>
                <Text style={cn('text-sm font-sans text-muted-foreground text-center')}>
                  No pending invites
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Danger Zone */}
        <View style={cn('pt-6')}>
          {(canDeleteOrg || !isCurrentUserOwner) && (
            <Text style={cn('text-sm font-sans font-semibold text-destructive uppercase tracking-wider mb-4')}>
              Danger Zone
            </Text>
          )}

          {!isCurrentUserOwner && (
            <Pressable
              onPress={openLeave}
              style={cn(
                'w-full bg-card border border-destructive/20 py-3.5 rounded-xl items-center flex-row justify-center gap-2 shadow-sm'
              )}
            >
              <UserMinus size={18} strokeWidth={2} color="#d44c34" />
              <Text style={cn('text-destructive font-sans font-semibold text-sm')}>
                Leave Organization
              </Text>
            </Pressable>
          )}

          {canDeleteOrg && (
            <Pressable
              onPress={openDelete}
              style={cn(
                'w-full bg-accent border border-destructive/20 py-3.5 rounded-md items-center flex-row justify-center gap-2 mt-3'
              )}
            >
              <Trash2 size={18} strokeWidth={2} color="#d44c34" />
              <Text style={cn('text-destructive font-sans font-semibold text-sm')}>
                Delete Organization
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Settings Bottom Drawer (Owner/Admin) */}
      {settingsOpen && (
        <View style={cn('absolute inset-0')}>
          <Animated.View style={[cn('absolute inset-0 bg-black/40'), { opacity: settingsBackdropOpacity }]}>
            <Pressable style={cn('flex-1')} onPress={closeSettings} />
          </Animated.View>
          <Animated.View
            style={[
              cn('absolute left-0 right-0 bottom-0 bg-card border-t border-border p-6 shadow-2xl'),
              {
                transform: [{ translateY: settingsSlideAnim }],
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
              },
            ]}
          >
            <View style={cn('flex-row justify-between items-center mb-6')}>
              <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
                Organization Settings
              </Text>
              <Pressable
                onPress={closeSettings}
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
              placeholder="Organization name"
              placeholderTextColor="#9ca3af"
              value={settingsName}
              onChangeText={setSettingsName}
              onSubmitEditing={handleRename}
            />
            {saveError && (
              <Text style={cn('text-destructive font-sans text-sm mt-2')}>
                {saveError}
              </Text>
            )}

            <View style={[cn('mt-6'), { marginBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
              <Pressable
                onPress={handleRename}
                disabled={updateOrgMutation.isPending}
                style={({ pressed }) =>
                  cn(
                    'w-full bg-primary py-4 rounded-md items-center justify-center shadow-lg shadow-primary/20 mt-3',
                    (pressed || updateOrgMutation.isPending) && 'opacity-90'
                  )
                }
              >
                {updateOrgMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={cn('text-primary-foreground font-sans font-semibold text-base')}>
                    Save
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Invite Member Bottom Drawer */}
      {inviteOpen && (
        <View style={cn('absolute inset-0')}>
          <Animated.View style={[cn('absolute inset-0 bg-black/40'), { opacity: inviteBackdropOpacity }]}>
            <Pressable style={cn('flex-1')} onPress={closeInvite} />
          </Animated.View>
          <Animated.View
            style={[
              cn('absolute left-0 right-0 bottom-0 bg-card border-t border-border p-6 shadow-2xl'),
              {
                transform: [{ translateY: inviteSlideAnim }],
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
              },
            ]}
          >
            <View style={cn('flex-row justify-between items-center mb-6')}>
              <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
                Invite Member
              </Text>
              <Pressable
                onPress={closeInvite}
                style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-muted')}
              >
                <X size={20} strokeWidth={2.4} color="#686868" />
              </Pressable>
            </View>

            <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2')}>
              Email address
            </Text>
            <TextInput
              style={cn(
                'w-full bg-muted border border-border font-sans text-foreground px-4 py-3.5 rounded-md text-base'
              )}
              placeholder="user@example.com"
              placeholderTextColor="#9ca3af"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              onSubmitEditing={handleInvite}
            />
            {inviteError && (
              <Text style={cn('text-destructive font-sans text-sm mt-2')}>
                {inviteError}
              </Text>
            )}

            <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2 mt-4')}>
              Organization role
            </Text>
            <View style={cn('flex-row gap-3')}>
              <Pressable
                onPress={() => setInviteRole('MEMBER')}
                style={({ pressed }) =>
                  cn(
                    'flex-1 border py-3 rounded-md items-center',
                    inviteRole === 'MEMBER'
                      ? 'bg-primary border-primary'
                      : 'border-border',
                    pressed && 'opacity-80'
                  )
                }
              >
                <Text
                  style={cn(
                    'font-sans font-semibold text-sm',
                    inviteRole === 'MEMBER' ? 'text-primary-foreground' : 'text-foreground'
                  )}
                >
                  Member
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInviteRole('ADMIN')}
                style={({ pressed }) =>
                  cn(
                    'flex-1 border py-3 rounded-md items-center',
                    inviteRole === 'ADMIN'
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-border',
                    pressed && 'opacity-80'
                  )
                }
              >
                <Text
                  style={cn(
                    'font-sans font-semibold text-sm',
                    inviteRole === 'ADMIN' ? 'text-white' : 'text-foreground'
                  )}
                >
                  Admin
                </Text>
              </Pressable>
            </View>

            <View style={[cn('mt-5'), { marginBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
              <Pressable
                onPress={handleInvite}
                disabled={createInviteMutation.isPending}
                style={({ pressed }) =>
                  cn(
                    'flex-1 bg-primary py-4 rounded-md items-center',
                    (pressed || createInviteMutation.isPending) && 'opacity-90'
                  )
                }
              >
                {createInviteMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={cn('text-primary-foreground font-sans font-semibold text-base')}>
                    Send Invite
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Manage Member Bottom Drawer (Owner/Admin) */}
      {manageOpen && manageMember && (
        <View style={cn('absolute inset-0')}>
          <Animated.View style={[cn('absolute inset-0 bg-black/40'), { opacity: manageBackdropOpacity }]}>
            <Pressable style={cn('flex-1')} onPress={closeManageMember} />
          </Animated.View>
          <Animated.View
            style={[
              cn('absolute left-0 right-0 bottom-0 bg-card border-t border-border p-6 shadow-2xl'),
              {
                transform: [{ translateY: manageSlideAnim }],
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
              },
            ]}
          >
            <View style={cn('flex-row justify-between items-center mb-6')}>
              <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
                Manage Member
              </Text>
              <Pressable
                onPress={closeManageMember}
                style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-muted')}
              >
                <X size={20} strokeWidth={2.4} color="#686868" />
              </Pressable>
            </View>

            <View style={cn('flex-row items-center gap-3 mb-6')}>
              <View
                style={[
                  cn('w-10 h-10 rounded-xl items-center justify-center'),
                  { backgroundColor: '#e35d1e1a' },
                ]}
              >
                <Text style={cn('text-lg font-sans font-bold text-primary')}>
                  {manageMember.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={cn('flex-1')}>
                <Text style={cn('text-sm font-sans font-semibold text-foreground')}>
                  {manageMember.displayName}
                </Text>
                <Text style={cn('text-3xs font-sans text-muted-foreground mt-0.5')}>
                  {manageMember.email}
                </Text>
              </View>
            </View>

            <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2')}>
              Organization role
            </Text>
            <View style={cn('flex-row gap-3')}>
              <Pressable
                onPress={() => setManageRole('MEMBER')}
                style={({ pressed }) =>
                  cn(
                    'flex-1 border py-3 rounded-md items-center',
                    manageRole === 'MEMBER'
                      ? 'bg-primary border-primary'
                      : 'border-border',
                    pressed && 'opacity-80'
                  )
                }
              >
                <Text
                  style={cn(
                    'font-sans font-semibold text-sm',
                    manageRole === 'MEMBER' ? 'text-primary-foreground' : 'text-foreground'
                  )}
                >
                  Member
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setManageRole('ADMIN')}
                style={({ pressed }) =>
                  cn(
                    'flex-1 border py-3 rounded-md items-center',
                    manageRole === 'ADMIN'
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-border',
                    pressed && 'opacity-80'
                  )
                }
              >
                <Text
                  style={cn(
                    'font-sans font-semibold text-sm',
                    manageRole === 'ADMIN' ? 'text-white' : 'text-foreground'
                  )}
                >
                  Admin
                </Text>
              </Pressable>
            </View>

            {manageError && (
              <Text style={cn('text-destructive font-sans text-sm mt-3')}>
                {manageError}
              </Text>
            )}

            <View style={cn('mt-6')}>
              <Pressable
                onPress={handleUpdateMemberRole}
                disabled={updateMemberMutation.isPending}
                style={({ pressed }) =>
                  cn(
                    'w-full bg-primary py-4 rounded-md items-center justify-center shadow-lg shadow-primary/20',
                    (pressed || updateMemberMutation.isPending) && 'opacity-90'
                  )
                }
              >
                {updateMemberMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={cn('text-primary-foreground font-sans font-semibold text-base')}>
                    Save Changes
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleRemoveMember}
                disabled={removeMemberMutation.isPending}
                style={({ pressed }) =>
                  cn(
                    'w-full bg-destructive py-4 rounded-md items-center justify-center mt-3',
                    (pressed || removeMemberMutation.isPending) && 'opacity-90'
                  )
                }
              >
                <Text style={cn('text-destructive-foreground font-sans font-semibold text-base')}>
                  Remove from organization
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Leave Confirmation */}
      {leaveOpen && org && (
        <Portal name="leave-org">
          <View style={cn('absolute inset-0 z-50 items-center justify-center px-8')}>
            <Pressable style={cn('absolute inset-0 bg-black/40')} onPress={() => setLeaveOpen(false)} />
            <View style={cn('bg-card border border-border rounded-xl p-6 w-full shadow-2xl')}>
              <Text style={cn('text-lg font-sans font-bold text-foreground tracking-tight')}>
                Leave organization?
              </Text>
              <Text style={cn('text-sm font-sans text-muted-foreground mt-2 leading-5')}>
                {`You will leave "${org.name}" and lose access to all its minds. You can be invited back later.`}
              </Text>
              {leaveError && (
                <Text style={cn('text-destructive font-sans text-sm mt-3')}>
                  {leaveError}
                </Text>
              )}
              <View style={cn('flex-row gap-3 mt-5')}>
                <Pressable
                  onPress={() => setLeaveOpen(false)}
                  style={({ pressed }) =>
                    cn('flex-1 bg-muted py-3 rounded-md items-center', pressed && 'opacity-80')
                  }
                >
                  <Text style={cn('text-foreground font-sans font-semibold text-sm')}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleLeave}
                  disabled={leaveOrgMutation.isPending}
                  style={({ pressed }) =>
                    cn(
                      'flex-1 bg-destructive py-3 rounded-md items-center',
                      (pressed || leaveOrgMutation.isPending) && 'opacity-90'
                    )
                  }
                >
                  {leaveOrgMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={cn('text-destructive-foreground font-sans font-semibold text-sm')}>
                      Leave
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Portal>
      )}

      {/* Delete Confirmation */}
      {deleteOpen && org && (
        <Portal name="delete-org">
          <View style={cn('absolute inset-0 z-50 items-center justify-center px-8')}>
            <Pressable style={cn('absolute inset-0 bg-black/40')} onPress={() => setDeleteOpen(false)} />
            <View style={cn('bg-card border border-border rounded-xl p-6 w-full shadow-2xl')}>
              <Text style={cn('text-lg font-sans font-bold text-foreground tracking-tight')}>
                Delete organization?
              </Text>
              <Text style={cn('text-sm font-sans text-muted-foreground mt-2 leading-5')}>
                {`This will permanently delete "${org.name}" and all of its minds, documents, and members. This cannot be undone.`}
              </Text>
              {deleteError && (
                <Text style={cn('text-destructive font-sans text-sm mt-3')}>
                  {deleteError}
                </Text>
              )}
              <View style={cn('flex-row gap-3 mt-5')}>
                <Pressable
                  onPress={() => setDeleteOpen(false)}
                  style={({ pressed }) =>
                    cn('flex-1 bg-muted py-3 rounded-md items-center', pressed && 'opacity-80')
                  }
                >
                  <Text style={cn('text-foreground font-sans font-semibold text-sm')}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleteOrgMutation.isPending}
                  style={({ pressed }) =>
                    cn(
                      'flex-1 bg-destructive py-3 rounded-md items-center',
                      (pressed || deleteOrgMutation.isPending) && 'opacity-90'
                    )
                  }
                >
                  {deleteOrgMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={cn('text-destructive-foreground font-sans font-semibold text-sm')}>
                      Delete
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Portal>
      )}
    </View>
  );
}
