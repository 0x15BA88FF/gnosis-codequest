import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userInviteApi } from '@/lib/api-client';

export function usePendingInvites(token: string | null) {
  return useQuery({
    queryKey: ['invites', 'pending'],
    queryFn: () => userInviteApi.listPending(token!),
    enabled: !!token,
  });
}

export function useAcceptInvite(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteToken: string) => userInviteApi.accept(token!, inviteToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites', 'pending'] });
      qc.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}

export function useDeclineInvite(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteToken: string) => userInviteApi.decline(token!, inviteToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites', 'pending'] });
    },
  });
}
