import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mindApi } from '@/lib/api-client';
import type { UpdateMindRequest, UpdateMindMemberRequest } from '@/lib/api-types';

export function useMind(token: string | null, mindId: string | null) {
  return useQuery({
    queryKey: ['minds', mindId],
    queryFn: () => mindApi.get(token!, mindId!),
    enabled: !!token && !!mindId,
  });
}

export function useMindMembers(token: string | null, mindId: string | null) {
  return useQuery({
    queryKey: ['minds', mindId, 'members'],
    queryFn: () => mindApi.listMembers(token!, mindId!),
    enabled: !!token && !!mindId,
  });
}

export function useMindDocuments(token: string | null, mindId: string | null) {
  return useQuery({
    queryKey: ['minds', mindId, 'documents'],
    queryFn: () => mindApi.listDocuments(token!, mindId!),
    enabled: !!token && !!mindId,
  });
}

export function useUpdateMind(token: string | null, mindId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMindRequest) => mindApi.update(token!, mindId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minds', mindId] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'allMinds'] });
    },
  });
}

export function useDeleteMind(token: string | null, mindId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => mindApi.remove(token!, mindId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minds'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'allMinds'] });
    },
  });
}

export function useUpdateMindMember(token: string | null, mindId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateMindMemberRequest }) =>
      mindApi.updateMember(token!, mindId!, userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minds', mindId, 'members'] });
    },
  });
}

export function useRemoveMindMember(token: string | null, mindId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => mindApi.removeMember(token!, mindId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minds', mindId, 'members'] });
    },
  });
}

export function useUploadDocument(token: string | null, mindId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: { uri: string; name: string; mimeType: string }) =>
      mindApi.uploadDocument(token!, mindId!, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minds', mindId, 'documents'] });
    },
  });
}

export function useDeleteDocument(token: string | null, mindId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => mindApi.deleteDocument(token!, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minds', mindId, 'documents'] });
    },
  });
}
