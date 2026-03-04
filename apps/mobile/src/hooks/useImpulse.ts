import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchImpulseItems,
  createImpulseItem,
  updateImpulseDecision,
  updateImpulseItem,
} from '@/services/supabase/impulse';
import { createExpense } from '@/services/supabase/expenses';
import { useAuth } from '@/providers/AuthProvider';
import { InsertDto, UpdateDto, ImpulseItem } from '@/types/database';
import { CAT_IDS } from '@/lib/constants';

type NewImpulse = InsertDto<'impulse_items'>;
type EditImpulse = { id: string; updates: UpdateDto<'impulse_items'> };

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

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: EditImpulse) => updateImpulseItem(id, updates),
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
    onSuccess: async (_data, { id, decision }) => {
      // Ha "Megvettem" → automatikusan kerüljön be a kiadások közé
      if (decision === 'purchased' && user) {
        const items = queryClient.getQueryData<ImpulseItem[]>(['impulse', user.id]);
        const item = items?.find(i => i.id === id);
        if (item) {
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

          // Cimkék betöltése AsyncStorage-ból
          let labelIds: string[] = [];
          try {
            const stored = await AsyncStorage.getItem(`impulse_labels_${id}`);
            if (stored) labelIds = JSON.parse(stored);
          } catch {}

          await createExpense({
            user_id: user.id,
            amount: item.price,
            category_id: item.category_id ?? CAT_IDS.shopping,
            description: item.name,
            note: item.name,
            expense_date: today,
            currency: (item.currency as string) ?? 'HUF',
            is_deleted: false,
            ...(labelIds.length > 0 ? { metadata: { label_ids: labelIds } } : {}),
          }).catch(err => {
            console.warn('[Impulse] Kiadás létrehozása sikertelen:', err);
          });

          // AsyncStorage takarítás
          await AsyncStorage.removeItem(`impulse_labels_${id}`).catch(() => {});

          // Dashboard + kiadáslista frissítése
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['monthly'] });
        }
      } else if (decision === 'skipped') {
        // AsyncStorage takarítás kihagyott tételeknél is
        await AsyncStorage.removeItem(`impulse_labels_${id}`).catch(() => {});
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
    editItem: editMutation.mutateAsync,
    isEditing: editMutation.isPending,
    makeDecision: decideMutation.mutateAsync,
    isDeciding: decideMutation.isPending,
  };
}
