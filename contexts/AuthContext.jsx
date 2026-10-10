'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({
  user: null,
  role: null,
  username: null,
  teacherStatus: null,
  teacherId: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [teacherStatus, setTeacherStatus] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(supabaseUser) {
    if (!supabaseUser) {
      setUser(null);
      setRole(null);
      setUsername(null);
      setTeacherStatus(null);
      setTeacherId(null);
      setLoading(false);
      return;
    }

    setUser(supabaseUser);

    // Fetch role/username and teacher info in parallel
    const [{ data: userData }, { data: teacher }] = await Promise.all([
      supabase
        .from('users')
        .select('role, username')
        .eq('id', supabaseUser.id)
        .single(),
      supabase
        .from('teachers')
        .select('id, status')
        .eq('user_id', supabaseUser.id)
        .maybeSingle(),
    ]);

    const userRole = userData?.role ?? null;
    setRole(userRole);
    setUsername(userData?.username ?? null);
    setTeacherStatus(teacher?.status ?? null);
    setTeacherId(teacher?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // Initial load
    supabase.auth.getUser().then(({ data: { user } }) => {
      loadProfile(user);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadProfile(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will clear state
  };

  // Re-runs the profile fetch for the current user — call after an action
  // that changes profile data server-side (e.g. setting a username) so
  // context state picks it up without a full page reload.
  const refreshProfile = async () => {
    await loadProfile(user);
  };

  // Always render children immediately — auth loading only affects
  // components that check the `loading` flag (header, nav).
  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        username,
        teacherStatus,
        teacherId,
        loading,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
