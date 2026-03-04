import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExpenses,
  fetchMonthlyExpenses,
  fetchAllTimeBalance,
  createExpense,
  updateExpense as updateExpenseService,
  softDeleteExpense,
} from '@/services/supabase/expenses';
import { useAuth } from '@/providers/AuthProvider';
import { useSettingsStore } from '@/stores/settingsStore';
import { Database } from '@/types/database';

type NewExpense = Database['public']['Tables']['expenses']['Insert'];

export function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: () => fetchExpenses(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const addMutation = useMutation({
    mutationFn: (expense: NewExpense) => createExpense(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NewExpense> }) =>
      updateExpenseService(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteExpense(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', user?.id] });
      const previous = queryClient.getQueryData<NewExpense[]>(['expenses', user?.id]);
      queryClient.setQueryData(['expenses', user?.id], (old: any[]) =>
        old?.filter(e => e.id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['expenses', user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    addExpense: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateExpense: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteExpense: deleteMutation.mutateAsync,
  };
}

export function useMonthlyExpenses(year: number, month: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly', user?.id, year, month],
    queryFn: () => fetchMonthlyExpenses(user!.id, year, month),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

/** Valós idejű egyenleg = kezdő egyenleg + összes bevétel − összes kiadás */
export function useBalance() {
  const { user } = useAuth();
  const { startingBalance } = useSettingsStore();

  const query = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: () => fetchAllTimeBalance(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const { income = 0, expense = 0 } = query.data ?? {};
  const balance = startingBalance + income - expense;

  return {
    balance,
    totalIncome: income,
    totalExpense: expense,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
