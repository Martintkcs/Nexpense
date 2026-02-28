// Ez a fájl manuálisan karbantartott – ideális esetben Supabase CLI-vel generálható:
// npx supabase gen types typescript --project-id <YOUR_PROJECT_REF> > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          currency: string;
          locale: string;
          hourly_wage: number | null;
          wage_currency: string | null;
          spending_profile: Json | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          locale?: string;
          hourly_wage?: number | null;
          wage_currency?: string | null;
          spending_profile?: Json | null;
          onboarding_completed_at?: string | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          locale?: string;
          hourly_wage?: number | null;
          wage_currency?: string | null;
          spending_profile?: Json | null;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          currency: string;
          description: string | null;
          note: string | null;
          expense_date: string;
          expense_time: string | null;
          location_name: string | null;
          location_lat: number | null;
          location_lng: number | null;
          source: 'manual' | 'apple_pay' | 'suggestion';
          apple_pay_transaction_id: string | null;
          is_deleted: boolean;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          currency?: string;
          description?: string | null;
          note?: string | null;
          expense_date: string;
          expense_time?: string | null;
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          source?: 'manual' | 'apple_pay' | 'suggestion';
          apple_pay_transaction_id?: string | null;
          is_deleted?: boolean;
          metadata?: Json | null;
        };
        Update: {
          category_id?: string | null;
          amount?: number;
          currency?: string;
          description?: string | null;
          note?: string | null;
          expense_date?: string;
          expense_time?: string | null;
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          source?: 'manual' | 'apple_pay' | 'suggestion';
          is_deleted?: boolean;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          name_hu: string | null;
          icon: string;
          color: string;
          is_system: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          name_hu?: string | null;
          icon: string;
          color: string;
          is_system?: boolean;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          name_hu?: string | null;
          icon?: string;
          color?: string;
          is_system?: boolean;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
        };
        Update: {
          name?: string;
          color?: string | null;
        };
        Relationships: [];
      };
      impulse_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          price: number;
          currency: string;
          url: string | null;
          image_url: string | null;
          store_name: string | null;
          reason: string | null;
          category_id: string | null;
          hours_to_earn: number | null;
          saved_at: string;
          notify_at: string;
          notification_sent: boolean;
          decision: 'purchased' | 'skipped' | 'pending';
          decided_at: string | null;
          converted_expense_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          price: number;
          currency?: string;
          url?: string | null;
          image_url?: string | null;
          store_name?: string | null;
          reason?: string | null;
          category_id?: string | null;
          hours_to_earn?: number | null;
          saved_at?: string;
          notify_at: string;
          notification_sent?: boolean;
          decision?: 'purchased' | 'skipped' | 'pending';
          decided_at?: string | null;
          converted_expense_id?: string | null;
        };
        Update: {
          name?: string;
          price?: number;
          url?: string | null;
          store_name?: string | null;
          reason?: string | null;
          decision?: 'purchased' | 'skipped' | 'pending';
          decided_at?: string | null;
          notification_sent?: boolean;
          converted_expense_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_monthly_summary: {
        Args: { user_id: string; year: number; month: number };
        Returns: { total_amount: number; transaction_count: number; top_category_id: string };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Kényelmes helper típusok
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Expense = Tables<'expenses'>;
export type Category = Tables<'categories'>;
export type Profile = Tables<'profiles'>;
export type ImpulseItem = Tables<'impulse_items'>;
