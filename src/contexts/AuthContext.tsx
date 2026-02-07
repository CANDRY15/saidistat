import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Only update state if the user identity actually changed
  const updateAuthState = useCallback((newSession: Session | null) => {
    if (!isMountedRef.current) return;
    
    const newUserId = newSession?.user?.id ?? null;
    
    // Skip update if user hasn't changed (prevents re-render loops from token refreshes)
    if (newUserId === currentUserIdRef.current) return;
    
    currentUserIdRef.current = newUserId;
    setSession(newSession);
    setUser(newSession?.user ?? null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Set up auth state listener FIRST
    // Only react to SIGNED_IN, SIGNED_OUT, and USER_UPDATED events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMountedRef.current) return;

        // Ignore TOKEN_REFRESHED events - they don't change the user
        if (event === 'TOKEN_REFRESHED') return;

        // For SIGNED_OUT, force clear state
        if (event === 'SIGNED_OUT') {
          currentUserIdRef.current = null;
          setSession(null);
          setUser(null);
          return;
        }

        // For other events (SIGNED_IN, USER_UPDATED), deduplicate
        updateAuthState(newSession);
      }
    );

    // INITIAL load - fetch session once
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;

        currentUserIdRef.current = currentSession?.user?.id ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
