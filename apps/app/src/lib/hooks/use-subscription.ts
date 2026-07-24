import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/lib/api-client';
import type { SubscriptionPlan } from '@/lib/api-types';

export function usePlans(token: string | null) {
  return useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: () => subscriptionApi.listPlans(token!),
    enabled: !!token,
  });
}

export function useCurrentSubscription(token: string | null) {
  return useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: () => subscriptionApi.getCurrent(token!),
    enabled: !!token,
  });
}

export function useCheckout(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planCode: string) => subscriptionApi.checkout(token!, planCode),
  });
}

export function useVerifyPayment(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => subscriptionApi.verify(token!, reference),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      qc.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}

export function useTransactions(token: string | null) {
  return useQuery({
    queryKey: ['subscription', 'transactions'],
    queryFn: () => subscriptionApi.getTransactions(token!),
    enabled: !!token,
  });
}

export function useCancelSubscription(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.cancel(token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
