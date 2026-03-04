import { supabase } from './client';
import { Database } from '@/types/database';

type Category = Database['public']['Tables']['categories']['Row'];

export async function createCategory(params: {
  userId: string;
  name: string;
  nameHu: string;
  icon: string;
  color: string;
}): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: params.userId,
      name: params.name,
      name_hu: params.nameHu,
      icon: params.icon,
      color: params.color,
      is_system: false,
      is_active: true,
      sort_order: 999,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  params: { name?: string; nameHu?: string; icon?: string; color?: string },
): Promise<Category> {
  const updates = {
    ...(params.name     !== undefined && { name:    params.name }),
    ...(params.nameHu   !== undefined && { name_hu: params.nameHu }),
    ...(params.icon     !== undefined && { icon:    params.icon }),
    ...(params.color    !== undefined && { color:   params.color }),
  };

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  // Soft-delete so existing expense FK references remain intact
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchCategories(userId?: string): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  // System categories (user_id IS NULL) + user's own categories
  if (userId) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    query = query.is('user_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
