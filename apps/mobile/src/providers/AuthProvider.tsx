import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router, useSegments } from 'expo-router';
import { supabase } from '@/services/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  // Delayed redirect ref — prevents race condition after sign-up when
  // onAuthStateChange fires slightly after segments change to /(tabs)
  const welcomeRedirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[1] === 'onboarding';

    // Cancel any pending welcome redirect (e.g. session arrived in time)
    if (welcomeRedirectTimer.current) {
      clearTimeout(welcomeRedirectTimer.current);
      welcomeRedirectTimer.current = null;
    }

    if (!session && !inAuthGroup) {
      // Delay before redirecting to welcome — gives onAuthStateChange
      // up to 400 ms to deliver the session after sign-up → onboarding → tabs
      welcomeRedirectTimer.current = setTimeout(() => {
        router.replace('/(auth)/welcome');
      }, 400);
    } else if (session && inAuthGroup && !inOnboarding) {
      router.replace('/(tabs)');
    }

    return () => {
      if (welcomeRedirectTimer.current) clearTimeout(welcomeRedirectTimer.current);
    };
  }, [session, isLoading, segments]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
