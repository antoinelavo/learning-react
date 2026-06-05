'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({
  user: null,
  role: null,
  teacherStatus: null,
  teacherId: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [teacherStatus, setTeacherStatus] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(supabaseUser) {
    if (!supabaseUser) {
      setUser(null);
      setRole(null);
      setTeacherStatus(null);
      setTeacherId(null);
      setLoading(false);
      return;
    }

    setUser(supabaseUser);

    // Fetch role from users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', supabaseUser.id)
      .single();

    const userRole = userData?.role ?? null;
    setRole(userRole);

    // Fetch teacher info if applicable
    if (userRole === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, status')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      setTeacherStatus(teacher?.status ?? null);
      setTeacherId(teacher?.id ?? null);
    } else {
      setTeacherStatus(null);
      setTeacherId(null);
    }

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

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        teacherStatus,
        teacherId,
        loading,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
