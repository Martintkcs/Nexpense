import { supabase } from './client';
import { InsertDto, UpdateDto } from '@/types/database';

type ImpulseInsert = InsertDto<'impulse_items'>;
type ImpulseUpdate = UpdateDto<'impulse_items'>;

export async function fetchImpulseItems(userId: string) {
  const { data, error } = await supabase
    .from('impulse_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createImpulseItem(item: ImpulseInsert) {
  const { data, error } = await supabase
    .from('impulse_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateImpulseDecision(
  id: string,
  decision: 'purchased' | 'skipped',
) {
  const { data, error } = await supabase
    .from('impulse_items')
    .update({ decision, decided_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateImpulseItem(id: string, updates: ImpulseUpdate) {
  const { data, error } = await supabase
    .from('impulse_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
