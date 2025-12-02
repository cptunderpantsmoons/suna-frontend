'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

// User role type for admin functionality
export type UserRole = 'user' | 'admin';

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  // Admin role functionality
  userRole: UserRole;
  isAdmin: boolean;
  refreshUserRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('user');

// PostgreSQL error code for "no rows returned" from PostgREST
const POSTGRES_NOT_FOUND_ERROR = 'PGRST116';

  // Function to fetch user role from database
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no role record exists, user is a regular user
        if (error.code === POSTGRES_NOT_FOUND_ERROR) {
          return 'user';
        }
        console.error('Error fetching user role:', error);
        return 'user';
      }

      return (data?.role as UserRole) || 'user';
    } catch (err) {
      console.error('Error fetching user role:', err);
      return 'user';
    }
  }, [supabase]);

  // Refresh user role function
  const refreshUserRole = useCallback(async () => {
    if (user?.id) {
      const role = await fetchUserRole(user.id);
      setUserRole(role);
    }
  }, [user?.id, fetchUserRole]);

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Fetch user role if user is logged in
      if (currentSession?.user?.id) {
        const role = await fetchUserRole(currentSession.user.id);
        setUserRole(role);
      }
      
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Update user role when auth state changes
        if (newSession?.user?.id) {
          const role = await fetchUserRole(newSession.user.id);
          setUserRole(role);
        } else {
          setUserRole('user');
        }
        
        // No need to set loading state here as initial load is done
        // and subsequent changes shouldn't show a loading state for the whole app
        if (isLoading) setIsLoading(false);
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, isLoading, fetchUserRole]); // Added isLoading to dependencies to ensure it runs once after initial load completes

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole('user');
    // State updates will be handled by onAuthStateChange
  };

  const value = {
    supabase,
    session,
    user,
    isLoading,
    signOut,
    userRole,
    isAdmin: userRole === 'admin',
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
