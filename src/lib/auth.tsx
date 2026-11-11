import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  recovery: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(s);
      setSessionReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const loadProfile = useCallback(async (id: string | null) => {
    if (!id) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    setProfile((data as Profile) ?? null);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    loadProfile(userId);
  }, [userId, loadProfile]);

  const value: AuthState = {
    session,
    profile,
    loading: !sessionReady || (userId !== null && profileLoading && profile === null),
    recovery,
    refreshProfile: () => loadProfile(userId),
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth va usato dentro AuthProvider');
  return ctx;
}

export function isMember(profile: Profile | null): boolean {
  return !!profile && (profile.status === 'active' || profile.is_admin);
}
