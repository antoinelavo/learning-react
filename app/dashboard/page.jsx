'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [quillReady, setQuillReady] = useState(false);

  const formRef = useRef();
  const quillLongRef = useRef(null);
  const quillExpRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleError || !userData) {
        alert('사용자 권한을 불러오지 못했습니다.');
        return;
      }

      setRole(userData.role);

      if (userData.role === 'teacher') {
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

    init();
  }, []);

    useEffect(() => {
    const initQuill = async () => {
        const [{ default: Quill }] = await Promise.all([
        import('quill'),
        import('quill/dist/quill.snow.css'),
        ]);
        const toolbar = [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ];
        if (quillLongRef.current && quillExpRef.current) {
        const longQ = new Quill(quillLongRef.current, {
            theme: 'snow',
            modules: { toolbar },
        });
        longQ.root.innerHTML = teacher?.longintroduction || '';
        quillLongRef.current.__quill = longQ;

        const expQ = new Quill(quillExpRef.current, {
            theme: 'snow',
            modules: { toolbar },
        });
        expQ.root.innerHTML = teacher?.experience || '';
        quillExpRef.current.__quill = expQ;

        setQuillReady(true);
        }
    };

    if (teacher) {
    const timer = setTimeout(() => {
        initQuill();
    }, 0);
    return () => clearTimeout(timer);
    }    }, [teacher]);

  const updateStatus = (status) => {
    const statusMap = {
      pending: ['계정 상태: 검토 중', 'bg-yellow-100 text-yellow-700'],
      approved: ['계정 상태: 승인됨', 'bg-green-100 text-green-700'],
      rejected: ['계정 상태: 반려됨', 'bg-red-100 text-red-700'],
    };
    const [text, classes] = statusMap[status] || ['계정 상태: 알 수 없음', 'bg-gray-100 text-gray-600'];
    setStatusInfo({ text, classes });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
      longintroduction: quillLongRef.current.__quill.root.innerHTML,
      experience: quillExpRef.current.__quill.root.innerHTML,
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
    <div className="max-w-3xl mx-auto py-12 px-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">계정 정보</h1>
      {user && <p className="mb-4 font-medium">계정 아이디: {user.email}</p>}

      {role === 'student' && <p>학생 계정으로 로그인하셨습니다.</p>}

      {role === 'teacher' && teacher && (
        <>
          {statusInfo && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold ${statusInfo.classes}`}>
              <span className="w-2 h-2 rounded-full bg-current inline-block"></span>
              {statusInfo.text}
            </div>
          )}

          <p className="text-sm mt-4">※ 정보 수정을 원하시면 아래 정보를 수정 후 <strong>저장하기</strong>를 눌러주세요.</p>
          <p className="text-sm">※※ 수정 후에는 검토가 진행되어야 다시 사이트에 노출됩니다.</p>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="block font-medium">사이트 기재용 이름 *</label>
              <input name="name" type="text" defaultValue={teacher.name} required className="w-full border border-gray-300 rounded p-2" />
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
              <input name="extra-subject" type="text" defaultValue={teacher.extra_subject} className="w-full border border-gray-300 rounded p-2" />
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
              <input name="preferred_lesson_time" type="text" defaultValue={teacher.preferred_lesson_time} required className="w-full border border-gray-300 rounded p-2" />
            </div>

            <div>
              <label className="block font-medium">학력 / 학과 *</label>
              <input name="school" type="text" defaultValue={teacher.school} required className="w-full border border-gray-300 rounded p-2" />
            </div>

            <div>
              <label className="block font-medium">학번 (선택)</label>
              <input name="student_id_number" type="text" defaultValue={teacher.student_id_number} className="w-full border border-gray-300 rounded p-2" />
            </div>

            <div>
              <label className="block font-medium">나이 (선택)</label>
              <input name="age" type="number" defaultValue={teacher.age} className="w-full border border-gray-300 rounded p-2" />
            </div>

            <div>
              <label className="block font-medium">성별 *</label>
              <select name="gender" defaultValue={teacher.gender || ''} required className="w-full border border-gray-300 rounded p-2">
                <option value="">성별 고르기</option>
                <option value="남">남</option>
                <option value="여">여</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">한줄소개 *</label>
              <textarea name="shortintroduction" maxLength={50} defaultValue={teacher.shortintroduction} required className="w-full border border-gray-300 rounded p-2"></textarea>
            </div>

            <div>
              <label className="block font-medium">소개 *</label>
              <div ref={quillLongRef} className="bg-white min-h-[150px]"></div>
            </div>

            <div>
              <label className="block font-medium">경력 *</label>
              <div ref={quillExpRef} className="bg-white min-h-[150px]"></div>
            </div>

            <div>
              <label className="block font-medium">이메일 주소 / 연락처 *</label>
              <input name="contact_information" type="text" defaultValue={teacher.contact_information} required className="w-full border border-gray-300 rounded p-2" />
            </div>

            <button type="submit" className="bg-blue-500 text-white w-full px-[2em] py-[1em] rounded-xl">저장하기</button>
          </form>
        </>
      )}

      <div className="mt-8 flex gap-4 w-full">
        <button onClick={handleLogout} className="bg-gray-700 text-white w-1/2 px-[2em] py-[1em] rounded-lg">로그아웃</button>
        <button onClick={handleDelete} className="bg-red-600 text-white w-1/2 px-[2em] py-[1em] rounded-lg">탈퇴하기</button>
      </div>
    </div>
  );
}