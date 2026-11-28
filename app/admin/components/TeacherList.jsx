'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Tabs, cardClasses, Badge } from '@/components/ui';
import { authFetch } from '@/lib/authFetch';
import { findDuplicates, SIGNAL_LABELS } from '@/lib/teacherDuplicates';
import { teacherProfilePath } from '@/lib/teacherProfile';

const batchSize = 10;

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

export default function TeacherList() {
  // Every teacher (any status), so duplicates can be matched against
  // approved and rejected profiles too. Pending ones are shown as cards.
  const [allTeachers, setAllTeachers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    async function loadTeachers() {
      // Page through the results: one response is capped (about 1000 rows),
      // and a silent cap would hide duplicates.
      const pageSize = 1000;
      let data = [];
      let error = null;
      for (let from = 0; ; from += pageSize) {
        const page = await supabase
          .rpc('admin_list_teachers', { p_status: null })
          .range(from, from + pageSize - 1);
        if (page.error) {
          error = page.error;
          break;
        }
        data = data.concat(page.data || []);
        if (!page.data || page.data.length < pageSize) break;
      }

      if (!error && data) {
        // Look up each teacher's login email so we can flag ones missing
        // an email (the approval notification email can't reach them).
        const userIds = Array.from(
          new Set(data.filter((t) => t.status === 'pending' || t.status === 'rejected').map((t) => t.user_id).filter(Boolean))
        );
        let emailByUserId = {};
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email')
            .in('id', userIds);
          if (!usersError && users) {
            emailByUserId = Object.fromEntries(users.map((u) => [u.id, u.email]));
          }
        }

        setAllTeachers(data.map((t) => ({ ...t, loginEmail: emailByUserId[t.user_id] || null })));
        setCurrentIndex(0);
      }
    }

    loadTeachers();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function setStatusLocal(id, status) {
    setAllTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function approveTeacher(id) {
    const duplicates = duplicatesById[id] || [];
    if (
      duplicates.length > 0 &&
      !window.confirm('중복으로 의심되는 프로필이 있습니다. 그래도 승인할까요?')
    ) {
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('teachers')
      .update({ status: 'approved', last_updated: today })
      .eq('id', id);

    if (!error) {
      setStatusLocal(id, 'approved');

      // Best-effort notification email — must never block/undo the
      // approval itself if this fails (e.g. teacher has no email on file).
      try {
        await authFetch('/api/teachers/notify-approved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacherId: id }),
        });
      } catch (notifyError) {
        console.error('승인 알림 이메일 전송 실패:', notifyError);
      }
    } else {
      alert('❌ 승인 중 오류가 발생했습니다.');
      console.error(error);
    }
  }

  async function rejectTeacher(id) {
    if (!window.confirm('이 프로필을 반려할까요? (이메일은 발송되지 않습니다)')) return;
    const { data, error } = await supabase
      .from('teachers')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select('id');
    if (error || !data || data.length === 0) {
      alert('❌ 반려 중 오류가 발생했습니다.');
      console.error(error);
      return;
    }
    setStatusLocal(id, 'rejected');
  }

  async function restoreTeacher(id) {
    const { data, error } = await supabase
      .from('teachers')
      .update({ status: 'pending' })
      .eq('id', id)
      .select('id');
    if (error || !data || data.length === 0) {
      alert('❌ 되돌리기 중 오류가 발생했습니다.');
      console.error(error);
      return;
    }
    setStatusLocal(id, 'pending');
  }

  function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
      setCurrentIndex((prev) => prev + batchSize);
    }
  }

  const teachers = useMemo(() => allTeachers.filter((t) => t.status === 'pending'), [allTeachers]);
  const rejectedTeachers = useMemo(() => allTeachers.filter((t) => t.status === 'rejected'), [allTeachers]);

  // Possible duplicates for every pending and rejected profile, by id.
  const duplicatesById = useMemo(() => {
    const result = {};
    for (const t of allTeachers) {
      if (t.status === 'pending' || t.status === 'rejected') {
        result[t.id] = findDuplicates(t, allTeachers);
      }
    }
    return result;
  }, [allTeachers]);

  const now = Date.now();
  const recentTeachers = teachers.filter(t => {
    const created = new Date(t.created_date).getTime();
    return now - created < THREE_WEEKS_MS;
  });
  const olderTeachers = teachers.filter(t => {
    const created = new Date(t.created_date).getTime();
    return now - created >= THREE_WEEKS_MS;
  });

  const filteredTeachers =
    activeTab === 'recent' ? recentTeachers : activeTab === 'older' ? olderTeachers : rejectedTeachers;
  const visibleTeachers = filteredTeachers.slice(0, currentIndex + batchSize);

  return (
    <div className="max-w-xl mx-auto mt-6 space-y-6">
      <div className="text-sm font-medium text-gray-600">대기 중인 프로필: {teachers.length}개</div>

      <Tabs
        value={activeTab}
        onChange={(tab) => { setActiveTab(tab); setCurrentIndex(0); }}
        tabs={[
          { value: 'recent', label: `3주 미만 (${recentTeachers.length})` },
          { value: 'older', label: `3주 이상 (${olderTeachers.length})` },
          { value: 'rejected', label: `반려됨 (${rejectedTeachers.length})` },
        ]}
      />

      {visibleTeachers.map((teacher) => {
        const profilePicture =
          teacher.profile_picture || 'https://ibmaster.antoinelavo.com/teachers/default.jpg';
        const truncatedSchool = teacher.school?.slice(0, 20) + (teacher.school?.length > 20 ? '...' : '');
        const profileURL = teacherProfilePath(teacher);

        return (
          <div key={teacher.id} className={cardClasses({ className: 'p-4 space-y-2' })}>
            <a href={profileURL} target="_blank" className="flex gap-4 items-center">
              <img
                src={profilePicture}
                alt="Profile"
                width={80}
                className="rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{teacher.name}</span>
                  {!teacher.loginEmail && (
                    <Badge color="red" title="이메일 정보가 없어 승인 알림을 보낼 수 없습니다.">
                      ⚠️ 이메일 없음
                    </Badge>
                  )}
                </div>
                <div className="text-gray-500 text-sm">{truncatedSchool}</div>
                <div className="text-sm mt-1">{teacher.shortintroduction}</div>
              </div>
            </a>
            <div className="text-sm text-gray-700">
              <strong>가입 이메일:</strong>{' '}
              {teacher.loginEmail ? (
                <span className="text-gray-700">{teacher.loginEmail}</span>
              ) : (
                <span className="text-red-600 font-medium">없음 (승인 알림 발송 불가)</span>
              )}
              <br />
              <strong>추가 과목:</strong> {teacher.extra_subject || '없음'}<br />
              <strong>연락처:</strong> {teacher.contact_information || '없음'}<br />
              <strong>가입일:</strong> {teacher.created_date ? (() => {
                const date = new Date(teacher.created_date);
                const dateStr = date.toISOString().split('T')[0];
                const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                const timeAgo = days === 0 ? '오늘' : days < 7 ? `${days}일 전` : `${Math.floor(days / 7)}주 전`;
                return `${dateStr} (${timeAgo})`;
              })() : '없음'}
            </div>
            {(duplicatesById[teacher.id] || []).length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm space-y-1">
                <Badge color="red">⚠️ 중복 의심</Badge>
                {duplicatesById[teacher.id].map((match) => (
                  <div key={match.id} className="text-gray-700">
                    {match.status === 'approved' && teacherProfilePath(match) ? (
                      <a
                        href={teacherProfilePath(match)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {match.name}
                      </a>
                    ) : (
                      <span className="font-medium">{match.name}</span>
                    )}{' '}
                    ({match.status}) — {match.signals.map((sig) => SIGNAL_LABELS[sig]).join(', ')}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              {teacher.status === 'rejected' ? (
                <Button onClick={() => restoreTeacher(teacher.id)} size="sm" variant="secondary">
                  되돌리기
                </Button>
              ) : (
                <>
                  <Button onClick={() => approveTeacher(teacher.id)} size="sm">
                    승인
                  </Button>
                  <Button onClick={() => rejectTeacher(teacher.id)} size="sm" variant="secondary">
                    반려
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
