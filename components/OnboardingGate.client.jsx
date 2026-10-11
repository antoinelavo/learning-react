'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button, Input, Notice, choiceClasses } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Site-wide: a logged-in user missing a role or username (OAuth sign-ups
// get neither) must pick them before using the site. Replaces the old
// /find-only role modal.

const ROLES = [
  { value: 'student', label: '학생 · 학부모', hint: '선생님과 학원을 찾고 있어요' },
  { value: 'teacher', label: '선생님', hint: '학생을 찾고 수업을 하고 싶어요' },
];

// Same rule as the email signup form and /api/community/username.
const USERNAME_REGEX = /^[a-zA-Z0-9가-힣_]{2,20}$/;

// Auth flow pages where the modal would get in the way.
const SKIP_PATHS = ['/auth/callback', '/login', '/signup', '/logout', '/forgot-password', '/reset-password'];

function OnboardingModal({ user, needsRole, needsUsername, onDone }) {
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = (!needsRole || role) && (!needsUsername || username.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const name = username.trim();
    if (needsUsername && !USERNAME_REGEX.test(name)) {
      setError('닉네임은 한글/영문/숫자/_ 를 사용해 2~20자로 입력해주세요.');
      return;
    }

    const updates = {};
    if (needsRole) updates.role = role;
    if (needsUsername) updates.username = name;

    setSaving(true);
    try {
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select('id');
      if (updateError) throw updateError;

      // Older accounts may have no users row yet.
      if (!data?.length) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({ id: user.id, email: user.email, ...updates });
        if (insertError) throw insertError;
      }
      await onDone();
    } catch (err) {
      setError(err?.code === '23505' ? '이미 사용 중인 닉네임입니다.' : '저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4"
      >
        <div>
          <h2 id="onboarding-title" className="text-base font-bold text-gray-900 m-0">회원 정보 설정</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">IB Master를 이용하려면 아래 정보를 설정해주세요.</p>
        </div>

        {needsRole && (
          <fieldset className="space-y-2 m-0 p-0 border-0">
            <legend className="text-sm font-medium text-gray-700 mb-2">회원 유형</legend>
            {ROLES.map(r => (
              <label key={r.value} className={choiceClasses({ selected: role === r.value, className: 'flex items-start gap-2 cursor-pointer' })}>
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{r.label}</span>
                  <span className="block text-xs text-gray-500">{r.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {needsUsername && (
          <div>
            <label htmlFor="onboarding-username" className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
            <Input
              id="onboarding-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="한글/영문/숫자/_ 2~20자"
              maxLength={20}
              autoComplete="nickname"
            />
          </div>
        )}

        {error && <Notice color="red" compact>{error}</Notice>}

        <Button type="submit" fullWidth disabled={!canSubmit || saving}>
          {saving ? '저장 중...' : '시작하기'}
        </Button>
      </form>
    </div>
  );
}

export default function OnboardingGate() {
  const { user, role, username, profileLoaded, loading, refreshProfile } = useAuth();
  const pathname = usePathname();

  if (loading || !user || !profileLoaded || SKIP_PATHS.some(p => pathname?.startsWith(p))) return null;

  const needsRole = !role;
  const needsUsername = !username;
  if (!needsRole && !needsUsername) return null;

  return (
    <OnboardingModal
      key={user.id}
      user={user}
      needsRole={needsRole}
      needsUsername={needsUsername}
      onDone={refreshProfile}
    />
  );
}
