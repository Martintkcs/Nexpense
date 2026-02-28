import { supabase } from './client';
import { Database } from '@/types/database';

type Category = Database['public']['Tables']['categories']['Row'];

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
