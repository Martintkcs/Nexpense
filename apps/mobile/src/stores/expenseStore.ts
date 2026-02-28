import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/database';

type Expense = Database['public']['Tables']['expenses']['Row'];
type NewExpense = Database['public']['Tables']['expenses']['Insert'];

interface PendingMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  payload: Partial<Expense>;
  createdAt: string;
}

interface ExpenseState {
  expenses: Expense[];
  pendingMutations: PendingMutation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: NewExpense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  syncPending: () => Promise<void>;
  clearError: () => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      pendingMutations: [],
      isLoading: false,
      error: null,

      setExpenses: (expenses) => set({ expenses }),

      addExpense: (newExpense) => {
        const optimisticExpense: Expense = {
          ...newExpense,
          id: `temp-${Date.now()}`,
          is_deleted: false,
          source: newExpense.source || 'manual',
          apple_pay_transaction_id: null,
          metadata: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Expense;

        set(state => ({
          expenses: [optimisticExpense, ...state.expenses],
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: optimisticExpense.id,
              type: 'create',
              payload: newExpense,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      updateExpense: (id, updates) => {
        set(state => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e),
          pendingMutations: [
            ...state.pendingMutations,
            { id, type: 'update', payload: updates, createdAt: new Date().toISOString() },
          ],
        }));
      },

      deleteExpense: (id) => {
        set(state => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, is_deleted: true } : e),
          pendingMutations: [
            ...state.pendingMutations,
            { id, type: 'delete', payload: {}, createdAt: new Date().toISOString() },
          ],
        }));
      },

      syncPending: async () => {
        // TODO: Implement sync with Supabase when online
        // const { supabase } = await import('@/services/supabase/client');
        // const pending = get().pendingMutations;
        // for (const mutation of pending) { ... }
        console.log('Sync pending mutations...', get().pendingMutations.length);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'nexpense-expenses',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        expenses: state.expenses,
        pendingMutations: state.pendingMutations,
      }),
    }
  )
);
