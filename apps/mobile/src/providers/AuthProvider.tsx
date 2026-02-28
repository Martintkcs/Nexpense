import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router, useSegments } from 'expo-router';
// import { supabase } from '@/services/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    // TODO: Supabase auth session listener
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setSession(session);
    //   setIsLoading(false);
    // });
    // const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    //   setSession(session);
    // });
    // return () => subscription.unsubscribe();

    // Ideiglenesen: rögtön bejelentkezettnek vesszük fejlesztés közben
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    // if (!session && !inAuthGroup) router.replace('/(auth)/welcome');
    // if (session && inAuthGroup) router.replace('/(tabs)');
  }, [session, isLoading, segments]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
