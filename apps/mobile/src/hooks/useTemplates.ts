import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  fetchTemplates,
  createTemplate,
  updateTemplate as updateTemplateService,
  deleteTemplate as deleteTemplateService,
} from '@/services/supabase/templates';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  labelIds: string[];
}

function mapTemplate(template: Awaited<ReturnType<typeof fetchTemplates>>[number]): Template {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    categoryId: template.category_id,
    labelIds: template.label_ids,
  };
}

export function useTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['templates', user?.id],
    queryFn: () => fetchTemplates(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const addMutation = useMutation({
    mutationFn: (params: { name: string; description?: string | null; categoryId: string | null; labelIds: string[] }) =>
      createTemplate({ userId: user!.id, ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...params }: { id: string; name?: string; description?: string | null; categoryId?: string | null; labelIds?: string[] }) =>
      updateTemplateService(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTemplateService(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  return {
    templates: (query.data ?? []).map(mapTemplate),
    isLoading: query.isLoading,
    error: query.error,
    addTemplate: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateTemplate: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTemplate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
