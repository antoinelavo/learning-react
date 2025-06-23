'use client';

import { useState } from 'react';

export default function RoleSelectModal({ onSubmit }) {
  const [selectedRole, setSelectedRole] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-80 text-center">
        <h2 className="text-lg font-semibold mb-2">회원 유형 선택하기</h2>
        <p className="text-sm mb-4">계속하려면 회원 유형을 선택해주세요.</p>

        <div className="flex flex-col items-start mb-4 space-y-2">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="role"
              value="student"
              className="mr-2"
              onChange={(e) => setSelectedRole(e.target.value)}
            />
            학생
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="role"
              value="teacher"
              className="mr-2"
              onChange={(e) => setSelectedRole(e.target.value)}
            />
            선생님
          </label>
        </div>

        <button
          onClick={() => onSubmit(selectedRole)}
          disabled={!selectedRole}
          className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          제출하기
        </button>
      </div>
    </div>
  );
}