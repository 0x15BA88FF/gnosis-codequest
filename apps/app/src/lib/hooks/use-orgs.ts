import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgApi, dashboardApi } from '@/lib/api-client';
import type { CreateOrgRequest, UpdateOrgRequest, UpdateOrgMemberRequest, OrgInviteRequest, CreateMindRequest } from '@/lib/api-types';

export function useOrgList(token: string | null) {
  return useQuery({
    queryKey: ['orgs'],
    queryFn: () => orgApi.list(token!),
    enabled: !!token,
  });
}

export function useOrg(token: string | null, orgId: string | null) {
  return useQuery({
    queryKey: ['orgs', orgId],
    queryFn: () => orgApi.get(token!, orgId!),
    enabled: !!token && !!orgId,
  });
}

export function useOrgMinds(token: string | null, orgId: string | null) {
  return useQuery({
    queryKey: ['orgs', orgId, 'minds'],
    queryFn: () => orgApi.listMinds(token!, orgId!),
    enabled: !!token && !!orgId,
  });
}

export function useOrgMembers(token: string | null, orgId: string | null) {
  return useQuery({
    queryKey: ['orgs', orgId, 'members'],
    queryFn: () => orgApi.listMembers(token!, orgId!),
    enabled: !!token && !!orgId,
  });
}

export function useOrgInvites(token: string | null, orgId: string | null) {
  return useQuery({
    queryKey: ['orgs', orgId, 'invites'],
    queryFn: () => orgApi.listInvites(token!, orgId!),
    enabled: !!token && !!orgId,
  });
}

export function useAllMinds(token: string | null) {
  return useQuery({
    queryKey: ['dashboard', 'allMinds'],
    queryFn: () => dashboardApi.listAllMinds(token!),
    enabled: !!token,
  });
}

export function useCreateOrg(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrgRequest) => orgApi.create(token!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}

export function useUpdateOrg(token: string | null, orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrgRequest) => orgApi.update(token!, orgId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs'] });
      qc.invalidateQueries({ queryKey: ['orgs', orgId] });
    },
  });
}

export function useDeleteOrg(token: string | null, orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => orgApi.delete(token!, orgId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}

export function useLeaveOrg(token: string | null, orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => orgApi.leave(token!, orgId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}

export function useCreateMind(token: string | null, orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMindRequest) => orgApi.createMind(token!, orgId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'minds'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'allMinds'] });
    },
  });
}

export function useUpdateMember(token: string | null, orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateOrgMemberRequest }) =>
      orgApi.updateMember(token!, orgId!, userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'members'] });
    },
  });
}

export function useRemoveMember(token: string | null, orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => orgApi.removeMember(token!, orgId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'members'] });
    },
  });
}

export function useCreateInvite(token: string | null, orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OrgInviteRequest) => orgApi.createInvite(token!, orgId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'invites'] });
    },
  });
}

export function useCancelInvite(token: string | null, orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => orgApi.cancelInvite(token!, orgId!, inviteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'invites'] });
    },
  });
}
