'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PremiumListingOffer from '@/components/PremiumListingOffer';
import TeacherCard from '@/components/TeacherCard';


export default function DashboardPage() {

  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [quillReady, setQuillReady] = useState(false);
  const [showExpediteAccount, setShowExpediteAccount] = useState(false);

  const formRef = useRef();

  const quillLongContainerRef = useRef(null);
  const quillExpContainerRef  = useRef(null);
  const quillLongInstanceRef  = useRef(null);
  const quillExpInstanceRef   = useRef(null);

  const [showDetails, setShowDetails] = useState(false);

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
        console.log('Long ref:', quillLongContainerRef.current);
        console.log('Exp ref:', quillExpContainerRef.current);

        // 1) Start
        if (quillLongContainerRef.current && quillExpContainerRef.current) {
          quillLongInstanceRef.current = new Quill(
            quillLongContainerRef.current,
            { theme: 'snow', modules: { toolbar } }
          );
          quillExpInstanceRef.current = new Quill(
            quillExpContainerRef.current,
            { theme: 'snow', modules: { toolbar } }
          );

        console.log('Loading longintroduction HTML:', teacher.longintroduction);
        console.log('Loading experience HTML:',    teacher.experience);


        // Preload saved HTML
        if (teacher.longintroduction) {
          const delta = quillLongInstanceRef.current.clipboard.convert({
            html: teacher.longintroduction
          });
          quillLongInstanceRef.current.setContents(delta, 'silent');
        }
        if (teacher.experience) {
          const delta = quillExpInstanceRef.current.clipboard.convert({
            html: teacher.experience
          });
          quillExpInstanceRef.current.setContents(delta, 'silent');
        }
        
          setQuillReady(true);
        }
    };

    if (teacher) {
    const timer = setTimeout(() => {
        initQuill();
    }, 100);
    return () => clearTimeout(timer);
    }    }, [teacher]);

  const updateStatus = (status) => {
    const statusMap = {
      pending: ['계정 상태: 검토 중 - 예상 소요 시간: 21일', 'bg-yellow-100 text-yellow-700'],
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
    <div className="max-w-[1025px] mx-auto py-12 px-4 min-h-screen">

      {/* Student Section */}
      {role === 'student' && 
      <div>
        <h1 className="text-2xl font-bold mb-1 mt-0 leading-none">계정 정보</h1>
        {user && <p className="font-medium">계정 아이디: {user.email}</p>}
        <p>학생 계정으로 로그인하셨습니다.</p>
        <div className="mt-8 flex gap-4 w-full">
          <button onClick={handleLogout} className="bg-blue-500 text-white w-1/2 px-[2em] py-[1em] rounded-lg">로그아웃</button>
          <button onClick={handleDelete} className="bg-blue-900 text-white w-1/2 px-[2em] py-[1em] rounded-lg">탈퇴하기</button>
        </div>
      </div>
      }



      {/* Teacher Section */}
          
      {role === 'teacher' && teacher && (
        <>

          {teacher.status === 'approved' && <PremiumListingOffer teacher={teacher} />}

        
        {/* Basic Header */}
        <div className="flex flex-col mt-6 p-[3em] bg-white border border-solid border-gray-200 shadow rounded-2xl">
          <h1 className="text-2xl font-bold mb-1">계정 정보</h1>
          {user && <p className="font-medium">계정 아이디: {user.email}</p>}

          {role === 'teacher' && teacher && statusInfo && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold w-fit ${statusInfo.classes}`}
            >
              <span className="w-2 h-2 rounded-full bg-current inline-block"></span>
              {statusInfo.text}
            </div>
          )}

                    {/* Offer paid services for pending teachers */}
          {teacher.status === 'pending' && (
            <div className="mt-6 p-8 bg-white border border-gray-200 shadow rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-4">프로필 검토 중입니다</h2>
            <p className="text-gray-600">현재 많은 선생님들의 지원으로 인해 프로필 검토에 약 3주 정도 소요되고 있습니다.</p>
            <p className="text-gray-600 mb-4">9,000원을 입금하시면 1영업일 내로 프로필 검토를 완료해드립니다. </p>
            <p className="text-xs text-gray-600 mb-4">*수익금은 사이트 운영 및 서비스 개선에 사용됩니다.</p>

              <div className="max-w-md mx-auto">
                
                <button
                  onClick={() => setShowExpediteAccount(!showExpediteAccount)}
                  className="mt-6 px-6 py-3 rounded-xl font-semibold transition bg-blue-600 text-white hover:bg-blue-700"
                >
                  {showExpediteAccount ? '계좌 정보 숨기기' : '빠른 검토 요청하기'}
                </button>

                {showExpediteAccount && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-center">
                    <div className="text-sm text-gray-600 mb-1">입금 계좌</div>
                    <div className="text-lg font-mono font-semibold text-gray-900">
                      신한은행 110-591-381671
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      예금주: 박유진
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) 
          }

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
      


    </div>
  );
}