'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';
import 'quill/dist/quill.snow.css';

export default function ApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjectsList, setSubjectsList] = useState([]);
  const [isTeacher, setIsTeacher] = useState(null);
  const longRef = useRef(null);
  const expRef  = useRef(null);
  const [quillReady, setQuillReady] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      subjects: [],
      lesson_type: [],
      referral_source: [],
      longintroduction: '',
      experience: '',
    },
  });

  useEffect(() => {
    const init = async () => {
           const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!session?.user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      const userId = session.user.id;

        const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

        if (roleError || !userData || String(userData.role).toLowerCase().trim() !== 'teacher') {
        setIsTeacher(false);
        setLoading(false);
        return;
        }

        else {
            setIsTeacher(true);
        }

      const { data: existingProfile, error: profileError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) console.error('Error checking teacher profile:', profileError);

      if (existingProfile) {
        router.push('/dashboard');
        return;
      }

      const { data: teachers, error: subjectsError } = await supabase
        .from('teachers')
        .select('subjects');
      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError);
        setSubjectsList([]);
      } else {
        const allSubjects = teachers?.flatMap((t) => t.subjects) || [];
        const uniqueSubjects = Array.from(new Set(allSubjects)).sort();
        setSubjectsList(uniqueSubjects);
      }

      setLoading(false);
    };
    init();
  }, [router, setValue]);

  useEffect(() => {
   if (!loading && isTeacher === true && longRef.current && expRef.current) {
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
       const longQ = new Quill(longRef.current, {
         theme: 'snow',
         modules: { toolbar },
       });
       longQ.on('text-change', () =>
         setValue('longintroduction', longQ.root.innerHTML, {
           shouldValidate: true,
         })
       );
       const expQ = new Quill(expRef.current, {
         theme: 'snow',
         modules: { toolbar },
       });
       expQ.on('text-change', () =>
         setValue('experience', expQ.root.innerHTML, {
           shouldValidate: true,
         })
       );
       setQuillReady(true);
     };
     initQuill();
   }
 }, [loading, isTeacher, setValue]);

  const onSubmit = async (formData) => {
    // Re-check session and user ID
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session.user.id;

    // Handle profile picture upload
    let profilePictureUrl = null;
    const file = formData.profile_picture?.[0];
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(`teachers/${fileName}`, file);
      if (uploadError) {
        console.error('Image Upload Error:', uploadError);
        alert('프로필 사진 업로드가 실패하였습니다. 파일 크기가 10MB 이하인지 확인해주세요.');
        return;
      }
      const { data: publicUrl } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(`teachers/${fileName}`);
      profilePictureUrl = publicUrl.publicUrl;
    }

    // Build payload
    const teacherData = {
      user_id: userId,
      name: formData.name.trim() || null,
      subjects: formData.subjects,
      extra_subject: formData.extra_subject?.trim() || null,
      lesson_type: formData.lesson_type,
      IB: formData.ib_status === 'O',
      preferred_lesson_time: formData.preferred_lesson_time || null,
      school: formData.school || null,
      student_id_number: formData.student_id_number || null,
      age: formData.age ? Number(formData.age) : null,
      gender: formData.gender || null,
      shortintroduction: formData.shortintroduction || null,
      longintroduction: formData.longintroduction || null,
      experience: formData.experience || null,
      contact_information: formData.contact_information || null,
      profile_picture:
        profilePictureUrl ||
        'https://scdoramzssnimcbsojml.supabase.co/storage/v1/object/public/profile-pictures/teachers/default.jpg',
      referral_source: formData.referral_source,
      rate: formData.rate ? Number(formData.rate) : null, // ADDED
      rate_description: formData.rate_description?.trim() || null, // ADDED
      status: 'pending',
    };

    // Prevent duplicate names
    const { data: existingTeacher, error: fetchError } = await supabase
      .from('teachers')
      .select('id')
      .eq('name', teacherData.name)
      .single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database Fetch Error:', fetchError);
      alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
      return;
    }
    if (existingTeacher) {
      alert(`"${teacherData.name}" 이름은 이미 등록되어 있습니다. 다른 이름을 사용해주세요.`);
      return;
    }

    // Insert record
    const { error: dbError } = await supabase.from('teachers').insert([teacherData]);
    if (dbError) {
      console.error('Database Insert Error:', dbError);
      alert('제출 실패했습니다.');
    } else {
      alert(
        '성공적으로 제출되었습니다! 검토 과정을 거친 후 프로필이 게시될 예정입니다. 프로필이 게시되기까지 3주 정도 소요될 수 있습니다. 계정 상태 조회 및 프로필 수정은 "선생님 등록하기" 페이지에서 확인하실 수 있습니다.'
      );
      reset();
    }
  };

    if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
    }

    if (isTeacher === false) {
    return (
        <div className="text-center mt-20 text-black">
        선생님 계정만 열람 가능합니다.
        </div>
    );
    }

// (only when isTeacher === true do we fall through to render the form)

  return (
  <div className="flex flex-col mt-6 p-[1em] bg-white border border-solid border-gray-200 shadow rounded-2xl max-w-4xl mx-auto mb-[3em]">

    <div className="max-w-4xl mx-auto p-0 mb-[3em]">
      <h1 className="text-3xl font-bold mb-6 text-center">IB Master 선생님 지원하기</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* 이름 */}
        <div>
          <label htmlFor="name" className="block font-medium">
            사이트 기재용 이름 *
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { required: true, maxLength: 10 })}
            placeholder="이름 혹은 아이디"
            className="w-full border border-gray-300 rounded-xl p-3 mt-2"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">이름을 입력해주세요 (최대 10자).</p>
          )}
        </div>

        {/* subjects */}
        <div>
          <span className="block font-medium mb-3">수업 과목 *</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {subjectsList.map((subject) => (
              <label key={subject} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  value={subject}
                  {...register('subjects', { required: true })}
                  className="h-4 w-4"
                />
                <span className="text-sm">{subject}</span>
              </label>
            ))}
          </div>
          {errors.subjects && (
            <p className="text-red-500 text-sm mt-1">과목을 하나 이상 선택해주세요.</p>
          )}
        </div>

        {/* extra subject */}
        <div>
          <label htmlFor="extra_subject" className="block font-medium">
            위에 수업 과목명이 없는 경우, 여기에 수업 과목명을 적어주세요.
          </label>
          <input
            type="text"
            id="extra_subject"
            {...register('extra_subject')}
            placeholder="기타 과목명을 입력하세요"
            className="w-full border border-gray-300 rounded-xl p-3 mt-2"
          />
        </div>

        {/* lesson type */}
        <div>
          <span className="block mb-1 font-medium">수업 방식 *</span>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                value="비대면"
                {...register('lesson_type', { required: true })}
                className="h-4 w-4"
              />
              <span>비대면</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                value="대면"
                {...register('lesson_type', { required: true })}
                className="h-4 w-4"
              />
              <span>대면</span>
            </label>
          </div>
          {errors.lesson_type && (
            <p className="text-red-500 text-sm mt-1">수업 방식을 하나 이상 선택해주세요.</p>
          )}
        </div>

        {/* IB status */}
        <div>
          <span className="block mb-1 font-medium">IB 이수 여부 *</span>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                value="O"
                {...register('ib_status', { required: true })}
                className="h-4 w-4"
              />
              <span>O</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                value="X"
                {...register('ib_status', { required: true })}
                className="h-4 w-4"
              />
              <span>X</span>
            </label>
          </div>
          {errors.ib_status && (
            <p className="text-red-500 text-sm mt-1">이수 여부를 선택해주세요.</p>
          )}
        </div>

        {/* preferred time */}
        <div>
          <label htmlFor="preferred_lesson_time" className="block mb-1 font-medium">
            선호 수업 시간 *
          </label>
          <input
            type="text"
            id="preferred_lesson_time"
            {...register('preferred_lesson_time', { required: true })}
            placeholder="예: 평일 오전/오후, 수요일 저녁 7-8시"
            className="w-full border border-gray-300 rounded p-2"
          />
          {errors.preferred_lesson_time && (
            <p className="text-red-500 text-sm mt-1">선호 수업 시간을 입력해주세요.</p>
          )}
        </div>

        {/* school */}
        <div>
          <label htmlFor="school" className="block mb-1 font-medium">
            학력 / 학과 *
          </label>
          <input
            type="text"
            id="school"
            {...register('school', { required: true })}
            placeholder="한국대학교 국문학과 / SKY 컴퓨터공학과 등 구체적, 혹은 포괄적인 학교 정보"
            className="w-full border border-gray-300 rounded p-2"
          />
          {errors.school && (
            <p className="text-red-500 text-sm mt-1">학력/학과를 입력해주세요.</p>
          )}
        </div>

        {/* student id */}
        <div>
          <label htmlFor="student_id_number" className="block mb-1 font-medium">
            학번 (입학년도) *
          </label>
          <input
            type="text"
            id="student_id_number"
            {...register('student_id_number', {required: true})}
            placeholder="예: 21, 23"
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        {/* age */}
        <div>
          <label htmlFor="age" className="block mb-1 font-medium">
            나이 (선택)
          </label>
          <input
            type="number"
            id="age"
            {...register('age')}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        {/* gender */}
        <div>
          <label htmlFor="gender" className="block mb-1 font-medium">
            성별 *
          </label>
          <select
            id="gender"
            {...register('gender', { required: true })}
            className="w-full border border-gray-300 rounded p-2"
          >
            <option value="">성별 고르기</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">성별을 선택해주세요.</p>
          )}
        </div>

        {/* short intro */}
        <div>
          <label htmlFor="shortintroduction" className="block mb-1 font-medium">
            한줄소개 *
          </label>
          <textarea
            id="shortintroduction"
            {...register('shortintroduction', { required: true, maxLength: 50 })}
            placeholder="선생님의 간결하고 임팩트 있는 소개!"
            className="w-full border border-gray-300 rounded p-2"
            rows={2}
          />
          {errors.shortintroduction && (
            <p className="text-red-500 text-sm mt-1">한줄소개를 입력해주세요 (최대 50자)</p>
          )}
        </div>

        {/* long introduction */}
        <div>
        <label className="block mb-1 font-medium">소개 *</label>
        <div ref={longRef} className="h-40 bg-white border border-gray-300 mb-2 min-h-[20em]"></div>
        {errors.longintroduction && (
            <p className="text-red-500 text-sm mt-1">소개를 입력해주세요. (연락처를 이곳에 기재하면 반려됩니다. 연락처는 아래 연락처란에 적어주세요.)</p>
        )}
        </div>

        {/* experience */}
        <div>
        <label className="block mb-1 font-medium">경력 *</label>
        <div ref={expRef} className="h-40 bg-white border border-gray-300 mb-2 min-h-[20em]"></div>
        {errors.experience && (
            <p className="text-red-500 text-sm mt-1">경력을 입력해주세요. (연락처를 이곳에 기재하면 반려됩니다. 연락처는 아래 연락처란에 적어주세요.)</p>
        )}
        </div>

        {/* rate */}
        <div>
          <label htmlFor="rate" className="block mb-1 font-medium">
            수업료 (시급, 단위는 만 원) *
          </label>
          <input
            type="number"
            id="rate"
            {...register('rate', { required: true })}
            placeholder="예: 5"
            className="w-full border border-gray-300 rounded p-2"
          />
          {errors.rate && (
            <p className="text-red-500 text-sm mt-1">수업료를 입력해주세요.</p>
          )}
        </div>

        {/* rate_description */}
        <div>
          <label htmlFor="rate_description" className="block mb-1 font-medium">
            수업료 관련 설명 (선택)
          </label>
          <input
            type="text"
            id="rate_description"
            {...register('rate_description')}
            placeholder="예: EE는 시급 6만원 / 대면은 시급 +1만원"
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        {/* contact info */}
        <div>
          <label htmlFor="contact_information" className="block mb-1 font-medium">
            이메일 주소 / 연락처 *
          </label>
          <input
            type="text"
            id="contact_information"
            {...register('contact_information', { required: true })}
            placeholder="이메일, 오픈카톡 링크 등"
            className="w-full border border-gray-300 rounded p-2"
          />
          {errors.contact_information && (
            <p className="text-red-500 text-sm mt-1">연락처를 입력해주세요.</p>
          )}
        </div>

        {/* profile picture */}
        <div>
          <label htmlFor="profile_picture" className="block mb-1 font-medium">
            프로필 사진 (선택)
          </label>
          <input
            type="file"
            id="profile_picture"
            {...register('profile_picture')}
            accept="image/*"
            className="w-full"
          />
        </div>

        {/* referral source */}
        <div>
          <span className="block mb-1 font-medium">이 사이트에 대해 어떻게 알게 되셨나요?</span>
          <div className="flex flex-wrap gap-3">
            {['구글 검색','블로그 글','SNS','지인 소개','운영자가 직접 연락','기타'].map((src) => (
              <label key={src} className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  value={src}
                  {...register('referral_source')}
                  className="h-4 w-4"
                />
                <span>{src}</span>
              </label>
            ))}
          </div>
        </div>

     <input type="hidden" {...register('longintroduction')} />
     <input type="hidden" {...register('experience')} />

        {/* submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? '제출 중...' : '제출하기'}
        </button>
      </form>
    </div>

  </div>
  );
}