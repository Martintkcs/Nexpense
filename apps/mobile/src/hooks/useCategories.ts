import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/services/supabase/categories';
import { useAuth } from '@/providers/AuthProvider';
import { SYSTEM_CATEGORIES } from '@/lib/constants';

export function useCategories() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => fetchCategories(user?.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 min – categories change rarely
  });

  // Fall back to local constants while loading (for instant UI)
  const fallbackCategories = SYSTEM_CATEGORIES.map((c, i) => ({
    id: c.id,
    user_id: null,
    name: c.name,
    name_hu: c.name_hu,
    icon: c.icon,
    color: c.color,
    is_system: true,
    is_active: true,
    sort_order: i,
    created_at: new Date().toISOString(),
  }));

  // Ha a DB üres tömböt ad vissza (seed nem futott), akkor is a fallback-et használjuk
  const categories = query.data?.length ? query.data : fallbackCategories;

  return {
    categories,
    isLoading: query.isLoading,
    error: query.error,
  };
}
