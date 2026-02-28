// Ez a fájl automatikusan generálható a Supabase CLI-vel:
// npx supabase gen types typescript --project-id <YOUR_PROJECT_REF> > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tags']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['impulse_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['impulse_items']['Insert']>;
      };
    };
    Views: {};
    Functions: {
      get_monthly_summary: {
        Args: { user_id: string; year: number; month: number };
        Returns: { total_amount: number; transaction_count: number; top_category_id: string };
      };
    };
    Enums: {};
  };
}
