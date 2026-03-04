import { supabase } from './client';
import type { Database } from '@/types/database';

type Template = Database['public']['Tables']['expense_templates']['Row'];

export async function fetchTemplates(userId: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from('expense_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createTemplate(params: {
  userId: string;
  name: string;
  description?: string | null;
  categoryId: string | null;
  labelIds: string[];
}): Promise<Template> {
  const { data, error } = await supabase
    .from('expense_templates')
    .insert({
      user_id: params.userId,
      name: params.name,
      description: params.description ?? null,
      category_id: params.categoryId,
      label_ids: params.labelIds,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplate(
  id: string,
  params: { name?: string; description?: string | null; categoryId?: string | null; labelIds?: string[] },
): Promise<Template> {
  const updates = {
    ...(params.name !== undefined && { name: params.name }),
    ...(params.description !== undefined && { description: params.description }),
    ...(params.categoryId !== undefined && { category_id: params.categoryId }),
    ...(params.labelIds !== undefined && { label_ids: params.labelIds }),
  };

  const { data, error } = await supabase
    .from('expense_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('expense_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
