import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchImpulseItems,
  createImpulseItem,
  updateImpulseDecision,
} from '@/services/supabase/impulse';
import { useAuth } from '@/providers/AuthProvider';
import { InsertDto, ImpulseItem } from '@/types/database';

type NewImpulse = InsertDto<'impulse_items'>;

export function useImpulseItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['impulse', user?.id],
    queryFn: () => fetchImpulseItems(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const addMutation = useMutation({
    mutationFn: (item: NewImpulse) => createImpulseItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impulse'] });
    },
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'purchased' | 'skipped' }) =>
      updateImpulseDecision(id, decision),
    // Optimistic update: döntés azonnal megjelenik a UI-ban
    onMutate: async ({ id, decision }) => {
      await queryClient.cancelQueries({ queryKey: ['impulse', user?.id] });
      const previous = queryClient.getQueryData<ImpulseItem[]>(['impulse', user?.id]);
      queryClient.setQueryData(['impulse', user?.id], (old: ImpulseItem[] | undefined) =>
        old?.map(item =>
          item.id === id
            ? { ...item, decision, decided_at: new Date().toISOString() }
            : item,
        ) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['impulse', user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['impulse'] });
    },
  });

  const items = query.data ?? [];
  const pending = items.filter(i => i.decision === 'pending');
  const history = items.filter(i => i.decision !== 'pending');
  const savedAmount = items
    .filter(i => i.decision === 'skipped')
    .reduce((s, i) => s + i.price, 0);

  return {
    items,
    pending,
    history,
    savedAmount,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    addItem: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    makeDecision: decideMutation.mutateAsync,
    isDeciding: decideMutation.isPending,
  };
}
