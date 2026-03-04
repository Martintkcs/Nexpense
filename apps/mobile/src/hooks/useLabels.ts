import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLabels, createLabel, updateLabel, deleteLabel } from '@/services/supabase/labels';
import { useAuth } from '@/providers/AuthProvider';

export function useLabels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['labels', user?.id],
    queryFn: () => fetchLabels(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
  });

  const addMutation = useMutation({
    mutationFn: (params: { name: string; color?: string }) =>
      createLabel({ userId: user!.id, ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labels'] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...params }: { id: string; name?: string; color?: string }) =>
      updateLabel(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labels'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteLabel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labels'] }),
  });

  return {
    labels: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addLabel: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    editLabel: editMutation.mutateAsync,
    isEditing: editMutation.isPending,
    removeLabel: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
