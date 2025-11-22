// app/signup/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { email, username, password, role } = form;

    // Check email
    const { data: emailExists, error: emailErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailErr) {
      console.error(emailErr);
      setMessage('오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
      return;
    }
    if (emailExists) {
      setMessage('Error: 이미 사용 중인 이메일입니다.');
      setLoading(false);
      return;
    }

    // Check username
    const { data: userExists, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (userErr) {
      console.error(userErr);
      setMessage('오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
      return;
    }
    if (userExists) {
      setMessage('Error: 이미 사용 중인 아이디입니다.');
      setLoading(false);
      return;
    }

    // Sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, role },
        emailRedirectTo: 'https://www.ibmaster.net/',
      },
    });

    if (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
      setLoading(false);
    } else {
      // Redirect on success
        alert('계정 생성에 성공했습니다. 이메일 인증을 진행해주세요!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start pt-20 h-screen text-center px-4 min-h-screen mb-[10em]">
      <h1 className="text-2xl font-semibold mb-6">회원가입</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 w-full max-w-sm"
      >
        <input
          id="username"
          type="text"
          placeholder="아이디를 입력하세요"
          required
          value={form.username}
          onChange={handleChange}
          className="w-full p-3 border rounded"
        />
        <input
          id="email"
          type="email"
          placeholder="이메일을 입력하세요"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 border rounded"
        />
        <input
          id="password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          required
          value={form.password}
          onChange={handleChange}
          className="w-full p-3 border rounded"
        />

        <label htmlFor="role" className="mt-4">
          회원 유형 선택:
        </label>
        <select
          id="role"
          value={form.role}
          onChange={handleChange}
          className="w-full p-3 border rounded"
        >
          <option value="student">학생</option>
          <option value="teacher">선생님</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '처리 중…' : '계정 인증 이메일 보내기'}
        </button>
      </form>

      <p className="mt-4">
        이미 계정이 있으신가요?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          로그인하기
        </a>
      </p>

      {message && <p className="mt-4 text-red-600">{message}</p>}
    </div>
  );
}