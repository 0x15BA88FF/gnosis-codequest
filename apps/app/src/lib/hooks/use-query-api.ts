import { useMutation } from '@tanstack/react-query';
import { queryApi } from '@/lib/api-client';
import type { QueryRequest } from '@/lib/api-types';

export function useAskQuery(token: string | null) {
  return useMutation({
    mutationFn: (data: QueryRequest) => queryApi.ask(token!, data),
  });
}
