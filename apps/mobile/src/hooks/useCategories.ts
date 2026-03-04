import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCategories, createCategory, updateCategory, deleteCategory as deleteCategoryService } from '@/services/supabase/categories';
import { useAuth } from '@/providers/AuthProvider';
import { SYSTEM_CATEGORIES } from '@/lib/constants';

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => fetchCategories(user?.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
  });

  const fallbackCategories = SYSTEM_CATEGORIES.map((c, i) => ({
    id: c.id,
    user_id: null,
    name: c.name,
    name_hu: c.name_hu,
    icon: c.icon,
    color: c.color,
    is_system: true,
    is_active: true,
    sort_order: i,
    created_at: new Date().toISOString(),
  }));

  const categories = query.data?.length ? query.data : fallbackCategories;

  const addMutation = useMutation({
    mutationFn: (params: { name: string; nameHu: string; icon: string; color: string }) =>
      createCategory({ userId: user!.id, ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...params }: { id: string; name?: string; nameHu?: string; icon?: string; color?: string }) =>
      updateCategory(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryService(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  return {
    categories,
    isLoading: query.isLoading,
    error: query.error,
    addCategory: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateCategory: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCategory: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
