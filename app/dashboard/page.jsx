'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import PremiumListingOffer from '@/components/PremiumListingOffer';
import TierUpgradeOffer from '@/components/TierUpgradeOffer';
import TeacherCard from '@/components/TeacherCard';
import EmailNotificationToggle from '@/components/chat/EmailNotificationToggle.client';
import { revealsRemaining } from '@/lib/reveal';


export default function DashboardPage() {

  const router = useRouter();
  const { user, role, teacherStatus, loading: authLoading, signOut } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [quillReady, setQuillReady] = useState(false);
  // 'info' | 'pricing' — ?tab=pricing lets other pages (e.g. the student
  // board, when a free-tier teacher hits their reveal limit) deep-link
  // straight to the pricing tab.
  const [activeTab, setActiveTab] = useState('info');
  // Set true by the "플러스 알아보기" nudge button so the pricing tab, once
  // it mounts, scrolls straight to the TierUpgradeOffer card instead of
  // just landing at the top (grid order stays PremiumListingOffer-first).
  const [scrollToUpgrade, setScrollToUpgrade] = useState(false);
  const tierUpgradeRef = useRef(null);
  const hasResetScrollRef = useRef(false);

  const formRef = useRef();

  const quillLongContainerRef = useRef(null);
  const quillExpContainerRef  = useRef(null);
  const quillLongInstanceRef  = useRef(null);
  const quillExpInstanceRef   = useRef(null);

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Admins don't have a teacher/student dashboard — send them to admin.
    if (role === 'admin') {
      router.replace('/admin');
      return;
    }

    // Teachers who haven't submitted a profile yet go to the apply page
    if (role === 'teacher' && !teacherStatus) {
      router.replace('/apply');
      return;
    }

    const loadTeacherProfile = async () => {
      if (role === 'teacher') {
        const { data: profile, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (teacherError || !profile) {
          alert('선생님 정보를 불러오지 못했습니다.');
          return;
        }

        setTeacher(profile);
        updateStatus(profile.status);

        const { data: teachers, error: subjectsError } = await supabase
          .from('teachers')
          .select('subjects');

        if (subjectsError) {
          setSubjectsList([]);
        } else {
          const allSubjects = teachers?.flatMap((t) => t.subjects) || [];
          const uniqueSubjects = Array.from(new Set(allSubjects));
          setSubjectsList(uniqueSubjects.sort());
        }
      }
    };

    loadTeacherProfile();
  }, [authLoading, user, role, teacherStatus]);

  // Support deep-linking straight to the pricing tab (e.g. from the
  // student board when a free-tier teacher hits their reveal limit), and
  // keep it selected across the Toss tier-upgrade redirect
  // (?tab=pricing&tier=success|failed).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'pricing') setActiveTab('pricing');
  }, []);

  // The browser sometimes restores a scroll position left over from a
  // previous visit to this same URL (observed on mobile Safari after
  // navigating in via the menu's "내 정보" link) — this lands the page
  // already scrolled past the tab bar, hidden behind the sticky header.
  // Force back to the top exactly once, right when the real content first
  // mounts, without fighting the separate scroll-to-upgrade behavior below.
  useEffect(() => {
    if (teacher && !hasResetScrollRef.current) {
      hasResetScrollRef.current = true;
      window.scrollTo(0, 0);
    }
  }, [teacher]);

  useEffect(() => {
    if (activeTab === 'pricing' && scrollToUpgrade && tierUpgradeRef.current) {
      tierUpgradeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollToUpgrade(false);
    }
  }, [activeTab, scrollToUpgrade]);

  const refreshTeacherProfile = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from('teachers').select('*').eq('user_id', user.id).single();
    if (profile) setTeacher(profile);
  };

  // Warm the Quill module cache as soon as the page mounts, in parallel
  // with the teacher-profile fetch below, so the actual init effect
  // usually finds it already loaded instead of visibly waiting on it.
  useEffect(() => {
    import('quill');
    import('quill/dist/quill.snow.css');
  }, []);

  // Two race conditions used to live here: (1) this only re-ran on
  // [teacher], so a teacher who deep-links straight to ?tab=pricing (the
  // 내 정보 tab's containers never mounted) would silently never get an
  // editor, with nothing retrying even after switching back to 내 정보;
  // (2) any later teacher refetch (e.g. refreshTeacherProfile after a
  // 플러스 purchase) re-ran this effect and called `new Quill(...)` again
  // on the same already-initialized container, corrupting it. Fixed by
  // keying off the container's own DOM state (Quill marks its root with
  // the `ql-container` class) rather than a ref that can go stale across
  // an info/pricing tab remount, and by re-checking after the async
  // import resolves in case the tab changed while it was in flight.
  useEffect(() => {
    if (!teacher || activeTab !== 'info') return;
    if (quillLongContainerRef.current?.classList.contains('ql-container')) return;

    let cancelled = false;

    const initQuill = async () => {
      const [{ default: Quill }] = await Promise.all([
        import('quill'),
        import('quill/dist/quill.snow.css'),
      ]);

      if (cancelled) return;
      if (!quillLongContainerRef.current || !quillExpContainerRef.current) return;
      if (quillLongContainerRef.current.classList.contains('ql-container')) return;

      const toolbar = [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
      ];

      quillLongInstanceRef.current = new Quill(quillLongContainerRef.current, {
        theme: 'snow',
        modules: { toolbar },
      });
      quillExpInstanceRef.current = new Quill(quillExpContainerRef.current, {
        theme: 'snow',
        modules: { toolbar },
      });

      // Preload saved HTML
      if (teacher.longintroduction) {
        const delta = quillLongInstanceRef.current.clipboard.convert({
          html: teacher.longintroduction,
        });
        quillLongInstanceRef.current.setContents(delta, 'silent');
      }
      if (teacher.experience) {
        const delta = quillExpInstanceRef.current.clipboard.convert({
          html: teacher.experience,
        });
        quillExpInstanceRef.current.setContents(delta, 'silent');
      }

      setQuillReady(true);
    };

    initQuill();

    return () => {
      cancelled = true;
    };
  }, [teacher, activeTab]);

  const updateStatus = (status) => {
    const statusMap = {
      pending: ['계정 상태: 검토 중 - 예상 소요 시간: 영업일 기준 3일', 'bg-yellow-100 text-yellow-700'],
      approved: ['계정 상태: 승인됨', 'bg-green-100 text-green-700'],
      rejected: ['계정 상태: 반려됨', 'bg-red-100 text-red-700'],
    };
    const [text, classes] = statusMap[status] || ['계정 상태: 알 수 없음', 'bg-gray-100 text-gray-600'];
    setStatusInfo({ text, classes });
  };

  const handleLogout = async () => {
    await signOut();
    alert('로그아웃되었습니다.');
    router.push('/find');
  };

  const handleDelete = async () => {
    const confirm = window.confirm('정말로 탈퇴하시겠습니까? 계정을 삭제하면 되돌릴 수 없습니다.');
    if (!confirm || !user) return;

    await supabase
      .from('users')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', user.id);

    await supabase.auth.signOut();
    alert('회원 탈퇴가 완료되었습니다.');
    router.push('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !teacher || !quillReady) return;

    const form = formRef.current;

    const updated = {
      name: form.name.value,
      extra_subject: form['extra-subject'].value,
      preferred_lesson_time: form.preferred_lesson_time.value,
      school: form.school.value,
      student_id_number: form.student_id_number.value,
      age: Number(form.age.value) || null,
      gender: form.gender.value,
      shortintroduction: form.shortintroduction.value,
      contact_information: form.contact_information.value,
      lesson_type: [...form.querySelectorAll('input[name="lesson_type"]:checked')].map((cb) => cb.value),
      subjects: [...form.querySelectorAll('input[name="subjects"]:checked')].map((cb) => cb.value),
      IB: form.querySelector('input[name="ib_status"]:checked')?.value === 'O',
      longintroduction: quillLongInstanceRef.current.root.innerHTML,
      experience:       quillExpInstanceRef.current.root.innerHTML,
      rate: Number(form.rate.value) || null, 
      rate_description: form.rate_description.value,
      last_updated: new Date().toISOString(),
      status: 'pending',
    };

    const { error } = await supabase
      .from('teachers')
      .update(updated)
      .eq('user_id', user.id);

    if (error) {
      alert('저장에 실패했습니다.');
    } else {
      alert('저장되었습니다!');
    }
  };

  return (
    <div className="max-w-[1025px] mx-auto pt-4 pb-12 px-4 min-h-screen">

      {/* Student Section */}
      {role === 'student' && 
      <div>
        <h1 className="text-2xl font-bold mb-1 mt-0 leading-none">계정 정보</h1>
        {user && <p className="font-medium">계정 아이디: {user.email}</p>}
        <p>학생 계정으로 로그인하셨습니다.</p>
        <div className="mt-4">
          <EmailNotificationToggle userId={user.id} />
        </div>
        <div className="mt-8 flex gap-4 w-full">
          <button onClick={handleLogout} className="bg-blue-500 text-white w-1/2 px-[2em] py-[1em] rounded-lg">로그아웃</button>
          <button onClick={handleDelete} className="bg-blue-900 text-white w-1/2 px-[2em] py-[1em] rounded-lg">탈퇴하기</button>
        </div>
      </div>
      }



      {/* Teacher Section */}
          
      {role === 'teacher' && teacher && (
        <>
        <Script src="https://js.tosspayments.com/v1/payment" strategy="afterInteractive" />

        {/* Tabs — mobile-friendly: full-width, evenly split buttons rather
            than a horizontal scroller, since there are only two. Not
            sticky: the site's own header is already sticky at top:0, and
            stacking another sticky bar there would hide it behind that
            header on scroll. */}
        <div className="flex p-1 gap-1 rounded-full bg-gray-100 mb-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2.5 text-sm sm:text-base font-semibold text-center rounded-full transition ${
              activeTab === 'info'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            내 정보
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-2.5 text-sm sm:text-base font-semibold text-center rounded-full transition ${
              activeTab === 'pricing'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            더 많은 학생 만나기
          </button>
        </div>

      {activeTab === 'info' && (
        <>
        {/* Basic Header */}
        <div className="flex flex-col p-[3em] bg-white border border-solid border-gray-200 shadow rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-2xl font-bold m-0">계정 정보</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                teacher.tier === 'premium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {teacher.tier === 'premium' ? '플러스 회원' : '무료 회원'}
            </span>
          </div>
          {user && <p className="font-medium mb-3">계정 아이디: {user.email}</p>}

          {role === 'teacher' && teacher && statusInfo && (
            <div>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold w-fit ${statusInfo.classes}`}
              >
                <span className="w-2 h-2 rounded-full bg-current inline-block"></span>
                {statusInfo.text}
              </div>
              {teacher.status === 'pending' && (
                <p className="text-xs text-gray-400 mt-2">
                  (한 번 승인된 적이 있는 회원은 3일 이내로 빠르게 재검토됩니다)
                </p>
              )}
            </div>
          )}

          {teacher.status === 'approved' && teacher.tier !== 'premium' && (
            <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm font-semibold text-gray-900 m-0">
                {revealsRemaining(teacher) > 0
                  ? `이번 달 연락처 열람이 ${revealsRemaining(teacher)}번 남았어요`
                  : '이번 달 무료 열람을 모두 사용했어요'}
              </p>
              <p className="text-xs text-gray-500 mt-1 mb-3">플러스 회원은 무제한으로 열람할 수 있어요</p>
              <button
                onClick={() => {
                  setActiveTab('pricing');
                  setScrollToUpgrade(true);
                }}
                className="w-full sm:w-auto text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                플러스 알아보기
              </button>
            </div>
          )}

          <div className="mt-3">
            <EmailNotificationToggle userId={user.id} />
          </div>

          {teacher.status === 'pending' && (
            <div className="mt-6 p-8 bg-white border border-gray-200 shadow rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-4">프로필 검토 중입니다</h2>
            <p className="text-gray-600 mb-4">영업일 기준 3일 이내로 프로필 검토가 완료됩니다.</p>
            </div>
          )}

        </div>
        
        {/* Edit Profile */}
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-6 p-[3em] bg-white border border-solid border-gray-200 shadow rounded-2xl">
                <h2 className="text-center">프로필 편집하기</h2>
                <br></br>
                  <p className="text-sm mt-4">※ 정보 수정을 원하시면 아래 정보를 수정 후 <strong>저장하기</strong>를 눌러주세요.</p>
                  <p className="text-sm">※※ 수정 후에는 검토가 진행되어야 다시 사이트에 노출됩니다.</p>
                
                <div>
                  <label className="block font-medium">사이트 기재용 이름 *</label>
                  <input name="name" type="text" defaultValue={teacher.name} required className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <div>
                  <label className="block font-medium">수업 과목 *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {subjectsList.map((subject) => (
                      <label key={subject} className="flex items-center gap-1">
                        <input type="checkbox" name="subjects" value={subject} defaultChecked={teacher.subjects?.includes(subject)} />
                        {subject}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium">기타 과목</label>
                  <input name="extra-subject" type="text" defaultValue={teacher.extra_subject} className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <div>
                  <label className="block font-medium">수업 방식 *</label>
                  <div className="flex gap-4">
                    <label><input type="checkbox" name="lesson_type" value="비대면" defaultChecked={teacher.lesson_type?.includes('비대면')} /> 비대면</label>
                    <label><input type="checkbox" name="lesson_type" value="대면" defaultChecked={teacher.lesson_type?.includes('대면')} /> 대면</label>
                  </div>
                </div>

                <div>
                  <label className="block font-medium">IB 이수 여부 *</label>
                  <div className="flex gap-4">
                    <label><input type="radio" name="ib_status" value="O" defaultChecked={teacher.IB === true} /> O</label>
                    <label><input type="radio" name="ib_status" value="X" defaultChecked={teacher.IB === false} /> X</label>
                  </div>
                </div>

                <div>
                  <label className="block font-medium">선호 수업 시간 *</label>
                  <input name="preferred_lesson_time" type="text" defaultValue={teacher.preferred_lesson_time} required className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <div>
                  <label className="block font-medium">학력 / 학과 *</label>
                  <input name="school" type="text" defaultValue={teacher.school} required className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <div>
                  <label className="block font-medium">학번 (선택)</label>
                  <input name="student_id_number" type="text" defaultValue={teacher.student_id_number} className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <div>
                  <label className="block font-medium">나이 (선택)</label>
                  <input name="age" type="number" defaultValue={teacher.age} className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <div>
                  <label className="block font-medium">성별 *</label>
                  <select name="gender" defaultValue={teacher.gender || ''} required className="w-full border border-gray-300 rounded-xl p-3 mt-2">
                    <option value="">성별 고르기</option>
                    <option value="남">남</option>
                    <option value="여">여</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium">한줄소개 *</label>
                  <textarea name="shortintroduction" maxLength={50} defaultValue={teacher.shortintroduction} required className="w-full border border-gray-300 rounded-xl p-3 mt-2"></textarea>
                </div>

                <div>
                  <label className="block font-medium">소개 *</label>
                  <div
                    ref={quillLongContainerRef}
                    className="bg-white min-h-[150px]"
                  />
                </div>

                <div>
                  <label className="block font-medium">경력 *</label>
                  <div
                    ref={quillExpContainerRef}
                    className="bg-white min-h-[150px]"
                  />
                </div>

                <div>
                  <label className="block font-medium">수업료 (시급, 단위는 만 원) *</label>
                  <input name="rate" type="number" defaultValue={teacher.rate} className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <div>
                  <label className="block font-medium">수업료 관련 설명 (선택)</label>
                  <input name="rate_description" type="text" defaultValue={teacher.rate_description} className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <div>
                  <label className="block font-medium">이메일 주소 / 연락처 *</label>
                  <input name="contact_information" type="text" defaultValue={teacher.contact_information} required className="w-full border border-gray-300 rounded-xl p-3 mt-2" />
                </div>

                <button type="submit" className="bg-blue-500 text-white px-[2em] py-[1em] rounded-xl mx-auto">저장하기</button>
              </form>
                        <div className="mt-8 flex gap-4 w-full">
            <button onClick={handleLogout} className="bg-blue-500 text-white w-1/2 px-[2em] py-[1em] rounded-lg">로그아웃</button>
            <button onClick={handleDelete} className="bg-blue-900 text-white w-1/2 px-[2em] py-[1em] rounded-lg">탈퇴하기</button>
          </div>
        </>
      )}

      {activeTab === 'pricing' && (
        teacher.status !== 'approved' ? (
          <div className="p-6 sm:p-8 bg-white border border-solid border-gray-200 shadow rounded-2xl text-center text-gray-600">
            프로필 승인 완료 후 이용할 수 있습니다.
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold m-0">더 많은 학생 만나기</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  teacher.tier === 'premium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {teacher.tier === 'premium' ? '플러스 회원' : '무료 회원'}
              </span>
            </div>

            {/* Both products shown fully expanded, side by side — no
                accordion/tab gating a teacher's awareness of what's on
                offer, only the checkout steps themselves require a click. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <PremiumListingOffer teacher={teacher} />
              <div ref={tierUpgradeRef} className="scroll-mt-24">
                <TierUpgradeOffer teacher={teacher} onUpgraded={refreshTeacherProfile} />
              </div>
            </div>
          </div>
        )
      )}
        </>
      )}


    </div>
  );
}