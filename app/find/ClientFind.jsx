'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RoleSelectModal from './RoleSelectModal';

export default function ClientFind({ children }) {
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId]   = useState(null);

  useEffect(() => {
    (async () => {
      // 1) Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Not logged in → no modal
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      // 2) Fetch the user's role
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        alert('유저 역할 조회 중 오류: ' + error.message);
        return;
      }

      // 3) If no role assigned, show the modal
      if (!userData?.role) {
        setShowModal(true);
      }
    })();
  }, []);

  // Called when the user picks a role
  const handleRoleSubmit = async (role) => {
    if (!userId) return;

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      alert('역할 저장 중 오류: ' + error.message);
      return;
    }

    setShowModal(false);
  };

  return (
    <>
      {showModal && <RoleSelectModal onSubmit={handleRoleSubmit} />}
      {children}
    </>
  );
}
