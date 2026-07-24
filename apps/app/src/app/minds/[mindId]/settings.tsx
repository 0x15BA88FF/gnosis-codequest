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
import {
  ArrowLeft,
  Brain,
  Settings,
  Trash2,
  X,
  Pencil,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  useMind,
  useMindMembers,
  useUpdateMind,
  useDeleteMind,
  useUpdateMindMember,
  useRemoveMindMember,
} from '@/lib/hooks';
import type { MindMember, MindRole } from '@/lib/api-types';

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

const roleColors: Record<MindRole, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-primary/10', text: 'text-primary' },
  EDITOR: { bg: 'bg-orange-100', text: 'text-orange-700' },
  VIEWER: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

const SHEET_OFFSET = Dimensions.get('window').height;

export default function MindSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { mindId } = useLocalSearchParams<{ mindId: string }>();

  const { data: mind, isLoading } = useMind(token, mindId ?? null);
  const { data: members = [] } = useMindMembers(token, mindId ?? null);
  const updateMindMutation = useUpdateMind(token, mindId ?? null);
  const deleteMindMutation = useDeleteMind(token, mindId ?? null);
  const updateMemberMutation = useUpdateMindMember(token, mindId ?? null);
  const removeMemberMutation = useRemoveMindMember(token, mindId ?? null);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [manageOpen, setManageOpen] = useState(false);
  const [manageMember, setManageMember] = useState<MindMember | null>(null);
  const [manageRole, setManageRole] = useState<MindRole>('VIEWER');
  const [manageError, setManageError] = useState<string | null>(null);

  const [editSlideAnim] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [editBackdropOpacity] = useState(() => new Animated.Value(0));
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
      Animated.timing(editSlideAnim, {
        toValue: editOpen ? 0 : SHEET_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(editBackdropOpacity, {
        toValue: editOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [editOpen, editSlideAnim, editBackdropOpacity]);

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

  const isAdmin = mind?.role === 'ADMIN';
  const currentMember = members.find((m) => m.userId === user?.id);
  const canManage = isAdmin || currentMember?.role === 'ADMIN';

  const openEdit = () => {
    setEditName(mind?.name || '');
    setEditDescription(mind?.description || '');
    setSaveError(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditName('');
    setEditDescription('');
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!editName.trim()) {
      setSaveError('Mind name is required.');
      return;
    }
    try {
      await updateMindMutation.mutateAsync({
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      closeEdit();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update mind.');
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMindMutation.mutateAsync();
      router.back();
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete mind.');
    }
  };

  const openManageMember = (member: MindMember) => {
    setManageMember(member);
    setManageRole(member.role);
    setManageError(null);
    setManageOpen(true);
  };

  const closeManageMember = () => {
    setManageOpen(false);
    setManageMember(null);
    setManageRole('VIEWER');
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

  if (isLoading) {
    return (
      <View style={cn('flex-1 bg-background items-center justify-center')}>
        <ActivityIndicator size="large" color="#e35d1e" />
      </View>
    );
  }

  if (!mind) {
    return (
      <View style={cn('flex-1 bg-background items-center justify-center px-6')}>
        <Text style={cn('text-center text-muted-foreground')}>
          Mind not found
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
            {mind.name}
          </Text>
          <Text style={cn('text-2xs font-sans text-primary font-semibold uppercase tracking-wider')}>
            Settings
          </Text>
        </View>
        {canManage && (
          <Pressable
            onPress={openEdit}
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
        {mind.description && (
          <View>
            <Text style={cn('font-sans text-foreground leading-5')}>
              {mind.description}
            </Text>
          </View>
        )}

        <View style={cn('flex-row items-center gap-3 text-3xs font-sans text-muted-foreground')}>
          <Text>Created {formatDate(mind.createdAt)}</Text>
          <Text>·</Text>
          <Text>Updated {formatDate(mind.updatedAt)}</Text>
          {typeof mind.storageQuotaMb === 'number' && (
            <>
              <Text>·</Text>
              <Text>{mind.storageQuotaMb} MB quota</Text>
            </>
          )}
        </View>

        {/* Members Section */}
        <View style={cn('gap-4')}>
          <View style={cn('flex-row items-center justify-between')}>
            <Text style={cn('text-sm font-sans font-semibold text-foreground uppercase tracking-wider')}>
              Members ({members.length})
            </Text>
          </View>

          {members.length === 0 ? (
            <View style={cn('bg-card border border-border p-8 rounded-xl items-center justify-center border-dashed border-2')}>
              <View style={cn('w-16 h-16 rounded-xl items-center justify-center bg-primary/10 mb-4')}>
                <Brain size={28} strokeWidth={2} color="#e35d1e" />
              </View>
              <Text style={cn('text-base font-sans font-semibold text-muted-foreground text-center mb-1')}>
                No members yet
              </Text>
              <Text style={cn('text-xs font-sans text-muted-foreground/80 text-center')}>
                Members are managed from the organization.
              </Text>
            </View>
          ) : (
            members.map((member) => {
              const memberRoleStyle = roleColors[member.role] || roleColors.VIEWER;
              const isCurrentUser = member.userId === user?.id;
              const canManageMember = canManage && !isCurrentUser;

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
                          {(member.displayName || member.email || '?').charAt(0).toUpperCase()}
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
                        <Text style={cn('text-3xs font-sans text-muted-foreground mt-1')}>
                          {member.email}
                        </Text>
                        <Text style={cn('text-3xs font-sans text-muted-foreground mt-1')}>
                          Joined {formatDate(member.joinedAt)}
                        </Text>
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
            })
          )}
        </View>

        {/* Danger Zone */}
        {canManage && (
          <View style={cn('py-6')}>
            <Text style={cn('text-sm font-sans font-semibold text-destructive uppercase tracking-wider mb-6')}>
              Danger Zone
            </Text>
            <Pressable
              onPress={() => setDeleteOpen(true)}
              style={cn(
                'w-full bg-accent border border-destructive/20 py-3.5 rounded-md items-center flex-row justify-center gap-2'
              )}
            >
              <Trash2 size={18} strokeWidth={2} color="#d44c34" />
              <Text style={cn('text-destructive font-sans font-semibold text-sm')}>
                Delete Mind
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Edit Mind Bottom Drawer */}
      {editOpen && (
        <Portal name="edit-mind">
          <View style={[cn('absolute inset-0'), { pointerEvents: editOpen ? 'auto' : 'none' }]}>
            <Animated.View style={[cn('absolute inset-0 bg-black/40'), { opacity: editBackdropOpacity }]}>
              <Pressable style={cn('flex-1')} onPress={closeEdit} />
            </Animated.View>
            <Animated.View
              style={[
                cn('absolute left-0 right-0 bottom-0 bg-card border-t border-border p-6 shadow-2xl'),
                {
                  transform: [{ translateY: editSlideAnim }],
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                },
              ]}
            >
              <View style={cn('flex-row justify-between items-center mb-6')}>
                <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
                  Edit Mind
                </Text>
                <Pressable
                  onPress={closeEdit}
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
                placeholder="Mind name"
                placeholderTextColor="#9ca3af"
                value={editName}
                onChangeText={setEditName}
                onSubmitEditing={handleSave}
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
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
              />
              {saveError && (
                <Text style={cn('text-destructive font-sans text-sm mt-3')}>
                  {saveError}
                </Text>
              )}

              <View style={[cn('mt-6'), { marginBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
                <Pressable
                  onPress={handleSave}
                  disabled={updateMindMutation.isPending}
                  style={({ pressed }) =>
                    cn(
                      'w-full bg-primary py-4 rounded-md items-center justify-center shadow-lg shadow-primary/20',
                      (pressed || updateMindMutation.isPending) && 'opacity-90'
                    )
                  }
                >
                  {updateMindMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={cn('text-primary-foreground font-sans font-semibold text-base')}>
                      Save Changes
                    </Text>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Portal>
      )}

      {/* Manage Member Bottom Drawer */}
      {manageOpen && manageMember && (
        <Portal name="manage-mind">
          <View style={[cn('absolute inset-0'), { pointerEvents: manageOpen ? 'auto' : 'none' }]}>
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
                Mind role
              </Text>
              <View style={cn('flex-row gap-3')}>
                {(['ADMIN', 'EDITOR', 'VIEWER'] as MindRole[]).map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => setManageRole(role)}
                    style={({ pressed }) =>
                      cn(
                        'flex-1 border py-3 rounded-md items-center',
                        manageRole === role ? 'bg-primary border-primary' : 'border-border',
                        pressed && 'opacity-80'
                      )
                    }
                  >
                    <Text
                      style={cn(
                        'font-sans font-semibold text-sm',
                        manageRole === role ? 'text-primary-foreground' : 'text-foreground'
                      )}
                    >
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </Text>
                  </Pressable>
                ))}
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
                    Remove from mind
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Portal>
      )}

      {/* Delete Confirmation */}
      {deleteOpen && (
        <Portal name="delete-mind">
          <View style={cn('absolute inset-0 z-50 items-center justify-center px-8')}>
            <Pressable style={cn('absolute inset-0 bg-black/40')} onPress={() => setDeleteOpen(false)} />
            <View style={cn('bg-card border border-border rounded-xl p-6 w-full shadow-2xl')}>
              <Text style={cn('text-lg font-sans font-bold text-foreground tracking-tight')}>
                Delete mind?
              </Text>
              <Text style={cn('text-sm font-sans text-muted-foreground mt-2 leading-5')}>
                {`This will soft-delete "${mind.name}" and remove its members' access. This cannot be undone.`}
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
                  disabled={deleteMindMutation.isPending}
                  style={({ pressed }) =>
                    cn(
                      'flex-1 bg-destructive py-3 rounded-md items-center',
                      (pressed || deleteMindMutation.isPending) && 'opacity-90'
                    )
                  }
                >
                  {deleteMindMutation.isPending ? (
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
