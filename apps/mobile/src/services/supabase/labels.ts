import { supabase } from './client';
import { Database } from '@/types/database';

type Label = Database['public']['Tables']['tags']['Row'];

export async function fetchLabels(userId: string): Promise<Label[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function createLabel(params: {
  userId: string;
  name: string;
  color?: string;
}): Promise<Label> {
  const { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: params.userId,
      name: params.name,
      color: params.color ?? '#4F46E5',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLabel(
  id: string,
  params: { name?: string; color?: string },
): Promise<Label> {
  const { data, error } = await supabase
    .from('tags')
    .update(params)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
