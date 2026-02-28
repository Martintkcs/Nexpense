import { supabase } from './client';
import { Database } from '@/types/database';

type Expense = Database['public']['Tables']['expenses']['Row'];
type NewExpense = Database['public']['Tables']['expenses']['Insert'];

export async function fetchExpenses(userId: string, limit = 100): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function fetchMonthlyExpenses(
  userId: string,
  year: number,
  month: number,
): Promise<Expense[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  // Use getDate() — avoids UTC conversion shifting the day in UTC+ timezones
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .gte('expense_date', from)
    .lte('expense_date', to)
    .order('expense_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createExpense(expense: NewExpense): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, updates: Partial<NewExpense>): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function softDeleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw error;
}
