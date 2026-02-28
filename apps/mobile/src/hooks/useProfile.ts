import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { fetchProfile, updateProfile } from '@/services/supabase/profiles';
import { useSettingsStore } from '@/stores/settingsStore';
import { useEffect } from 'react';
import type { UpdateDto } from '@/types/database';

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setCurrency, setHourlyWage } = useSettingsStore();

  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Sync profile values into the local settings store once loaded
  useEffect(() => {
    if (query.data) {
      if (query.data.currency) setCurrency(query.data.currency);
      if (query.data.hourly_wage != null) setHourlyWage(query.data.hourly_wage);
    }
  }, [query.data]);

  const updateMutation = useMutation({
    mutationFn: (updates: UpdateDto<'profiles'>) => updateProfile(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
