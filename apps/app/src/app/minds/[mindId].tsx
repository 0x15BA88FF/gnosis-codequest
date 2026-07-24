import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilePlus, Settings, Upload, ArrowLeft, Trash2, FileText, X, Clock, Loader, CheckCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  useMind,
  useMindMembers,
  useMindDocuments,
  useUploadDocument,
  useDeleteDocument,
} from '@/lib/hooks';
import type { MindRole } from '@/lib/api-types';

type SelectedDocument = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

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

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const processingStatusColors: Record<string, { bg: string; text: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }> }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', Icon: Clock },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', Icon: Loader },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', Icon: CheckCircle },
  FAILED: { bg: 'bg-destructive/10', text: 'text-destructive', Icon: XCircle },
};

const roleColors: Record<MindRole, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-primary/10', text: 'text-primary' },
  EDITOR: { bg: 'bg-orange-100', text: 'text-orange-700' },
  VIEWER: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

export default function MindDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { mindId } = useLocalSearchParams<{ mindId: string }>();

  const { data: mind, isLoading: mindLoading } = useMind(token, mindId ?? null);
  const { data: members = [] } = useMindMembers(token, mindId ?? null);
  const { data: allDocuments = [], isLoading: docsLoading } = useMindDocuments(token, mindId ?? null);
  const uploadMutation = useUploadDocument(token, mindId ?? null);
  const deleteDocumentMutation = useDeleteDocument(token, mindId ?? null);

  const documents = allDocuments.filter((d) => !d.deleted);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedDocument | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loading = mindLoading;

  const isAdmin = mind?.role === 'ADMIN';
  const currentMember = members.find((m) => m.userId === user?.id);
  const canManage = isAdmin || currentMember?.role === 'ADMIN';
  const canUpload = canManage || currentMember?.role === 'EDITOR';

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadError(null);
    try {
      await uploadMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      setUploadOpen(false);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Failed to upload document.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    Alert.alert(
      'Delete Document',
      'This will soft-delete the document. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocumentMutation.mutateAsync(docId);
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  if (loading) {
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
            Mind
          </Text>
        </View>
        {canManage && (
          <Pressable
            onPress={() => router.push(`/minds/${mindId}/settings`)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-primary/10')}
          >
            <Settings size={20} strokeWidth={2} color="#e35d1e" />
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

        {/* Documents Section */}
        <View style={cn('gap-4')}>
          <View style={cn('flex-row items-center justify-between')}>
            <Text style={cn('text-sm font-sans font-semibold text-foreground uppercase tracking-wider')}>
              Documents ({documents.length})
            </Text>
            {canUpload && (
              <Pressable
                onPress={() => setUploadOpen(true)}
                style={cn('flex-row items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20')}
              >
                <Upload size={16} strokeWidth={2} color="#e35d1e" />
                <Text style={cn('text-xs font-sans font-semibold text-primary')}>
                  Upload
                </Text>
              </Pressable>
            )}
          </View>

          {docsLoading ? (
            <View style={cn('bg-card border border-border rounded-xl p-8 items-center')}>
              <ActivityIndicator size="small" color="#e35d1e" />
            </View>
          ) : documents.length === 0 ? (
            <View style={cn('bg-card border border-border p-8 rounded-xl items-center justify-center border-dashed border-2')}>
              <View style={cn('w-16 h-16 rounded-xl items-center justify-center bg-primary/10 mb-4')}>
                <FileText size={28} strokeWidth={2} color="#e35d1e" />
              </View>
              <Text style={cn('text-base font-sans font-semibold text-muted-foreground text-center mb-1')}>
                No documents yet
              </Text>
              <Text style={cn('text-xs font-sans text-muted-foreground/80 text-center')}>
                Upload PDFs, text files, or documents to start building your knowledge base.
              </Text>
            </View>
          ) : (
            documents.map((doc) => {
              const status = processingStatusColors[doc.processingStatus] || processingStatusColors.PENDING;
              return (
                <View
                  key={doc.id}
                  style={cn('bg-card border border-border rounded-xl p-4 flex-row items-center gap-3')}
                >
                  <View
                    style={[
                      cn('w-12 h-12 rounded-xl items-center justify-center'),
                      cn(status.bg),
                    ]}
                  >
                    <status.Icon size={20} strokeWidth={2} color="#000000" />
                  </View>
                  <View style={cn('flex-1 min-w-0')}>
                    <Text
                      style={cn('text-sm font-sans font-semibold text-foreground')}
                      numberOfLines={1}
                    >
                      {doc.fileName}
                    </Text>
                    <View style={cn('flex-row items-center gap-3 mt-1')}>
                      <Text style={cn('text-3xs font-sans text-muted-foreground')}>
                        {formatFileSize(doc.fileSizeBytes)}
                      </Text>
                      <Text style={cn('text-3xs font-sans text-muted-foreground')}>
                        {doc.mediaType || 'Unknown'}
                      </Text>
                    </View>
                    <Text style={cn('text-3xs font-sans text-muted-foreground mt-1')}>
                      Uploaded {formatDate(doc.createdAt)}
                    </Text>
                  </View>
                  {(canManage || currentMember?.role === 'ADMIN') && (
                    <Pressable
                      onPress={() => handleDeleteDocument(doc.id)}
                      style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-destructive/10')}
                    >
                      <Trash2 size={18} strokeWidth={2} color="#d44c34" />
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Members Section (Read-only) */}
        <View style={cn('gap-4')}>
          <Text style={cn('text-sm font-sans font-semibold text-foreground uppercase tracking-wider')}>
            Members ({members.length})
          </Text>

          {members.length === 0 ? (
            <View style={cn('bg-card border border-border p-8 rounded-xl items-center justify-center border-dashed border-2')}>
              <View style={cn('w-16 h-16 rounded-xl items-center justify-center bg-primary/10 mb-4')}>
                <FileText size={28} strokeWidth={2} color="#e35d1e" />
              </View>
              <Text style={cn('text-base font-sans font-semibold text-muted-foreground text-center mb-1')}>
                No members yet
              </Text>
              <Text style={cn('text-xs font-sans text-muted-foreground/80 text-center')}>
                Mind members are managed from the organization settings.
              </Text>
            </View>
          ) : (
            members.map((member) => {
              const memberRoleStyle = roleColors[member.role] || roleColors.VIEWER;
              const isCurrentUser = member.userId === user?.id;

              return (
                <View
                  key={member.userId}
                  style={cn('bg-card border border-border rounded-xl p-4')}
                >
                  <View style={cn('flex-row items-center gap-3')}>
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
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Upload Document Modal */}
      {uploadOpen && (
        <View style={cn('absolute inset-0 z-50 items-center justify-center px-8')}>
          <Pressable style={cn('absolute inset-0 bg-black/40')} onPress={() => setUploadOpen(false)} />
          <View style={cn('bg-card border border-border rounded-xl p-6 w-full shadow-2xl')}>
            <View style={cn('flex-row justify-between items-center mb-6')}>
              <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
                Upload Document
              </Text>
              <Pressable
                onPress={() => { setUploadOpen(false); setSelectedFile(null); }}
                style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-muted')}
              >
                <X size={20} strokeWidth={2.4} color="#686868" />
              </Pressable>
            </View>

            {selectedFile ? (
              <View style={cn('gap-4')}>
                <View style={cn('bg-muted border border-border p-4 rounded-lg flex-row items-center gap-3')}>
                  <FileText size={24} strokeWidth={2} color="#e35d1e" />
                  <View style={cn('flex-1 min-w-0')}>
                    <Text style={cn('text-sm font-sans font-semibold text-foreground')}>
                      {selectedFile.name}
                    </Text>
                    <Text style={cn('text-3xs font-sans text-muted-foreground')}>
                      {formatFileSize(selectedFile.size ?? 0)} • {selectedFile.mimeType || 'Unknown type'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedFile(null)}
                    style={({ pressed }) => cn('p-2 rounded-md', pressed && 'bg-muted')}
                  >
                    <X size={18} strokeWidth={2} color="#686868" />
                  </Pressable>
                </View>

                {uploadError && (
                  <Text style={cn('text-destructive font-sans text-sm')}>
                    {uploadError}
                  </Text>
                )}

                <View style={cn('flex-row gap-3 mt-4')}>
                  <Pressable
                    onPress={() => setSelectedFile(null)}
                    style={({ pressed }) =>
                      cn(
                        'flex-1 bg-muted py-3.5 rounded-md items-center',
                        pressed && 'opacity-80'
                      )
                    }
                  >
                    <Text style={cn('text-foreground font-sans font-semibold text-sm')}>
                      Change File
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpload}
                    disabled={uploadMutation.isPending}
                    style={({ pressed }) =>
                      cn(
                        'flex-1 bg-primary py-3.5 rounded-md items-center shadow-lg shadow-primary/20',
                        (pressed || uploadMutation.isPending) && 'opacity-90'
                      )
                    }
                  >
                    {uploadMutation.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={cn('text-primary-foreground font-sans font-semibold text-sm')}>
                        Upload
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={cn('gap-4')}>
                <Pressable
                  onPress={async () => {
                    try {
                      const result = await DocumentPicker.getDocumentAsync({
                        type: [
                          'application/pdf',
                          'text/plain',
                          'text/markdown',
                          'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'application/vnd.ms-excel',
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'text/csv',
                        ],
                        copyToCacheDirectory: true,
                      });
                      if (!result.canceled && result.assets[0]) {
                        const asset = result.assets[0];
                        setSelectedFile({
                          uri: asset.uri,
                          name: asset.name || 'document',
                          mimeType: asset.mimeType || 'application/octet-stream',
                        });
                      }
                    } catch (e) {
                      Alert.alert('Error', 'Failed to pick document');
                    }
                  }}
                  style={cn(
                    'bg-muted border border-border border-dashed p-8 rounded-xl items-center justify-center'
                  )}
                >
                  <FilePlus size={32} strokeWidth={2} color="#e35d1e" />
                  <Text style={cn('text-sm font-sans font-semibold text-foreground mt-3')}>
                    Select a Document
                  </Text>
                  <Text style={cn('text-xs font-sans text-muted-foreground text-center mt-1 px-4')}>
                    PDF, TXT, MD, DOCX, XLSX, CSV, and more
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setUploadOpen(false)}
                  style={cn('bg-muted py-3.5 rounded-md items-center')}
                >
                  <Text style={cn('text-foreground font-sans font-semibold text-sm')}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
