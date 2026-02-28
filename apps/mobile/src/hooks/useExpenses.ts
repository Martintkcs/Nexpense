import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExpenses,
  fetchMonthlyExpenses,
  createExpense,
  softDeleteExpense,
} from '@/services/supabase/expenses';
import { useAuth } from '@/providers/AuthProvider';
import { Database } from '@/types/database';

type NewExpense = Database['public']['Tables']['expenses']['Insert'];

export function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: () => fetchExpenses(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const addMutation = useMutation({
    mutationFn: (expense: NewExpense) => createExpense(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });
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
